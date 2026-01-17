// Database schema for LinkedIn AI Automation Tool

export const SCHEMA = {
  posts: `
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      image_url TEXT,
      image_source TEXT, -- 'generated' | 'stock' | 'uploaded'
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'copied' | 'posted'
      source_type TEXT, -- 'instagram' | 'ai_research'
      source_data TEXT, -- JSON with Instagram URL or research topic
      ai_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  api_costs: `
    CREATE TABLE IF NOT EXISTS api_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL, -- 'openai' | 'gemini' | 'pexels'
      operation TEXT NOT NULL, -- 'generate_text' | 'generate_image' | 'analyze_video' | 'search_image'
      tokens_used INTEGER,
      cost REAL NOT NULL,
      post_id INTEGER,
      metadata TEXT, -- JSON with additional details
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )
  `,

  processing_logs: `
    CREATE TABLE IF NOT EXISTS processing_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_type TEXT NOT NULL, -- 'ai_post', 'reel_analysis', 'infographic'
      status TEXT NOT NULL, -- 'success', 'error'
      details TEXT, -- Summary or error message
      cost REAL DEFAULT 0,
      metadata TEXT, -- JSON with additional context
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Indexes for better query performance
  indexes: `
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_api_costs_service ON api_costs(service);
    CREATE INDEX IF NOT EXISTS idx_api_costs_created_at ON api_costs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_processing_logs_type ON processing_logs(process_type);
    CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at DESC);
  `
};

export type Post = {
  id: number;
  content: string;
  image_url: string | null;
  image_source: 'generated' | 'stock' | 'uploaded' | null;
  status: 'draft' | 'copied' | 'posted';
  source_type: 'instagram' | 'ai_research' | null;
  source_data: string | null; // JSON string
  ai_cost: number;
  created_at: string;
  updated_at: string;
};

export type ApiCost = {
  id: number;
  service: 'openai' | 'gemini' | 'pexels';
  operation: string;
  tokens_used: number | null;
  cost: number;
  post_id: number | null;
  metadata: string | null; // JSON string
  created_at: string;
};

export type CreatePost = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
export type CreateApiCost = Omit<ApiCost, 'id' | 'created_at'>;
