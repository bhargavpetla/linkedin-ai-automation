import { NextRequest } from 'next/server';
import { imageService } from '@/lib/services/ImageService';
import { costTracker } from '@/lib/services/CostTracker';

/**
 * Post-Based Infographic Generation API with Server-Sent Events (SSE)
 *
 * NEW ARCHITECTURE (2025):
 * - Analyzes post content using AI to extract topics, metrics, and key points
 * - Automatically determines optimal visual style based on content type
 * - Generates tech-focused LinkedIn infographics using Gemini Imagen
 * - Follows best practices for professional tech content
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { postContent, options } = body;

  if (!postContent) {
    return new Response(
      JSON.stringify({ error: 'Post content is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (step: string, message: string, progress: number, data?: any) => {
        // Remove large base64 data from SSE to prevent JSON parse errors
        let cleanData = data;
        if (data) {
          cleanData = { ...data };
          if (cleanData.imageBase64) {
            delete cleanData.imageBase64;
          }
          // Truncate long strings
          if (cleanData.prompt && cleanData.prompt.length > 500) {
            cleanData.promptPreview = cleanData.prompt.substring(0, 500) + '...';
            delete cleanData.prompt;
          }
        }

        const update = {
          step,
          message,
          progress,
          timestamp: new Date().toISOString(),
          data: cleanData
        };

        try {
          const jsonString = JSON.stringify(update);
          controller.enqueue(encoder.encode(`data: ${jsonString}\n\n`));
        } catch (error: any) {
          console.error('Error encoding SSE update:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            step: 'error',
            message: 'Failed to encode data',
            progress: 0,
            timestamp: new Date().toISOString()
          })}\n\n`));
        }
      };

      try {
        const startTime = Date.now();
        sendUpdate('start', 'Starting post-based image generation...', 0);

        // Step 1: Content Analysis
        sendUpdate('analysis', 'Analyzing post content with AI...', 10);
        const analysisStart = Date.now();

        const analysis = await imageService.analyzePostContent(postContent);
        const analysisTime = ((Date.now() - analysisStart) / 1000).toFixed(2);

        sendUpdate('analysis', `Content analyzed: "${analysis.mainTopic}" (${analysisTime}s)`, 25, {
          mainTopic: analysis.mainTopic,
          tone: analysis.tone,
          contentType: analysis.contentType,
          keyPoints: analysis.keyPoints.slice(0, 3),
          metrics: analysis.keyMetrics
        });

        // Step 2: Style Determination
        sendUpdate('style', 'Determining optimal visual style...', 35);

        const styleMapping: Record<string, string> = {
          'framework': 'icon-grid',
          'tips': 'minimal-data',
          'case-study': 'chart-focus',
          'comparison': 'chart-focus',
          'announcement': 'gradient-abstract',
          'insight': 'conceptual'
        };

        const selectedStyle = styleMapping[analysis.contentType] || 'minimal-data';

        const colorMapping: Record<string, string> = {
          'data-driven': 'tech-blue',
          'inspirational': 'modern-gradient',
          'contrarian': 'dark-mode',
          'educational': 'clean-white',
          'storytelling': 'vibrant-tech'
        };

        const selectedColors = colorMapping[analysis.tone] || 'tech-blue';

        sendUpdate('style', `Style: ${selectedStyle}, Colors: ${selectedColors}`, 45, {
          style: selectedStyle,
          colorScheme: selectedColors,
          visualConcept: analysis.visualConcept
        });

        // Step 3: Prompt Generation (Bhargav Architect)
        sendUpdate('prompt', 'Building Bhargav Architect infographic prompt...', 55);
        const promptStart = Date.now();

        const prompt = imageService.buildBhargavArchitectPrompt(postContent, analysis);
        const promptTime = ((Date.now() - promptStart) / 1000).toFixed(2);

        sendUpdate('prompt', `Prompt generated (${promptTime}s)`, 65, {
          promptPreview: prompt.substring(0, 400) + '...',
          techKeywords: analysis.techKeywords
        });

        // Step 4: Image Generation with Gemini Imagen
        sendUpdate('generation', 'Generating infographic with Gemini Imagen...', 70);
        const genStart = Date.now();

        const result = await imageService.generateImageFromPost(postContent);
        const genTime = ((Date.now() - genStart) / 1000).toFixed(2);

        sendUpdate('generation', `Image generated successfully (${genTime}s)`, 90);

        // Step 5: Cost Tracking
        sendUpdate('tracking', 'Recording API costs...', 95);

        if (result.cost > 0) {
          await costTracker.trackCost({
            service: 'gemini',
            operation: 'generate_post_infographic',
            cost: result.cost,
            metadata: {
              mainTopic: analysis.mainTopic,
              contentType: analysis.contentType,
              style: selectedStyle,
              promptPreview: prompt.substring(0, 100)
            }
          });
        }

        // Add Processing Log
        await db_helpers.addLog({
          process_type: 'infographic',
          status: 'success',
          details: `Generated infographic for: ${analysis.mainTopic}`,
          cost: result.cost,
          metadata: JSON.stringify({ topic: analysis.mainTopic, style: selectedStyle })
        });

        sendUpdate('complete', 'Infographic generation complete!', 100, {
          imageUrl: result.imageUrl,
          cost: result.cost,
          analysis,
          style: {
            selected: selectedStyle,
            colors: selectedColors
          },
          prompt
        });

      } catch (error: any) {
        console.error('Infographic generation failed:', error);
        
        // Log Error
        try {
          await db_helpers.addLog({
            process_type: 'infographic',
            status: 'error',
            details: error.message,
            metadata: JSON.stringify({ postContentPreview: postContent.substring(0, 100) })
          });
        } catch (logErr) {}

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

/**
 * GET endpoint for simple image generation (non-streaming)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postContent = searchParams.get('content');

  if (!postContent) {
    return new Response(
      JSON.stringify({ error: 'Content parameter is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await imageService.generateImageFromPost(postContent);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: result.imageUrl,
        analysis: result.analysis,
        cost: result.cost
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
