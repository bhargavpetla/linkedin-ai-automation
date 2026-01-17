import { NextRequest, NextResponse } from 'next/server';
import { costTracker } from '@/lib/services/CostTracker';

export async function GET(request: NextRequest) {
  try {
    const summary = await costTracker.getMonthlySummary();
    const dailyLimit = await costTracker.checkDailyLimit();
    const budgetHealth = await costTracker.getBudgetHealth();
    const recentCosts = await costTracker.getRecentCosts(10);

    return NextResponse.json({
      success: true,
      summary,
      dailyLimit,
      budgetHealth,
      recentCosts
    });
  } catch (error: any) {
    console.error('Error fetching cost summary:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch cost summary',
        message: error.message
      },
      { status: 500 }
    );
  }
}
