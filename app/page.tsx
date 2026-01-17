import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Instagram, Image as ImageIcon, DollarSign } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[oklch(0.72_0.22_135)] to-[oklch(0.65_0.2_50)] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(126,211,33,0.3)]">
            LinkedIn AI Content Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create engaging LinkedIn posts with AI-powered content generation,
            Instagram reel analysis, and beautiful image creation.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-card/40 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_-5px_rgba(126,211,33,0.3)] group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-white">AI Research</CardTitle>
              <CardDescription className="text-gray-400">
                Generate professional LinkedIn posts from topics using advanced AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-white/5 hover:border-[oklch(0.6_0.2_300)]/50 transition-all hover:shadow-[0_0_20px_-5px_rgba(145,70,255,0.3)] group">
            <CardHeader>
              <div className="w-12 h-12 bg-[oklch(0.6_0.2_300)]/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-[oklch(0.6_0.2_300)]/20 transition-colors">
                <Instagram className="w-6 h-6 text-[oklch(0.6_0.2_300)]" />
              </div>
              <CardTitle className="text-white">Reel Analysis</CardTitle>
              <CardDescription className="text-gray-400">
                Convert Instagram reels into compelling LinkedIn content
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_-5px_rgba(126,211,33,0.3)] group">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-white">Image Generation</CardTitle>
              <CardDescription className="text-gray-400">
                Create or find perfect images for your posts with AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-white/5 hover:border-[oklch(0.65_0.2_50)]/50 transition-all hover:shadow-[0_0_20px_-5px_rgba(255,111,0,0.3)] group">
            <CardHeader>
              <div className="w-12 h-12 bg-[oklch(0.65_0.2_50)]/10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-[oklch(0.65_0.2_50)]/20 transition-colors">
                <DollarSign className="w-6 h-6 text-[oklch(0.65_0.2_50)]" />
              </div>
              <CardTitle className="text-white">Cost Tracking</CardTitle>
              <CardDescription className="text-gray-400">
                Monitor API costs with real-time tracking and budgets
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/20 to-[oklch(0.65_0.2_50)]/20 border-primary/20 text-white backdrop-blur-md hover:border-primary/40 transition-all">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Get Started</CardTitle>
              <CardDescription className="text-gray-300">
                Create your first LinkedIn post in less than 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button size="lg" className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 font-bold border-0">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Content
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-black/40 text-white border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Setup Instructions
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
              <span className="font-medium">Step 1:</span> Add API keys to{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env.local</code>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
              <span className="font-medium">Step 2:</span> Start creating content
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
              <span className="font-medium">Step 3:</span> Copy & post to LinkedIn
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
