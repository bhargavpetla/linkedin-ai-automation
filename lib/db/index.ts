import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { SCHEMA } from './schema';

let client: Client | null = null;
let initPromise: Promise<void> | null = null;

export function getDatabase(): Client {
  if (client) {
    return client;
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  client = createClient({
    url,
    authToken,
  });

  return client;
}

export async function initializeDatabase(): Promise<void> {
  const db = getDatabase();

  // Create tables using batch for efficiency
  try {
    await db.execute(SCHEMA.posts);
    await db.execute(SCHEMA.api_costs);
    await db.execute(SCHEMA.processing_logs);
    
    // Split indexes into individual statements as execute doesn't like multiple in one go for some drivers
    const indexStatements = SCHEMA.indexes.split(';').filter(s => s.trim().length > 0);
    for (const stmt of indexStatements) {
      await db.execute(stmt);
    }

    console.log('✅ Database initialized successfully (Turso/libSQL)');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Ensure schema exists exactly once per runtime
export async function ensureDatabaseInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeDatabase()
      .catch((err) => {
        // Reset to allow retry on next call
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export function closeDatabase(): void {
  if (client) {
    client.close();
    client = null;
    console.log('Database connection closed');
  }
}

// Helper functions for common operations (now async for Turso/libSQL)
export const db_helpers = {
  // Posts
  createPost: async (post: any) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute({
      sql: `INSERT INTO posts (content, image_url, image_source, status, source_type, source_data, ai_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        post.content,
        post.image_url || null,
        post.image_source || null,
        post.status || 'draft',
        post.source_type || null,
        post.source_data || null,
        post.ai_cost || 0
      ]
    });
    return result.lastInsertRowid;
  },

  getPost: async (id: number) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute({
      sql: 'SELECT * FROM posts WHERE id = ?',
      args: [id]
    });
    return result.rows[0];
  },

  getAllPosts: async (limit = 50) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute({
      sql: 'SELECT * FROM posts ORDER BY created_at DESC LIMIT ?',
      args: [limit]
    });
    return result.rows;
  },

  updatePost: async (id: number, updates: any) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const sql = `UPDATE posts SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    return await db.execute({ sql, args: values as any[] });
  },

  deletePost: async (id: number) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    return await db.execute({
      sql: 'DELETE FROM posts WHERE id = ?',
      args: [id]
    });
  },

  // API Costs
  trackCost: async (cost: any) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute({
      sql: `INSERT INTO api_costs (service, operation, tokens_used, cost, post_id, metadata)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        cost.service,
        cost.operation,
        cost.tokens_used || null,
        cost.cost,
        cost.post_id || null,
        cost.metadata || null
      ]
    });
    return result.lastInsertRowid;
  },

  // Processing Logs
  addLog: async (log: any) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute({
      sql: `INSERT INTO processing_logs (process_type, status, details, cost, metadata)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        log.process_type,
        log.status,
        log.details || null,
        log.cost || 0,
        log.metadata || null
      ]
    });
    return result.lastInsertRowid;
  },

  getLogs: async (limit = 100) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute({
      sql: 'SELECT * FROM processing_logs ORDER BY created_at DESC LIMIT ?',
      args: [limit]
    });
    return result.rows;
  },

  getCostSummary: async (startDate?: string, endDate?: string) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    let sql = `
      SELECT
        service,
        SUM(cost) as total_cost,
        COUNT(*) as call_count,
        SUM(tokens_used) as total_tokens
      FROM api_costs
    `;
    let args: any[] = [];

    if (startDate && endDate) {
      sql += ` WHERE created_at BETWEEN ? AND ?`;
      args = [startDate, endDate];
    }

    sql += ` GROUP BY service`;
    const result = await db.execute({ sql, args });
    return result.rows;
  },

  getTotalCostThisMonth: async () => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute(`
      SELECT SUM(cost) as total
      FROM api_costs
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);
    const row = result.rows[0];
    return Number(row?.total || 0);
  },

  getRecentCosts: async (limit = 20) => {
    await ensureDatabaseInitialized();
    const db = getDatabase();
    const result = await db.execute({
      sql: 'SELECT * FROM api_costs ORDER BY created_at DESC LIMIT ?',
      args: [limit]
    });
    return result.rows;
  }
};

export default getDatabase;
