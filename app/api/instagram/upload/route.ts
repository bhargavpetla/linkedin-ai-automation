import { NextRequest, NextResponse } from 'next/server';
import { videoAnalysisService } from '@/lib/services/VideoAnalysisService';
import { costTracker } from '@/lib/services/CostTracker';
import { db_helpers } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const additionalContext = formData.get('description') as string | null;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'Video file is required' },
        { status: 400 }
      );
    }

    // Check budget (estimate)
    const estimatedCost = 0.02; // Whisper ~$0.006/min + Gemini ~$0.001
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

    // Save uploaded video to temp directory
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const baseTemp = process.env.VERCEL ? '/tmp' : process.cwd();
    const tempDir = path.join(baseTemp, 'temp');
    const videoPath = path.join(tempDir, `upload-${Date.now()}-${videoFile.name}`);

    await writeFile(videoPath, buffer);

    console.log('Video uploaded:', videoPath);

    // Analyze video (extract audio + transcribe + generate post)
    let result;
    try {
      result = await videoAnalysisService.analyzeVideoFromFile(
        videoPath,
        additionalContext || undefined
      );
    } finally {
      // Cleanup video file - Ensuring it happens even on error
      const fs = require('fs');
      if (fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
          console.log(`🗑️ Deleted uploaded temp file: ${videoPath}`);
        } catch (err) {
          console.error(`Failed to delete uploaded file: ${videoPath}`, err);
        }
      }
    }

    // Save to database
    const postId = await db_helpers.createPost({
      content: result.suggestedLinkedInPost,
      image_url: null,
      image_source: null,
      status: 'draft',
      source_type: 'instagram',
      source_data: JSON.stringify({
        videoFileName: videoFile.name,
        transcription: result.transcription?.substring(0, 500) + '...',
        additionalContext
      }),
      ai_cost: result.cost
    });
    const postIdNum = typeof postId === 'bigint' ? Number(postId) : Number(postId);

    // Track cost
    await costTracker.trackCost({
      service: 'openai',
      operation: 'whisper_transcription',
      cost: result.cost,
      postId: typeof postId === 'bigint' ? Number(postId) : (postId as number | undefined),
      metadata: {
        fileName: videoFile.name,
        hasContext: !!additionalContext
      }
    });

    // Add Log
    await db_helpers.addLog({
      process_type: 'reel_analysis',
      status: 'success',
      details: `Generated post from manual upload: ${videoFile.name}`,
      cost: result.cost,
      metadata: JSON.stringify({ fileName: videoFile.name, postId: postIdNum })
    });

    // Get updated budget
    const budgetSummary = await costTracker.getMonthlySummary();

    return NextResponse.json({
      success: true,
      analysis: {
        summary: result.summary,
        keyPoints: result.keyPoints,
        themes: result.themes,
        transcription: result.transcription
      },
      post: {
        id: postIdNum,
        content: result.suggestedLinkedInPost,
        tokensUsed: result.tokensUsed,
        cost: result.cost
      },
      budget: {
        totalCost: budgetSummary.totalCost,
        budgetUsed: budgetSummary.budgetUsed,
        budgetRemaining: budgetSummary.budgetRemaining,
        isNearBudget: budgetSummary.isNearBudget
      }
    });
  } catch (error: any) {
    console.error('Error analyzing Instagram reel:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze reel',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// File size limit configured in next.config.ts (serverActions.bodySizeLimit: '50mb')
