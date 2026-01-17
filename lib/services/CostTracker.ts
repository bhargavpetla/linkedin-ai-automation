import { getDatabase, db_helpers } from '../db';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export interface CostEntry {
  service: 'openai' | 'gemini' | 'pexels';
  operation: string;
  tokensUsed?: number;
  cost: number;
  postId?: number;
  metadata?: Record<string, any>;
}

export interface CostSummary {
  totalCost: number;
  byService: {
    service: string;
    cost: number;
    calls: number;
  }[];
  byDay: {
    date: string;
    cost: number;
  }[];
  monthlyBudget: number;
  budgetUsed: number;
  budgetRemaining: number;
  alertThreshold: number;
  isNearBudget: boolean;
  isOverBudget: boolean;
}

export interface DailyCostLimit {
  limit: number;
  current: number;
  remaining: number;
  isExceeded: boolean;
}

class CostTracker {
  private readonly MONTHLY_BUDGET: number;
  private readonly ALERT_THRESHOLD: number;
  private readonly DAILY_LIMIT: number;

  constructor() {
    this.MONTHLY_BUDGET = parseFloat(process.env.MONTHLY_BUDGET_LIMIT || '10.00');
    this.ALERT_THRESHOLD = parseFloat(process.env.ALERT_THRESHOLD || '8.00');
    this.DAILY_LIMIT = this.MONTHLY_BUDGET / 30; // Rough daily limit
  }

  /**
   * Track a new API cost
   */
  async trackCost(entry: CostEntry): Promise<number> {
    const db = getDatabase();

    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : null;

    const result = await db_helpers.trackCost({
      service: entry.service,
      operation: entry.operation,
      tokens_used: entry.tokensUsed || null,
      cost: entry.cost,
      post_id: entry.postId || null,
      metadata
    });

    // Check if we're near budget limit
    const monthlyTotal = await this.getMonthlyTotal();
    if (monthlyTotal >= this.ALERT_THRESHOLD && monthlyTotal < this.MONTHLY_BUDGET) {
      console.warn(`⚠️ Cost alert: $${monthlyTotal.toFixed(2)} spent this month (${((monthlyTotal / this.MONTHLY_BUDGET) * 100).toFixed(0)}% of budget)`);
    } else if (monthlyTotal >= this.MONTHLY_BUDGET) {
      console.error(`🚨 Budget exceeded: $${monthlyTotal.toFixed(2)} spent this month!`);
    }

    return result as number;
  }

  /**
   * Get total cost for current month
   */
  async getMonthlyTotal(): Promise<number> {
    return await db_helpers.getTotalCostThisMonth();
  }

  /**
   * Get total cost for today
   */
  async getDailyTotal(): Promise<number> {
    const db = getDatabase();
    const today = format(new Date(), 'yyyy-MM-dd');

    const result = await db.execute({
      sql: `SELECT SUM(cost) as total
            FROM api_costs
            WHERE date(created_at) = ?`,
      args: [today]
    });

    const row = result.rows[0];
    return Number(row?.total || 0);
  }

  /**
   * Get cost summary for current month
   */
  async getMonthlySummary(): Promise<CostSummary> {
    const db = getDatabase();
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd HH:mm:ss');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd HH:mm:ss');

    // Total by service
    const byServiceResult = await db.execute({
      sql: `SELECT
              service,
              SUM(cost) as cost,
              COUNT(*) as calls
            FROM api_costs
            WHERE created_at BETWEEN ? AND ?
            GROUP BY service`,
      args: [monthStart, monthEnd]
    });
    const byService = byServiceResult.rows as any[];

    // Total by day
    const byDayResult = await db.execute({
      sql: `SELECT
              date(created_at) as date,
              SUM(cost) as cost
            FROM api_costs
            WHERE created_at BETWEEN ? AND ?
            GROUP BY date(created_at)
            ORDER BY date(created_at) DESC`,
      args: [monthStart, monthEnd]
    });
    const byDay = byDayResult.rows as any[];

    const totalCost = byService.reduce((sum, item) => sum + parseFloat(item.cost), 0);
    const budgetUsed = (totalCost / this.MONTHLY_BUDGET) * 100;
    const budgetRemaining = Math.max(0, this.MONTHLY_BUDGET - totalCost);

    return {
      totalCost,
      byService: byService.map(item => ({
        service: item.service,
        cost: parseFloat(item.cost),
        calls: item.calls
      })),
      byDay: byDay.map(item => ({
        date: item.date,
        cost: parseFloat(item.cost)
      })),
      monthlyBudget: this.MONTHLY_BUDGET,
      budgetUsed: Math.round(budgetUsed * 10) / 10,
      budgetRemaining,
      alertThreshold: this.ALERT_THRESHOLD,
      isNearBudget: totalCost >= this.ALERT_THRESHOLD,
      isOverBudget: totalCost >= this.MONTHLY_BUDGET
    };
  }

  /**
   * Get recent cost entries
   */
  async getRecentCosts(limit: number = 20): Promise<any[]> {
    return await db_helpers.getRecentCosts(limit);
  }

  /**
   * Check daily spending limit
   */
  async checkDailyLimit(): Promise<DailyCostLimit> {
    const current = await this.getDailyTotal();
    const remaining = Math.max(0, this.DAILY_LIMIT - current);

    return {
      limit: this.DAILY_LIMIT,
      current,
      remaining,
      isExceeded: current >= this.DAILY_LIMIT
    };
  }

  /**
   * Check if operation is within budget
   */
  async canAfford(estimatedCost: number): Promise<{ allowed: boolean; reason?: string }> {
    const monthlyTotal = await this.getMonthlyTotal();
    const dailyTotal = await this.getDailyTotal();

    // Check monthly budget
    if (monthlyTotal + estimatedCost > this.MONTHLY_BUDGET) {
      return {
        allowed: false,
        reason: `Monthly budget exceeded. Used: $${monthlyTotal.toFixed(2)}/$${this.MONTHLY_BUDGET.toFixed(2)}`
      };
    }

    // Check daily limit
    if (dailyTotal + estimatedCost > this.DAILY_LIMIT * 1.5) { // Allow 50% buffer
      return {
        allowed: false,
        reason: `Daily limit exceeded. Used: $${dailyTotal.toFixed(2)} today`
      };
    }

    return { allowed: true };
  }

  /**
   * Get cost breakdown by operation type
   */
  async getCostByOperation(startDate?: string, endDate?: string): Promise<any[]> {
    const db = getDatabase();

    let sql = `
      SELECT
        operation,
        COUNT(*) as count,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost,
        SUM(tokens_used) as total_tokens
      FROM api_costs
    `;
    let args: any[] = [];

    if (startDate && endDate) {
      sql += ` WHERE created_at BETWEEN ? AND ?`;
      args = [startDate, endDate];
    }

    sql += ` GROUP BY operation ORDER BY total_cost DESC`;
    const result = await db.execute({ sql, args });
    return result.rows as any[];
  }

  /**
   * Get estimated remaining posts this month
   */
  async getEstimatedRemainingPosts(avgCostPerPost: number = 0.10): Promise<number> {
    const remaining = (await this.getMonthlySummary()).budgetRemaining;
    return Math.floor(remaining / avgCostPerPost);
  }

  /**
   * Export cost data as CSV
   */
  async exportToCSV(startDate: string, endDate: string): Promise<string> {
    const db = getDatabase();

    const result = await db.execute({
      sql: `SELECT
              datetime(created_at) as timestamp,
              service,
              operation,
              tokens_used,
              cost,
              post_id
            FROM api_costs
            WHERE created_at BETWEEN ? AND ?
            ORDER BY created_at DESC`,
      args: [startDate, endDate]
    });

    const rows = result.rows as any[];

    // Create CSV
    const headers = ['Timestamp', 'Service', 'Operation', 'Tokens', 'Cost', 'Post ID'];
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        [
          row.timestamp,
          row.service,
          row.operation,
          row.tokens_used || '',
          row.cost,
          row.post_id || ''
        ].join(',')
      )
    ].join('\n');

    return csv;
  }

  /**
   * Reset monthly tracking (for testing)
   */
  async resetMonthlyTracking(): Promise<void> {
    const db = getDatabase();
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd HH:mm:ss');

    await db.execute({
      sql: `DELETE FROM api_costs
            WHERE created_at >= ?`,
      args: [monthStart]
    });
    console.log('Monthly cost tracking reset');
  }

  /**
   * Get budget health status
   */
  async getBudgetHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    percentage: number;
  }> {
    const summary = await this.getMonthlySummary();
    const percentage = summary.budgetUsed;

    if (percentage >= 100) {
      return {
        status: 'critical',
        message: 'Budget exceeded! Consider optimizing usage or increasing budget.',
        percentage
      };
    } else if (percentage >= 80) {
      return {
        status: 'warning',
        message: 'Approaching budget limit. Monitor usage closely.',
        percentage
      };
    } else {
      return {
        status: 'healthy',
        message: 'Budget usage is within normal range.',
        percentage
      };
    }
  }
}

// Export singleton instance
export const costTracker = new CostTracker();
export default CostTracker;
