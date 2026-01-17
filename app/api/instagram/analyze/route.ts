import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { videoAnalysisService } from '@/lib/services/VideoAnalysisService';
import { costTracker } from '@/lib/services/CostTracker';
import { db_helpers } from '@/lib/db';
import { instagramDownloader } from '@/lib/services/InstagramDownloader';

/**
 * Instagram Reel Analysis API with Server-Sent Events (SSE)
 * Downloads, transcribes, and analyzes Instagram reels with real-time progress
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { videoDescription, videoUrl } = body;

  if (!videoDescription && !videoUrl) {
    return new Response(
      JSON.stringify({ error: 'Either video description or URL is required' }),
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
        } catch (error) {
          console.error('Error encoding SSE update:', error);
        }
      };

      try {
        const startTime = Date.now();
        sendUpdate('start', 'Starting Instagram reel analysis...', 0);

        // Step 1: Budget Check skipped
        sendUpdate('budget', 'Budget check disabled', 10, {
          estimatedCost: '$0.000'
        });

        let result;
        let downloadDebug = null;
        let downloadedFilePath: string | null = null;
        let totalCost = 0;

        try {
          // Step 2: Download Reel (if URL provided)
          if (videoUrl && videoUrl.includes('instagram.com')) {
            sendUpdate('download', 'Downloading Instagram reel...', 15);
            const downloadStart = Date.now();

            const downloadResult = await instagramDownloader.downloadReel(videoUrl);
            downloadDebug = downloadResult.debugInfo;

            const downloadTime = ((Date.now() - downloadStart) / 1000).toFixed(2);

            if (downloadResult.success && downloadResult.filePath) {
              downloadedFilePath = downloadResult.filePath;
              sendUpdate('download', `Download complete (${downloadTime}s)`, 25, {
                filePath: downloadResult.filePath,
                method: downloadDebug?.attempts?.[0]?.method
              });

              // Step 3: Extract Audio (30-40%)
              sendUpdate('audio', 'Extracting audio from video...', 30);
              const audioStart = Date.now();

              try {
                result = await videoAnalysisService.analyzeVideoFromFile(
                  downloadResult.filePath,
                  videoDescription
                );

                const audioTime = ((Date.now() - audioStart) / 1000).toFixed(2);
                sendUpdate('audio', `Audio extracted (${audioTime}s)`, 40);

              } catch (error: any) {
                sendUpdate('audio', 'Audio extraction failed, using description fallback', 40, {
                  warning: error.message
                });

                if (!videoDescription) {
                  sendUpdate('error', 'No description provided for fallback', 0, {
                    error: 'Audio extraction failed and no description provided'
                  });
                  controller.close();
                  return;
                }

                result = await videoAnalysisService.analyzeVideoFromDescription(
                  videoDescription,
                  videoUrl
                );
              }
            } else {
              // Fallback to description if download fails
              sendUpdate('download', 'Download failed, using description fallback', 25, {
                error: downloadResult.error
              });

              if (!videoDescription) {
                sendUpdate('error', 'No description provided for fallback', 0, {
                  error: 'Download failed and no description provided'
                });
                controller.close();
                return;
              }

              result = await videoAnalysisService.analyzeVideoFromDescription(
                videoDescription,
                videoUrl
              );
            }
          } else {
            // Use description only
            sendUpdate('analysis', 'Analyzing from description...', 20);
            result = await videoAnalysisService.analyzeVideoFromDescription(
              videoDescription,
              videoUrl
            );
          }

          if (result && result.suggestedLinkedInPost) {
            totalCost = result.cost || 0;
            const postId = await db_helpers.createPost({
              content: result.suggestedLinkedInPost,
              status: 'draft',
              source_type: 'instagram',
              source_data: JSON.stringify({
                url: videoUrl,
                description: videoDescription,
                method: downloadedFilePath ? 'video' : 'description'
              }),
              ai_cost: totalCost
            });

            // Track detailed cost if available
            if (totalCost > 0) {
              await costTracker.trackCost({
                service: 'gemini',
                operation: 'reel_analysis',
                cost: totalCost,
                postId: typeof postId === 'bigint' ? Number(postId) : (postId as number | undefined)
              });
            }

            // Add Processing Log
            await db_helpers.addLog({
              process_type: 'reel_analysis',
              status: 'success',
              details: `Generated post from ${downloadedFilePath ? 'reel download' : 'description'}.`,
              cost: totalCost,
              metadata: JSON.stringify({ videoUrl, postId })
            });

            sendUpdate('complete', 'Post generated successfully!', 100, {
              post: {
                id: postId,
                content: result.suggestedLinkedInPost,
                cost: totalCost
              },
              transcription: result.transcription
            });
          }
        } finally {
          // Cleanup temp files
          if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
            try {
              fs.unlinkSync(downloadedFilePath);
              console.log(`🗑️ Deleted temp file: ${downloadedFilePath}`);
            } catch (err) {
              console.error(`Failed to delete temp file: ${downloadedFilePath}`, err);
            }
          }
        }
      } catch (error: any) {
        console.error('Reel analysis failed:', error);
        
        // Log Error
        try {
          await db_helpers.addLog({
            process_type: 'reel_analysis',
            status: 'error',
            details: error.message,
            metadata: JSON.stringify({ videoUrl })
          });
        } catch (logErr) {
          console.error('Failed to log error to DB:', logErr);
        }

        sendUpdate('error', `Analysis failed: ${error.message}`, 0);
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
