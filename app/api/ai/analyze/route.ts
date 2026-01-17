import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/AIService';
import { costTracker } from '@/lib/services/CostTracker';
import { db_helpers } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post } = body;

    // Validation
    if (!post) {
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      );
    }

    // Check budget (estimate ~$0.02 for analysis using GPT-3.5)
    const estimatedCost = 0.02;
    const budgetCheck = await costTracker.canAfford(estimatedCost);
    if (!budgetCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Budget limit reached',
          reason: budgetCheck.reason
        },
        { status: 402 }
      );
    }

    // Analyze content
    const analysis = await aiService.analyzePost(post);

    // Track cost (rough estimate since we don't get token count from analysis)
    await costTracker.trackCost({
      service: 'openai',
      operation: 'analyze_post',
      tokensUsed: 200, // Rough estimate
      cost: estimatedCost,
      metadata: {
        overallScore: analysis.overallScore
      }
    });

    // Add Log
    await db_helpers.addLog({
      process_type: 'post_analysis',
      status: 'success',
      details: `Analyzed post: ${post.substring(0, 50)}...`,
      cost: estimatedCost,
      metadata: JSON.stringify({ overallScore: analysis.overallScore })
    });

    return NextResponse.json({
      success: true,
      analysis: {
        scores: analysis.scores,
        overallScore: analysis.overallScore,
        suggestions: analysis.suggestions
      }
    });
  } catch (error: any) {
    console.error('Error analyzing post:', error);

    // Log Error
    try {
      await db_helpers.addLog({
        process_type: 'post_analysis',
        status: 'error',
        details: error.message
      });
    } catch (logErr) {}

    return NextResponse.json(
      {
        error: 'Failed to analyze post',
        message: error.message
      },
      { status: 500 }
    );
  }
}
