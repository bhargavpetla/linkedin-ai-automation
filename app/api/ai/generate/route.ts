import { NextRequest } from 'next/server';
import { costTracker } from '@/lib/services/CostTracker';
import { db_helpers } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';
import { LINKEDIN_POST_SYSTEM_PROMPT } from '@/lib/prompts/linkedin-templates';

/**
 * AI Research Mode API with Server-Sent Events (SSE)
 * Generates LinkedIn posts from topics with real-time progress
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { postContent, additionalContext } = body;

  if (!postContent || typeof postContent !== 'string' || postContent.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'postContent is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (step: string, message: string, progress: number, data?: any) => {
        const update = {
          step,
          message,
          progress,
          timestamp: new Date().toISOString(),
          data
        };
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(update, (_k, v) => typeof v === 'bigint' ? Number(v) : v)}\n\n`));
        } catch (error) {
          console.error('Error encoding SSE update:', error);
        }
      };

      try {
        const startTime = Date.now();
        sendUpdate('start', 'Starting Gemini post generation...', 0);

        // Step 1: Cost Estimation (10%)
        sendUpdate('estimate', 'Estimating API costs...', 10);
        const estimateStart = Date.now();

        const estimatedCost = 0.003; // approx Gemini minimal run

        const estimateTime = ((Date.now() - estimateStart) / 1000).toFixed(2);
        sendUpdate('estimate', `Cost estimated (${estimateTime}s)`, 15, {
          estimatedCost: `$${estimatedCost.toFixed(4)}`,
          model: 'gemini-2.5-flash'
        });

        // Step 2: Budget Check disabled
        sendUpdate('budget', 'Budget check disabled', 30, {});

        // Step 3: Build Prompt (35%)
        sendUpdate('prompt', 'Building Gemini system prompt...', 35);
        const promptStart = Date.now();
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!geminiKey) {
          sendUpdate('error', 'GEMINI_API_KEY not configured', 0);
          controller.close();
          return;
        }
        // New @google/genai SDK
        const genAI = new GoogleGenAI({ apiKey: geminiKey });
        const contentBlock = `CONTENT:\n${postContent}` + (additionalContext ? `\n\nADDITIONAL CONTEXT:\n${additionalContext}` : '');
        const fullPrompt = `${LINKEDIN_POST_SYSTEM_PROMPT}\n\n${contentBlock}`;
        const promptTime = ((Date.now() - promptStart) / 1000).toFixed(2);

        sendUpdate('prompt', `Prompt constructed (${promptTime}s)`, 45, {
          chars: fullPrompt.length
        });

        // Step 4: Generate Post (70-85%)
        sendUpdate('generate', 'Generating LinkedIn post with Gemini...', 70);
        const generateStart = Date.now();
        // New @google/genai SDK API
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt
        });
        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const content = responseText;
        const tokensUsed = Math.ceil((fullPrompt.length + content.length) / 4);
        const result = { content, tokensUsed, cost: estimatedCost, model: 'gemini-2.5-flash' };

        const generateTime = ((Date.now() - generateStart) / 1000).toFixed(2);

        sendUpdate('generate', `Post generated (${generateTime}s)`, 85, {
          wordCount: result.content.split(' ').length,
          tokensUsed: result.tokensUsed,
          model: result.model,
          preview: result.content.substring(0, 150) + '...'
        });

        // Step 5: Save & Log (90-100%)
        sendUpdate('save', 'Saving post to database...', 90);
        
        const postId = await db_helpers.createPost({
          content: result.content,
          status: 'draft',
          source_type: 'ai_research',
          source_data: JSON.stringify({ topic: postContent, additionalContext }),
          ai_cost: result.cost
        });
        const postIdNum = typeof postId === 'bigint' ? Number(postId) : Number(postId);

        // Track detailed cost
        await costTracker.trackCost({
          service: 'gemini',
          operation: 'generate_text',
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          postId: postIdNum,
          metadata: { model: result.model }
        });

        // Add Processing Log
        await db_helpers.addLog({
          process_type: 'ai_post',
          status: 'success',
          details: `Generated post about: ${postContent.substring(0, 50)}...`,
          cost: result.cost,
          metadata: JSON.stringify({ topic: postContent, postId: postIdNum })
        });

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        sendUpdate('complete', `Generation complete (${totalTime}s)!`, 100, {
          post: {
            id: postIdNum,
            content: result.content,
            cost: result.cost
          }
        });

      } catch (error: any) {
        console.error('Gemini generation failed:', error);
        
        // Log Error
        try {
          await db_helpers.addLog({
            process_type: 'ai_post',
            status: 'error',
            details: error.message,
            metadata: JSON.stringify({ topic: postContent })
          });
        } catch (logErr) {
          console.error('Failed to log error to DB:', logErr);
        }

        sendUpdate('error', `Generation failed: ${error.message}`, 0);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
