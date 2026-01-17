'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Copy, CheckCircle2, DollarSign, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import InfographicGenerator from '@/components/InfographicGenerator';
import ProcessTracker, { ProcessStep } from '@/components/ProcessTracker';

const TEMPLATES = [
  { value: 'personal_story', label: 'Personal Story' },
  { value: 'framework_post', label: 'Framework' },
  { value: 'how_to', label: 'How-To Guide' },
  { value: 'contrarian_take', label: 'Contrarian View' },
  { value: 'stats_driven', label: 'Data-Driven' },
  { value: 'client_win', label: 'Success Story' },
  { value: 'trend_analysis', label: 'Trend Analysis' }
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'inspirational', label: 'Inspirational' }
];

export default function CreatePage() {
  // Common state
  const [generatedPost, setGeneratedPost] = useState('');
  const [postId, setPostId] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [budget, setBudget] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Research state
  const [topic, setTopic] = useState(''); // used as post context
  const [additionalContext, setAdditionalContext] = useState('');

  // Instagram state
  const [videoDescription, setVideoDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url');

  // Debug state
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [transcription, setTranscription] = useState('');

  // SSE Progress tracking
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [stepMessage, setStepMessage] = useState('');

  // Infographic state
  const [showInfographic, setShowInfographic] = useState(false);

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setProgressLogs([]);
    setCurrentProgress(0);
    setCurrentStep('');
    setStepMessage('');

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent: topic, additionalContext })
      });

      if (!response.ok) {
        toast.error('Failed to generate');
        return;
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        toast.error('Stream not available');
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Update progress
              setCurrentProgress(data.progress);
              setCurrentStep(data.step);
              setStepMessage(data.message);

              // Add to logs
              setProgressLogs(prev => [...prev, {
                step: data.step,
                message: data.message,
                timestamp: data.timestamp,
                data: data.data
              }]);

              // Handle completion
              if (data.step === 'complete' && data.data?.post) {
                setGeneratedPost(data.data.post.content);
                setPostId(data.data.post.id);
                setCost(data.data.post.cost || 0);

                toast.success('Post generated!');
                setShowInfographic(true);
              }

              // Handle errors
              if (data.step === 'error') {
                toast.error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      toast.error('Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromReel = async () => {
    if (!videoUrl.trim() && uploadMode === 'url') {
      toast.error('Please provide Instagram reel URL');
      return;
    }

    if (!videoFile && uploadMode === 'file') {
      toast.error('Please upload a video file');
      return;
    }

    setIsGenerating(true);
    setProgressLogs([]);
    setCurrentProgress(0);
    setCurrentStep('');
    setStepMessage('');
    setDebugInfo(null);

    try {
      const response = await fetch('/api/instagram/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoDescription: videoDescription || undefined,
          videoUrl: uploadMode === 'url' ? videoUrl : undefined
        })
      });

      if (!response.ok) {
        toast.error('Failed to analyze reel');
        return;
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        toast.error('Stream not available');
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Update progress
              setCurrentProgress(data.progress);
              setCurrentStep(data.step);
              setStepMessage(data.message);

              // Add to logs
              setProgressLogs(prev => [...prev, {
                step: data.step,
                message: data.message,
                timestamp: data.timestamp,
                data: data.data
              }]);

              // Handle completion
              if (data.step === 'complete' && data.data?.post) {
                setGeneratedPost(data.data.post.content);
                setPostId(data.data.post.id);
                setCost(data.data.post.cost || 0);
                setTranscription(data.data.transcription || '');

                toast.success('Post generated from reel!');
                setShowInfographic(true);
              }

              // Handle errors
              if (data.step === 'error') {
                toast.error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      toast.error('Failed to analyze reel');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };


  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-gray-400 hover:text-white mb-2 inline-block transition-colors">
              ← Back
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[oklch(0.65_0.2_50)] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(126,211,33,0.3)]">
              Create LinkedIn Post
            </h1>
          </div>

          {budget && (
            <Card className={`min-w-[200px] border bg-card/60 backdrop-blur-sm ${budget.isNearBudget ? 'border-[oklch(0.65_0.2_50)]/50' : 'border-primary/50'}`}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-gray-300">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${budget.totalCost.toFixed(2)}</div>
                <div className="text-xs text-gray-400">{budget.budgetUsed.toFixed(1)}% used</div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <Card className="bg-card/60 backdrop-blur-md border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Content Source</CardTitle>
                <CardDescription className="text-gray-400">Choose how to generate your post</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ai" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                    <TabsTrigger value="ai" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Research
                    </TabsTrigger>
                    <TabsTrigger value="instagram" className="data-[state=active]:bg-[oklch(0.6_0.2_300)] data-[state=active]:text-white">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram Reel
                    </TabsTrigger>
                  </TabsList>

                  {/* AI Research Tab */}
                  <TabsContent value="ai" className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Post Context *</Label>
                      <Input
                        placeholder="Paste transcript or notes to synthesize into a LinkedIn post..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Additional Context (Optional)</Label>
                      <Textarea
                        placeholder="Add specific details..."
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        rows={3}
                        className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-primary"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateFromTopic}
                      disabled={isGenerating || !topic.trim()}
                      className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                      size="lg"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate Post
                    </Button>
                  </TabsContent>

                  {/* Instagram Reel Tab */}
                  <TabsContent value="instagram" className="space-y-4">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg border border-white/5">
                      <button
                        onClick={() => setUploadMode('url')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          uploadMode === 'url'
                            ? 'bg-card shadow-sm text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        From URL (Auto-download)
                      </button>
                      <button
                        onClick={() => setUploadMode('file')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          uploadMode === 'file'
                            ? 'bg-card shadow-sm text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Upload File
                      </button>
                    </div>

                    {uploadMode === 'url' ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-gray-200">Instagram Reel URL *</Label>
                          <Input
                            placeholder="https://www.instagram.com/reel/..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[oklch(0.6_0.2_300)]"
                          />
                          <p className="text-xs text-gray-500">
                            Reel will be auto-downloaded and audio transcribed with Whisper
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-200">Description (Recommended if download fails)</Label>
                          <Textarea
                            placeholder="Describe the reel content - what's happening, main message, key points? This helps as a fallback if the download fails."
                            value={videoDescription}
                            onChange={(e) => setVideoDescription(e.target.value)}
                            rows={3}
                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[oklch(0.6_0.2_300)]"
                          />
                          <p className="text-xs text-gray-500">
                            If the reel can't be downloaded (privacy settings), we'll analyze based on this description
                          </p>
                        </div>

                        <Button
                          onClick={handleGenerateFromReel}
                          disabled={isGenerating || !videoUrl.trim()}
                          className="w-full bg-[oklch(0.6_0.2_300)] text-white hover:bg-[oklch(0.6_0.2_300)]/90"
                          size="lg"
                        >
                          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Instagram className="w-4 h-4 mr-2" />}
                          Download & Transcribe
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label className="text-gray-200">Upload Instagram Reel</Label>
                          <div className="border-2 border-dashed border-white/10 bg-black/20 rounded-lg p-6 hover:border-[oklch(0.6_0.2_300)] transition-colors cursor-pointer">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                              className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[oklch(0.6_0.2_300)] file:text-white hover:file:bg-[oklch(0.6_0.2_300)]/90"
                            />
                            {videoFile && (
                              <p className="mt-2 text-sm text-primary">
                                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Upload video file (MP4, MOV, etc.) - Audio will be automatically transcribed
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-200">Additional Context (Optional)</Label>
                          <Textarea
                            placeholder="Add any extra context about the video..."
                            value={videoDescription}
                            onChange={(e) => setVideoDescription(e.target.value)}
                            rows={3}
                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[oklch(0.6_0.2_300)]"
                          />
                        </div>

                        <Button
                          onClick={handleGenerateFromReel}
                          disabled={isGenerating || !videoFile}
                          className="w-full bg-[oklch(0.6_0.2_300)] text-white hover:bg-[oklch(0.6_0.2_300)]/90"
                          size="lg"
                        >
                          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Instagram className="w-4 h-4 mr-2" />}
                          Transcribe & Generate
                        </Button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Real-Time Progress Tracker */}
            {isGenerating && progressLogs.length > 0 && (
              <div className="mt-6">
                <ProcessTracker
                  title="Generation Progress"
                  description="Real-time progress for content generation"
                  steps={progressLogs.map((log, index) => ({
                    label: log.message,
                    status: log.step === 'error' ? 'error' :
                           log.step === 'complete' ? 'done' :
                           index === progressLogs.length - 1 ? 'active' : 'done',
                    details: log.data ? JSON.stringify(log.data).substring(0, 100) + '...' : undefined,
                    errorMsg: log.step === 'error' ? log.message : undefined,
                    startTime: index > 0 ? new Date(progressLogs[index - 1].timestamp).getTime() : new Date(log.timestamp).getTime(),
                    endTime: new Date(log.timestamp).getTime()
                  }))}
                  currentProgress={currentProgress}
                />
              </div>
            )}

            {/* Debug Panel */}
            {debugInfo && (
              <Card className="mt-6 border-blue-500/30 bg-black/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-blue-400">
                      <Sparkles className="w-5 h-5" />
                      Debug Information
                    </CardTitle>
                    <Button
                      onClick={() => setShowDebug(!showDebug)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      {showDebug ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </CardHeader>
                {showDebug && (
                  <CardContent className="space-y-4 text-gray-300">
                    {/* Download Status */}
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-sm font-medium mb-2 text-white">Download Status</p>
                      <div className="space-y-1 text-xs">
                        <p>
                          <span className="font-semibold">Method:</span>{' '}
                          <span className={debugInfo.downloadUsed ? 'text-primary' : 'text-[oklch(0.65_0.2_50)]'}>
                            {debugInfo.downloadUsed ? `✓ ${debugInfo.downloadMethod}` : '⚠ Fallback (no download)'}
                          </span>
                        </p>
                        {debugInfo.downloadDebug && (
                          <p>
                            <span className="font-semibold">Attempts:</span>{' '}
                            {debugInfo.downloadDebug.attempts?.length || 0}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Transcription */}
                    {transcription && (
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm font-medium mb-2 text-white">Transcription</p>
                        <div className="max-h-32 overflow-y-auto text-xs text-gray-400 whitespace-pre-wrap">
                          {transcription.substring(0, 500)}
                          {transcription.length > 500 && '...'}
                        </div>
                      </div>
                    )}

                    {/* Raw Debug */}
                    <details className="p-3 bg-white/5 rounded-lg">
                      <summary className="text-sm font-medium cursor-pointer text-white">Raw Debug Data</summary>
                      <pre className="mt-2 text-xs overflow-x-auto text-gray-400">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Infographic Generator */}
            {showInfographic && generatedPost && (
              <div className="mt-6">
                <InfographicGenerator
                  postContent={generatedPost}
                  topic={generatedPost}
                />
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div>
            <Card className="sticky top-8 bg-card/60 backdrop-blur-md border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Preview</CardTitle>
                  {generatedPost && (
                    <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2 border-white/20 text-white hover:bg-white/10">
                      {copied ? <><CheckCircle2 className="w-4 h-4 text-primary" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedPost ? (
                  <div className="space-y-4">
                    <Textarea
                      value={generatedPost}
                      onChange={(e) => setGeneratedPost(e.target.value)}
                      rows={20}
                      className="font-sans text-sm bg-black/20 border-white/10 text-white focus-visible:ring-primary"
                    />

                    <div className="text-xs text-gray-400 flex justify-between">
                      <span>{generatedPost.length} chars</span>
                      <span>Cost: ${cost.toFixed(4)}</span>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-medium mb-2 text-primary">✨ Next Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                        <li>Review & edit your post content</li>
                        <li>Generate an infographic prompt (scroll down)</li>
                        <li>Use the prompt in Midjourney or DALL-E</li>
                        <li>Copy post and publish on LinkedIn</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-700 mb-4" />
                    <p className="text-gray-500">Generated post will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
