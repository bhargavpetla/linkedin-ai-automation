import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { videoAnalysisService } from '@/lib/services/VideoAnalysisService';
import { db_helpers } from '@/lib/db';
import { costTracker } from '@/lib/services/CostTracker';

// DEBUG/DEV: Analyze an existing local file in temp/ directly
// POST body: { filePath: string, description?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, description } = body || {};

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
    }

    // Only allow files under process.cwd()/temp for safety
    const tempDir = path.join(process.cwd(), 'temp');
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(tempDir)) {
      return NextResponse.json({ error: 'filePath must be under temp directory' }, { status: 400 });
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: 'File not found at path', filePath: resolved }, { status: 404 });
    }

    const result = await videoAnalysisService.analyzeVideoFromFile(resolved, description);

    const postId = await db_helpers.createPost({
      content: result.suggestedLinkedInPost,
      image_url: null,
      image_source: null,
      status: 'draft',
      source_type: 'instagram',
      source_data: JSON.stringify({ filePath: resolved, description }),
      ai_cost: result.cost,
    });
    const postIdNum = typeof postId === 'bigint' ? Number(postId) : Number(postId);

    await costTracker.trackCost({
      service: 'openai',
      operation: 'whisper_transcription',
      cost: result.cost,
      postId: typeof postId === 'bigint' ? Number(postId) : (postId as number | undefined),
      metadata: { localFile: true },
    });

    // Add Log
    await db_helpers.addLog({
      process_type: 'reel_analysis',
      status: 'success',
      details: `Analyzed local file: ${path.basename(resolved)}`,
      cost: result.cost,
      metadata: JSON.stringify({ fileName: path.basename(resolved), postId: postIdNum })
    });

    const budgetSummary = await costTracker.getMonthlySummary();

    return NextResponse.json({
      success: true,
      analysis: {
        summary: result.summary,
        keyPoints: result.keyPoints,
        themes: result.themes,
        transcription: result.transcription,
      },
      post: {
        id: postIdNum,
        content: result.suggestedLinkedInPost,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
      budget: {
        totalCost: budgetSummary.totalCost,
        budgetUsed: budgetSummary.budgetUsed,
        budgetRemaining: budgetSummary.budgetRemaining,
        isNearBudget: budgetSummary.isNearBudget,
      },
      debug: {
        localFilePath: resolved,
        isAudio: ['.m4a','.mp3','.aac','.wav','.ogg','.flac','.mpega'].includes(path.extname(resolved).toLowerCase()),
      }
    });
  } catch (error: any) {
    console.error('Error in analyze-local:', error);
    return NextResponse.json({ error: 'Failed to analyze local file', message: error.message }, { status: 500 });
  }
}
