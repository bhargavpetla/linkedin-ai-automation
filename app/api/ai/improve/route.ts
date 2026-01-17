import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/AIService';
import { costTracker } from '@/lib/services/CostTracker';
import { db_helpers } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalPost, feedbackPoints, postId } = body;

    // Validation
    if (!originalPost || !feedbackPoints || feedbackPoints.length === 0) {
      return NextResponse.json(
        { error: 'Original post and feedback points are required' },
        { status: 400 }
      );
    }

    // Check budget (estimate ~$0.05 for improvement)
    const estimatedCost = 0.05;
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

    // Improve content
    const result = await aiService.improvePost({
      originalPost,
      feedbackPoints
    });

    // Update post in database if postId provided
    if (postId) {
      await db_helpers.updatePost(postId, {
        content: result.content,
        ai_cost: result.cost
      });
    }

    // Track cost
    await costTracker.trackCost({
      service: 'gemini',
      operation: 'improve_text',
      cost: estimatedCost,
      postId: postId || undefined
    });

    // Add Log
    await db_helpers.addLog({
      process_type: 'ai_post',
      status: 'success',
      details: `Improved post: ${result.content.substring(0, 50)}...`,
      cost: estimatedCost,
      metadata: JSON.stringify({
        postId,
        originalContent: originalPost.substring(0, 100)
      })
    });

    return Response.json({
      success: true,
      improvedPost: result.content,
      cost: estimatedCost
    });
  } catch (error: any) {
    console.error('Gemini improvement failed:', error);

    // Log Error
    try {
      await db_helpers.addLog({
        process_type: 'ai_post',
        status: 'error',
        details: error.message,
        metadata: JSON.stringify({
          originalContent: originalPost?.substring(0, 100)
        })
      });
    } catch (logErr) {}

    return Response.json(
      { error: 'Failed to improve post: ' + error.message },
      { status: 500 }
    );
  }
}
