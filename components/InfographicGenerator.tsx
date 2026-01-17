'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Sparkles, TrendingUp, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface InfographicData {
  templateUsed: string;
  extractedData: any;
  webResearch?: string;
}

interface InfographicGeneratorProps {
  postContent: string;
  topic?: string;
  onGenerated?: (data: InfographicData & { imageUrl: string }) => void;
}

export default function InfographicGenerator({ postContent, topic, onGenerated }: InfographicGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [infographicData, setInfographicData] = useState<InfographicData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [cost, setCost] = useState(0);

  // Progress tracking state
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [stepMessage, setStepMessage] = useState('');
  const [progressLogs, setProgressLogs] = useState<Array<{
    step: string;
    message: string;
    timestamp: string;
    data?: any;
  }>>([]);

  const handleGenerate = async () => {
    if (!postContent.trim()) {
      toast.error('Post content is required');
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressLogs([]);
    setCurrentStep('');

    try {
      const response = await fetch('/api/images/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent, topic })
      });

      if (!response.ok) {
        throw new Error('Failed to generate infographic');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            // Update progress
            setProgress(data.progress);
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
            if (data.step === 'complete' && data.data) {
              const fallbackInfographic = {
                templateUsed: data.data?.infographic?.templateUsed || data.data?.analysis?.contentType || data.data?.style?.selected || 'educational_steps',
                extractedData: data.data?.infographic?.extractedData || {
                  headline: data.data?.analysis?.mainTopic,
                  keyPoints: data.data?.analysis?.keyPoints,
                  metrics: data.data?.analysis?.keyMetrics
                },
                webResearch: data.data?.infographic?.webResearch || data.data?.analysis?.visualConcept || ''
              } as InfographicData;

              const info: InfographicData = data.data.infographic || fallbackInfographic;
              setInfographicData(info);
              setImageUrl(data.data.imageUrl);
              setPhotos(data.data.photos || data.data.stockPhotos || []);
              setCost(data.data.cost || 0);

              const tpl = info.templateUsed || 'educational_steps';
              const costStr = (data.data.cost != null) ? `$${Number(data.data.cost).toFixed(4)}` : '$0.0000';
              toast.success(
                `Infographic generated! Template: ${tpl}`,
                { description: `Total time: ${data.data.totalTime || '?'}s | Cost: ${costStr}` }
              );

              if (onGenerated) {
                onGenerated({ ...info, imageUrl: data.data.imageUrl });
              }
            }

            // Handle errors
            if (data.step === 'error') {
              throw new Error(data.data?.error || 'Unknown error');
            }
          }
        }
      }
    } catch (error: any) {
      toast.error('Failed to generate infographic', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `infographic-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Infographic downloaded!');
    }
  };

  return (
    <div className="space-y-4">
      {!infographicData ? (
        <>
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <CardTitle>Generate Infographic</CardTitle>
              </div>
              <CardDescription>
                Create a professional infographic with Gemini Imagen (Nano Banana style)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerate}
                disabled={loading || !postContent.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating Infographic...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Infographic Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {loading && (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="text-blue-700 text-lg">Generation Progress</CardTitle>
                <CardDescription>
                  AI is analyzing and creating your infographic...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">{currentStep}</span>
                    <span className="text-gray-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-[oklch(0.65_0.2_50)] h-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-300">{stepMessage}</p>
                </div>

                {/* Step-by-Step Log */}
                <div className="bg-black/40 rounded-lg border border-white/5 p-3 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold text-gray-200 mb-2 text-sm">Processing Steps:</h4>
                  <div className="space-y-2">
                    {progressLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          log.step === 'complete' ? 'bg-primary' :
                          log.step === 'error' ? 'bg-red-500' :
                          'bg-[oklch(0.6_0.2_300)]'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 font-medium">{log.message}</p>
                          {log.data && (
                            <div className="mt-1 text-gray-500">
                              {log.data.template && (
                                <p>Template: <span className="font-semibold">{log.data.template}</span></p>
                              )}
                              {log.data.confidence && (
                                <p>Confidence: <span className="font-semibold">{log.data.confidence}%</span></p>
                              )}
                              {log.data.reasoning && (
                                <p className="italic text-xs mt-0.5">{log.data.reasoning}</p>
                              )}
                              {log.data.summary && (
                                <p className="italic text-xs mt-0.5">{log.data.summary}</p>
                              )}
                              {log.data.promptPreview && (
                                <p className="italic text-xs mt-0.5 truncate">{log.data.promptPreview}</p>
                              )}
                            </div>
                          )}
                          <p className="text-gray-600 text-[10px] mt-0.5">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Step Icon Animation */}
                <div className="flex items-center justify-center py-2">
                  <div className="animate-pulse">
                    {currentStep === 'research' && <TrendingUp className="w-8 h-8 text-[oklch(0.6_0.2_300)]" />}
                    {currentStep === 'analysis' && <CheckCircle2 className="w-8 h-8 text-primary" />}
                    {currentStep === 'extraction' && <Sparkles className="w-8 h-8 text-[oklch(0.65_0.2_50)]" />}
                    {currentStep === 'generation' && <ImageIcon className="w-8 h-8 text-primary" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-card/60 backdrop-blur-md border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <CardTitle className="text-white">Infographic Generated!</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {infographicData.templateUsed}
                </Badge>
                <Button onClick={handleDownloadImage} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <CardDescription className="text-gray-400">
              Professional infographic generated using Gemini Imagen (Nano Banana style)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="image">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                <TabsTrigger value="image" className="data-[state=active]:bg-primary data-[state=active]:text-black">Image</TabsTrigger>
                <TabsTrigger value="data" className="data-[state=active]:bg-[oklch(0.6_0.2_300)] data-[state=active]:text-white">Extracted Data</TabsTrigger>
                <TabsTrigger value="research" className="data-[state=active]:bg-[oklch(0.65_0.2_50)] data-[state=active]:text-white">Research</TabsTrigger>
                <TabsTrigger value="photos" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">Stock Photos</TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-3">
                <div className="relative bg-black/40 rounded-lg overflow-hidden border-2 border-white/5">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Generated Infographic"
                      width={1200}
                      height={627}
                      className="w-full h-auto"
                      priority
                    />
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Image loading...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-r from-primary/10 to-[oklch(0.65_0.2_50)]/10 border border-primary/20 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-primary mb-1">🎨 Reddit Nano Banana Style</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs">
                    <li>Ultra-clean minimalist design</li>
                    <li>Professional LinkedIn optimized</li>
                    <li>4K quality, mobile-first</li>
                    <li>Generated with web research & AI</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-3">
                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                  <h4 className="font-semibold mb-3 text-white">Extracted Information</h4>
                  <pre className="bg-black/40 border border-white/10 rounded p-3 overflow-x-auto text-xs text-gray-300">
                    {JSON.stringify(infographicData.extractedData, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="research" className="space-y-3">
                {infographicData.webResearch ? (
                  <div className="bg-[oklch(0.6_0.2_300)]/10 border border-[oklch(0.6_0.2_300)]/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-[oklch(0.6_0.2_300)]" />
                      <h4 className="font-semibold text-white">Web Research Context</h4>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {infographicData.webResearch}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No web research available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photos" className="space-y-3">
                {photos.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-400 mb-3">
                      Reference stock photos (optional backgrounds or inspiration):
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <Image
                            src={photo.thumbnailUrl}
                            alt={`Photo by ${photo.photographer}`}
                            width={300}
                            height={200}
                            className="rounded-lg object-cover w-full h-40"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                            <a
                              href={photo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black bg-opacity-75 px-3 py-1 rounded"
                            >
                              View Full Size
                            </a>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            By {photo.photographer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No stock photos found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400">
                Generation Cost: <span className="font-semibold text-white">${cost.toFixed(4)}</span>
              </p>
              <Button
                onClick={() => {
                  setInfographicData(null);
                  setPhotos([]);
                }}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Generate New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
