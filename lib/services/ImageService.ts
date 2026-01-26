import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import sharp from 'sharp';

export interface GeneratedImage {
  url: string;
  source: 'generated' | 'stock';
  prompt?: string;
  cost: number;
}

export interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
  };
}

export interface PostAnalysis {
  mainTopic: string;
  subTopics: string[];
  keyMetrics: Array<{ label: string; value: string; trend?: 'up' | 'down' | 'neutral' }>;
  keyPoints: string[];
  tone: 'educational' | 'inspirational' | 'data-driven' | 'storytelling' | 'contrarian';
  contentType: 'framework' | 'tips' | 'case-study' | 'comparison' | 'announcement' | 'insight';
  techKeywords: string[];
  visualConcept: string;
}

export interface ImageGenerationOptions {
  style: 'minimal-data' | 'gradient-abstract' | 'icon-grid' | 'chart-focus' | 'conceptual';
  colorScheme: 'tech-blue' | 'modern-gradient' | 'dark-mode' | 'clean-white' | 'vibrant-tech';
  aspectRatio: '16:9' | '1:1' | '4:5';
  includeText: boolean;
  analysis?: PostAnalysis;
}

// Tech-focused color palettes optimized for LinkedIn
const TECH_COLOR_PALETTES = {
  'tech-blue': {
    primary: '#0A66C2',      // LinkedIn blue
    secondary: '#00D4AA',    // Tech teal
    accent: '#FF6B35',       // Action orange
    background: '#FFFFFF',
    darkBg: '#0F172A',
    gradient: 'linear-gradient(135deg, #0A66C2, #00D4AA)',
    textPrimary: '#1E293B',
    textSecondary: '#64748B'
  },
  'modern-gradient': {
    primary: '#6366F1',      // Indigo
    secondary: '#EC4899',    // Pink
    accent: '#14B8A6',       // Teal
    background: '#FAFAFA',
    darkBg: '#18181B',
    gradient: 'linear-gradient(135deg, #6366F1, #EC4899)',
    textPrimary: '#18181B',
    textSecondary: '#71717A'
  },
  'dark-mode': {
    primary: '#3B82F6',      // Blue
    secondary: '#10B981',    // Emerald
    accent: '#F59E0B',       // Amber
    background: '#0F172A',
    darkBg: '#020617',
    gradient: 'linear-gradient(135deg, #1E293B, #0F172A)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8'
  },
  'clean-white': {
    primary: '#2563EB',      // Blue
    secondary: '#7C3AED',    // Violet
    accent: '#059669',       // Green
    background: '#FFFFFF',
    darkBg: '#F1F5F9',
    gradient: 'linear-gradient(135deg, #FFFFFF, #F1F5F9)',
    textPrimary: '#0F172A',
    textSecondary: '#475569'
  },
  'vibrant-tech': {
    primary: '#8B5CF6',      // Purple
    secondary: '#06B6D4',    // Cyan
    accent: '#F97316',       // Orange
    background: '#FEFEFE',
    darkBg: '#1E1B4B',
    gradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    textPrimary: '#1E1B4B',
    textSecondary: '#6B7280'
  }
};

// Best visual concepts for tech LinkedIn content
const TECH_VISUAL_CONCEPTS = {
  'ai-neural': 'abstract neural network nodes with glowing connections, circuit-like patterns',
  'data-flow': 'flowing data streams, particle systems moving in organized patterns',
  'geometric-tech': 'geometric shapes, hexagons, clean lines forming abstract tech patterns',
  'dashboard-ui': 'clean dashboard UI elements, cards, metrics, modern interface components',
  'gradient-mesh': 'smooth gradient mesh backgrounds with subtle geometric overlays',
  'isometric-tech': 'isometric 3D tech elements, servers, devices, abstract architecture',
  'minimal-icons': 'large flat design icons, simple shapes, bold silhouettes',
  'code-abstract': 'abstract representation of code, brackets, symbols in artistic arrangement'
};

class ImageService {
  private genAI: GoogleGenAI;
  private pexelsApiKey: string;
  private readonly PEXELS_BASE_URL = 'https://api.pexels.com/v1';
  private readonly IMAGE_GENERATION_COST = 0.04;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;

    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables');
    }

    // New @google/genai SDK - API key is set via environment variable
    this.genAI = new GoogleGenAI({ apiKey: geminiKey });
    this.pexelsApiKey = pexelsKey || '';
  }

  /**
   * MAIN METHOD: Generate image based on LinkedIn post content
   * This is the primary entry point for post-based image generation
   */
  async generateImageFromPost(
    postContent: string,
    options: Partial<ImageGenerationOptions> = {}
  ): Promise<{
    imageUrl: string;
    imageBase64?: string;
    analysis: PostAnalysis;
    prompt: string;
    cost: number;
  }> {
    console.log('🎨 Starting post-based image generation...');

    // Step 1: Deep analysis of post content
    const analysis = options.analysis || await this.analyzePostContent(postContent);
    console.log('📊 Post analysis complete:', analysis.mainTopic);

    // Step 2: Build Bhargav Architect prompt directly from post content (no templates)
    const prompt = this.buildBhargavArchitectPrompt(postContent, analysis);
    console.log('📝 Prompt generated, length:', prompt.length);

    // Step 4: Generate image with Gemini Imagen
    const result = await this.generateWithGeminiImagen(prompt, analysis);

    return {
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      analysis,
      prompt,
      cost: result.cost
    };
  }

  /**
   * Build the "Bhargav" Infographic Architect prompt strictly from post content
   */
  public buildBhargavArchitectPrompt(postContent: string, analysis?: PostAnalysis): string {
    const sys = `You are an expert information designer and visual communicator. Your task is to create a professional, visually appealing, and accurate infographic based solely on the text provided in the user's post.

Process:

Analyze the Source: Read the user's post thoroughly to identify the main topic, the core message, and the key supporting points or steps (typically 3-4 distinct ideas).

Structure the Layout: Design a clean, organized layout to present these points logically. A horizontal, three-panel structure or a step-by-step flowchart is often effective.

Synthesize Content:

Title: Create a concise, engaging title that summarizes the entire post.

Headers: For each section/panel, extract a clear, short header from the text.

Visuals: Select relevant icons, diagrams, or illustrations to visually represent each key point.

Text: Write brief, punchy captions or bullet points under each visual, directly summarizing the corresponding information from the post. Avoid long paragraphs.

Apply Style Guidelines:

Aesthetic: Modern, clean, and professional. Use a professional color palette (e.g., blues, purples, greens, greys) with clear visual hierarchy.

Elements: Use rounded corners for containers, clear connecting lines or arrows to show flow, and subtle background gradients or patterns.

Typography: Use bold, clear fonts for titles and headers, and legible fonts for body text.

Finalize: Ensure the infographic accurately reflects the post's content without adding external information. Include the name "Bhargav" in small text at the bottom center as a watermark.`;

    const context = `POST CONTENT:\n${postContent}`;
    // Provide optional hints extracted from analysis, without forcing templates
    const hints = analysis ? `\n\nHINTS (optional, for context only):\nSuggested topic: ${analysis.mainTopic}\nKey points: ${analysis.keyPoints.slice(0,3).join(' | ')}\nNumbers: ${analysis.keyMetrics.map(m=>m.value).slice(0,3).join(' | ')}` : '';
    
    // Add specific visual style description matching the DeepSeek example
    const styleRef = `\n\nVISUAL STYLE REFERENCE:
- Layout: Horizontal comparison of 3 distinct panels/cards side-by-side.
- Cards: Rounded rectangular cards with soft gradient backgrounds (light blue/green/teal).
- Diagrams: Schematic technical diagrams inside each card (blocks, arrows, flows).
- Background: Clean white or very light gradient background.
- Title: Bold, centered black text at the top.
- Color Palette: Tech-focused blues, teals, and soft greens.
- Watermark: Small "Bhargav" text at bottom center.`;

    return `${sys}\n\n${context}${hints}${styleRef}`;
  }

  /**
   * Deep analysis of LinkedIn post to extract visual elements
   */
  async analyzePostContent(postContent: string): Promise<PostAnalysis> {
    const analysisPrompt = `Analyze this LinkedIn post for visual infographic generation. Extract structured data.

POST CONTENT:
${postContent}

Return a JSON object with these exact fields:
{
  "mainTopic": "Primary topic in 3-6 words (e.g., 'AI Adoption Best Practices')",
  "subTopics": ["3-4 secondary themes mentioned"],
  "keyMetrics": [
    {"label": "metric name", "value": "number/percentage", "trend": "up|down|neutral"}
  ],
  "keyPoints": ["3-5 main takeaways or bullet points from the post"],
  "tone": "educational|inspirational|data-driven|storytelling|contrarian",
  "contentType": "framework|tips|case-study|comparison|announcement|insight",
  "techKeywords": ["5-8 tech/industry keywords for visual elements"],
  "visualConcept": "Brief description of ideal visual representation (15-25 words)"
}

Rules:
- Extract ACTUAL data/numbers from the post, don't invent metrics
- keyPoints should be the actual insights, not generic summaries
- techKeywords should be specific to the industry/tech mentioned
- visualConcept should describe what would make this post visually compelling`;

    try {
      // New @google/genai SDK API
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: analysisPrompt,
        config: { temperature: 0.3 }
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const analysis = JSON.parse(jsonText) as PostAnalysis;

      // Validate and set defaults
      return {
        mainTopic: analysis.mainTopic || 'Tech Insights',
        subTopics: analysis.subTopics || [],
        keyMetrics: analysis.keyMetrics || [],
        keyPoints: analysis.keyPoints || [],
        tone: analysis.tone || 'educational',
        contentType: analysis.contentType || 'insight',
        techKeywords: analysis.techKeywords || ['technology', 'innovation'],
        visualConcept: analysis.visualConcept || 'clean modern tech infographic'
      };
    } catch (error: any) {
      console.error('Error analyzing post:', error.message);
      // Fallback analysis using simple extraction
      return this.fallbackPostAnalysis(postContent);
    }
  }

  /**
   * Fallback post analysis using regex patterns
   */
  private fallbackPostAnalysis(postContent: string): PostAnalysis {
    const lines = postContent.split('\n').filter(l => l.trim());
    const firstLine = lines[0] || 'Tech Insights';

    // Extract numbers/percentages
    const metrics: PostAnalysis['keyMetrics'] = [];
    const numberMatches = postContent.match(/(\d+(?:\.\d+)?%?|\$[\d,]+[KMB]?)/g) || [];
    numberMatches.slice(0, 4).forEach((value, i) => {
      metrics.push({ label: `Metric ${i + 1}`, value, trend: 'neutral' });
    });

    // Extract bullet points
    const keyPoints = lines
      .filter(l => /^[-•→\d+\.]/.test(l.trim()))
      .slice(0, 5)
      .map(l => l.replace(/^[-•→\d+\.]\s*/, '').trim());

    // Extract tech keywords
    const techWords = ['AI', 'ML', 'API', 'SaaS', 'cloud', 'data', 'automation', 'platform'];
    const techKeywords = techWords.filter(w =>
      postContent.toLowerCase().includes(w.toLowerCase())
    );

    return {
      mainTopic: firstLine.substring(0, 50),
      subTopics: [],
      keyMetrics: metrics,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Key insight from the post'],
      tone: 'educational',
      contentType: 'insight',
      techKeywords: techKeywords.length > 0 ? techKeywords : ['technology'],
      visualConcept: 'professional tech infographic with clean design'
    };
  }

  /**
   * Determine optimal visual style based on post analysis
   */
  private determineOptimalStyle(
    analysis: PostAnalysis,
    userOptions: Partial<ImageGenerationOptions>
  ): ImageGenerationOptions {
    let style: ImageGenerationOptions['style'] = 'minimal-data';
    let colorScheme: ImageGenerationOptions['colorScheme'] = 'tech-blue';

    // Determine style based on content type
    switch (analysis.contentType) {
      case 'framework':
        style = 'icon-grid';
        break;
      case 'tips':
        style = 'minimal-data';
        break;
      case 'case-study':
        style = 'chart-focus';
        break;
      case 'comparison':
        style = 'chart-focus';
        break;
      case 'insight':
        style = 'conceptual';
        break;
      default:
        style = 'gradient-abstract';
    }

    // Determine color scheme based on tone
    switch (analysis.tone) {
      case 'data-driven':
        colorScheme = 'tech-blue';
        break;
      case 'inspirational':
        colorScheme = 'modern-gradient';
        break;
      case 'contrarian':
        colorScheme = 'dark-mode';
        break;
      case 'educational':
        colorScheme = 'clean-white';
        break;
      case 'storytelling':
        colorScheme = 'vibrant-tech';
        break;
    }

    // If there are metrics, prefer data visualization
    if (analysis.keyMetrics.length >= 2) {
      style = 'chart-focus';
    }

    return {
      style: userOptions.style || style,
      colorScheme: userOptions.colorScheme || colorScheme,
      aspectRatio: userOptions.aspectRatio || '16:9',
      includeText: userOptions.includeText ?? true
    };
  }

  /**
   * Build optimized Nano Banana prompt for tech LinkedIn images
   * Following 2025 best practices for AI image generation
   */
  buildTechInfographicPrompt(
    analysis: PostAnalysis,
    options: ImageGenerationOptions
  ): string {
    const colors = TECH_COLOR_PALETTES[options.colorScheme];
    const dimensions = this.getDimensions(options.aspectRatio);

    // Build the core visual description based on style
    let visualDescription = '';

    switch (options.style) {
      case 'minimal-data':
        visualDescription = this.buildMinimalDataPrompt(analysis, colors);
        break;
      case 'gradient-abstract':
        visualDescription = this.buildGradientAbstractPrompt(analysis, colors);
        break;
      case 'icon-grid':
        visualDescription = this.buildIconGridPrompt(analysis, colors);
        break;
      case 'chart-focus':
        visualDescription = this.buildChartFocusPrompt(analysis, colors);
        break;
      case 'conceptual':
        visualDescription = this.buildConceptualPrompt(analysis, colors);
        break;
    }

    // Construct final Nano Banana optimized prompt
    const prompt = `${visualDescription}

STYLE SPECIFICATIONS:
- Ultra-clean, modern tech aesthetic
- Flat design with subtle depth (soft shadows, not drop shadows)
- Bold sans-serif typography (Inter, SF Pro, or similar)
- Generous white space (minimum 25% negative space)
- Perfect visual hierarchy - eye flows naturally
- Professional LinkedIn-ready quality

COLOR PALETTE:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}
- Background: ${options.colorScheme === 'dark-mode' ? colors.darkBg : colors.background}
- Text: ${options.colorScheme === 'dark-mode' ? colors.textPrimary : colors.textPrimary}

TECHNICAL REQUIREMENTS:
- Resolution: ${dimensions.width}x${dimensions.height}px (${options.aspectRatio} aspect ratio)
- Crisp, sharp text rendering at all sizes
- No stock photos - pure graphic design
- No photorealistic elements - flat/vector style
- Mobile-optimized (readable on small screens)

MUST AVOID:
- Clip art or cheesy graphics
- Overcrowded layouts
- Generic corporate imagery
- Busy backgrounds that compete with content
- Low-contrast text
- Outdated design patterns

WATERMARK: Small "by Bhargav" text in bottom-right corner, subtle and professional`;

    return prompt;
  }

  /**
   * Minimal Data Style - Clean metrics and numbers
   */
  private buildMinimalDataPrompt(analysis: PostAnalysis, colors: typeof TECH_COLOR_PALETTES['tech-blue']): string {
    const metricsText = analysis.keyMetrics.length > 0
      ? analysis.keyMetrics.map(m => `"${m.value}" for "${m.label}"`).join(', ')
      : 'key insights visualized as large typography';

    const pointsText = analysis.keyPoints.slice(0, 3).map(p => `"${p}"`).join(', ');

    return `Create a minimal data visualization infographic for LinkedIn:

HEADLINE: "${analysis.mainTopic}"

LAYOUT: Clean card-based design with generous spacing
- Large bold headline at top (48-64px equivalent)
- ${analysis.keyMetrics.length > 0 ? `${analysis.keyMetrics.length} metric cards showing: ${metricsText}` : 'Key points as visual cards'}
- Each card: Large number/stat + brief label + trend indicator
- Subtle divider lines between sections
- Key takeaways at bottom: ${pointsText}

VISUAL ELEMENTS:
- Minimal flat icons representing: ${analysis.techKeywords.slice(0, 4).join(', ')}
- Subtle gradient accents on cards
- Thin accent lines in ${colors.secondary}
- Clean geometric shapes as decorative elements`;
  }

  /**
   * Gradient Abstract Style - Modern flowing backgrounds
   */
  private buildGradientAbstractPrompt(analysis: PostAnalysis, colors: typeof TECH_COLOR_PALETTES['tech-blue']): string {
    return `Create a gradient abstract tech infographic for LinkedIn:

HEADLINE: "${analysis.mainTopic}"

BACKGROUND: Flowing gradient mesh from ${colors.primary} to ${colors.secondary}
- Smooth, organic curves
- Subtle noise texture overlay
- Glass-morphism card effects

CONTENT OVERLAY:
- Frosted glass card containing the headline
- Key points floating with subtle shadows: ${analysis.keyPoints.slice(0, 3).map(p => `"${p}"`).join(', ')}
- Abstract tech elements: ${analysis.visualConcept}

DECORATIVE ELEMENTS:
- Floating geometric shapes (circles, rounded rectangles)
- Subtle grid pattern in background
- Light particle effects suggesting data/connectivity
- Tech keywords as subtle background text: ${analysis.techKeywords.join(', ')}`;
  }

  /**
   * Icon Grid Style - Framework/Process visualization
   */
  private buildIconGridPrompt(analysis: PostAnalysis, colors: typeof TECH_COLOR_PALETTES['tech-blue']): string {
    const stepsOrPoints = analysis.keyPoints.slice(0, 6);
    const gridItems = stepsOrPoints.map((point, i) => `Step ${i + 1}: "${point}"`).join('\n');

    return `Create an icon grid infographic showing a framework/process for LinkedIn:

HEADLINE: "${analysis.mainTopic}"

LAYOUT: ${stepsOrPoints.length <= 4 ? '2x2' : '3x2'} grid of icon cards
${gridItems}

EACH CARD CONTAINS:
- Large flat design icon representing the concept
- Step number badge (${colors.primary} background)
- Brief title text (bold, 18-24px)
- Optional: one-line description

VISUAL STYLE:
- Clean white or light gray cards
- Consistent icon style (line icons or filled, not mixed)
- Subtle connecting lines or arrows between steps
- Accent color highlighting: ${colors.accent}
- Icons related to: ${analysis.techKeywords.slice(0, 4).join(', ')}

FLOW: Visual progression showing the framework steps`;
  }

  /**
   * Chart Focus Style - Data visualization emphasis
   */
  private buildChartFocusPrompt(analysis: PostAnalysis, colors: typeof TECH_COLOR_PALETTES['tech-blue']): string {
    const hasMetrics = analysis.keyMetrics.length > 0;

    let chartDescription = '';
    if (hasMetrics) {
      chartDescription = `featuring these metrics:
${analysis.keyMetrics.map(m => `- ${m.label}: ${m.value} (${m.trend || 'neutral'} trend)`).join('\n')}`;
    } else {
      chartDescription = `visualizing the concept: ${analysis.visualConcept}`;
    }

    return `Create a data-focused infographic for LinkedIn:

HEADLINE: "${analysis.mainTopic}"

PRIMARY VISUAL: Clean data visualization ${chartDescription}

CHART STYLE OPTIONS (choose most appropriate):
- Bar chart with rounded corners and gradient fills
- Donut/pie chart with bold segments
- Line graph with smooth curves and gradient area fill
- Progress bars with percentage labels
- Comparison cards side-by-side

SUPPORTING ELEMENTS:
- Legend with clear labels
- Key insight callout box
- Source attribution if applicable

DATA VISUALIZATION RULES:
- High contrast between data points
- Clear labels on all elements
- ${colors.primary} for primary data, ${colors.secondary} for secondary
- Accent color ${colors.accent} for highlights/emphasis
- No 3D effects - flat design only`;
  }

  /**
   * Conceptual Style - Abstract representation of ideas
   */
  private buildConceptualPrompt(analysis: PostAnalysis, colors: typeof TECH_COLOR_PALETTES['tech-blue']): string {
    // Select appropriate tech visual concept
    const visualConcepts = Object.values(TECH_VISUAL_CONCEPTS);
    const conceptIndex = Math.abs(analysis.mainTopic.length % visualConcepts.length);
    const selectedConcept = visualConcepts[conceptIndex];

    return `Create a conceptual tech infographic for LinkedIn:

HEADLINE: "${analysis.mainTopic}" (prominent, centered or top-aligned)

CENTRAL VISUAL: ${selectedConcept}
- Abstract representation of: ${analysis.visualConcept}
- Related to keywords: ${analysis.techKeywords.join(', ')}

COMPOSITION:
- Hero visual takes 60% of space
- Headline integrated elegantly
- 2-3 key points as floating text elements: ${analysis.keyPoints.slice(0, 3).map(p => `"${p}"`).join(', ')}
- Subtle branding elements

MOOD: Professional yet innovative, forward-thinking tech aesthetic
- Colors: Gradient from ${colors.primary} to ${colors.secondary}
- Accent highlights in ${colors.accent}
- Modern, cutting-edge feel without being busy`;
  }

  /**
   * Get dimensions based on aspect ratio
   */
  private getDimensions(aspectRatio: '16:9' | '1:1' | '4:5'): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1792, height: 1024 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:5':
        return { width: 1080, height: 1350 };
      default:
        return { width: 1792, height: 1024 };
    }
  }

  /**
   * Generate image using Nano Banana Pro (Gemini 3 Pro Image Preview)
   * This is the latest, most advanced version for high-quality infographic generation.
   */
  private async generateWithGeminiImagen(prompt: string, analysis?: PostAnalysis): Promise<{
    imageUrl: string;
    imageBase64?: string;
    cost: number;
  }> {
    try {
      console.log('🖼️ Generating with Nano Banana Pro (Gemini 3 Pro Image Preview)...');

      // New @google/genai SDK API - using latest Nano Banana Pro model
      const result = await this.genAI.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '2K'
          }
        }
      });

      console.log('📦 Response received from Gemini');

      // Check for image in response
      let imageBase64: string | undefined;

      // Method 1: Check candidates for inline data (new SDK structure)
      if (result.candidates && result.candidates[0]?.content?.parts) {
        // Find the last image part, as thinking models might produce interim thought images
        // The documentation says: "The last image within Thinking is also the final rendered image."
        const parts = result.candidates[0].content.parts;
        for (let i = parts.length - 1; i >= 0; i--) {
          const part = parts[i];
          if ('inlineData' in part && part.inlineData?.data) {
            imageBase64 = part.inlineData.data;
            console.log('✓ Found image in inlineData (final image)');
            break;
          }
        }
      }

      // Method 2: Check if result has generatedImages property
      if (!imageBase64 && (result as any).generatedImages) {
        const images = (result as any).generatedImages;
        if (images && images.length > 0 && images[0].imageData) {
          imageBase64 = images[0].imageData;
          console.log('✓ Found image in generatedImages');
        }
      }

      // Method 3: Check text in parts
      if (!imageBase64 && result.candidates && result.candidates[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if ('text' in part && part.text) {
            const base64Match = part.text.match(/data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/);
            if (base64Match) {
              imageBase64 = base64Match[2];
              console.log('✓ Found image in text response');
              break;
            }
          }
        }
      }

      // If no image found, try one more time with 'gemini-2.5-flash-image' if 'gemini-3-pro-image-preview' failed silently or wasn't found
      if (!imageBase64 && prompt.length > 0) {
          // This is a safety check, but usually it would throw an error if model not found.
          // However, if the user doesn't have access to the model, it might return empty or error.
      }

      if (!imageBase64) {
        console.log('⚠️ No image data found in response, using enhanced SVG fallback');
        console.log('Response structure:', JSON.stringify({
          candidates: result.candidates?.length,
          hasParts: result.candidates?.[0]?.content?.parts?.length
        }));
        return this.generateFallbackImage(prompt, analysis);
      }

      // In production (Vercel, Netlify), filesystem is read-only
      // Return base64 data URL instead of saving to disk
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      // Optimize with sharp
      const optimizedBuffer = await sharp(imageBuffer)
        .png({ quality: 95, compressionLevel: 6 })
        .toBuffer();

      const optimizedBase64 = optimizedBuffer.toString('base64');
      const imageUrl = `data:image/png;base64,${optimizedBase64}`;

      console.log('✅ Image generated successfully');

      return {
        imageUrl,
        imageBase64: optimizedBase64,
        cost: 0.04
      };
    } catch (error: any) {
      console.error('❌ Gemini 2.5 Flash Image error:', error.message);
      console.error('Error details:', error);
      console.log('📝 Falling back to enhanced SVG generation');
      return this.generateFallbackImage(prompt, analysis);
    }
  }

  /**
   * Enhanced fallback image generation using SVG
   * Creates professional, content-aware infographics
   */
  private async generateFallbackImage(prompt: string, analysis?: PostAnalysis): Promise<{
    imageUrl: string;
    imageBase64?: string;
    cost: number;
  }> {
    console.log('🎨 Creating professional SVG infographic...');

    // Extract information from prompt
    let title = 'Tech Insights';
    let keyPoints: string[] = [];

    if (analysis) {
      title = analysis.mainTopic;
      keyPoints = analysis.keyPoints;
    } else {
      const titleMatch = prompt.match(/HEADLINE:\s*"([^"]+)"/);
      if (titleMatch) {
        title = titleMatch[1];
      } else {
        // Try to extract from Bhargav Architect prompt
        const topicMatch = prompt.match(/Suggested topic:\s*([^\n]+)/);
        if (topicMatch) title = topicMatch[1];
      }

      // Extract key points if present
      const keyPointsMatch = prompt.match(/key points[^:]*:([^"]*)"([^"]+)"/gi);
      if (keyPointsMatch) {
        keyPointsMatch.forEach(match => {
          const point = match.match(/"([^"]+)"/);
          if (point) keyPoints.push(point[1]);
        });
      } else {
        // Try to extract from Bhargav Architect prompt hints
        const hintsMatch = prompt.match(/Key points:\s*([^\n]+)/);
        if (hintsMatch) {
          keyPoints = hintsMatch[1].split('|').map(p => p.trim());
        }
      }
    }

    // Detect style from prompt
    const isMinimal = /minimal|clean|simple/i.test(prompt);
    const isGradient = /gradient|abstract|modern/i.test(prompt);
    const isDark = /dark mode|dark background/i.test(prompt);

    // Choose colors based on detected style
    let primaryColor = '#0A66C2';
    let secondaryColor = '#00D4AA';
    let bgColor = '#FFFFFF';
    let textColor = '#0F172A';

    if (isDark) {
      primaryColor = '#3B82F6';
      secondaryColor = '#10B981';
      bgColor = '#0F172A';
      textColor = '#F8FAFC';
    } else if (isGradient) {
      primaryColor = '#6366F1';
      secondaryColor = '#EC4899';
    }

    // Create enhanced SVG
    // Check if this is a comparison/technical topic (like the DeepSeek MHC post)
    const isComparison = analysis?.visualConcept?.toLowerCase().includes('comparison') || 
                         title.toLowerCase().includes('vs') || 
                         title.toLowerCase().includes('mhc');

    let svgContent = '';

    if (isComparison) {
        // DeepSeek Style 3-Panel Layout
        const cardWidth = 480;
        const cardHeight = 500;
        const startX = 100;
        const startY = 400;
        const gap = 50;
        
        // Define panel titles based on known context or generic
        const panelTitles = analysis?.subTopics?.length === 3 ? analysis.subTopics : ['Traditional', 'Current State', 'Innovation'];
        const panelColors = ['#E0F2FE', '#FCE7F3', '#DCFCE7']; // Light Blue, Light Pink, Light Green
        const borderColors = ['#0EA5E9', '#EC4899', '#22C55E'];

        svgContent = `
        <!-- 3-Panel Comparison Layout -->
        ${[0, 1, 2].map(i => `
            <!-- Panel ${i+1} -->
            <rect x="${startX + (i * (cardWidth + gap))}" y="${startY}" width="${cardWidth}" height="${cardHeight}" rx="24" fill="${panelColors[i]}" stroke="${borderColors[i]}" stroke-width="2" />
            
            <!-- Panel Header -->
            <rect x="${startX + (i * (cardWidth + gap))}" y="${startY}" width="${cardWidth}" height="80" rx="24" fill="${borderColors[i]}" opacity="0.2" />
            <text x="${startX + (i * (cardWidth + gap)) + cardWidth/2}" y="${startY + 50}" font-family="Inter, sans-serif" font-size="24" font-weight="bold" fill="#0F172A" text-anchor="middle">
                ${this.truncateText(panelTitles[i] || `Phase ${i+1}`, 30)}
            </text>

            <!-- Panel Content Placeholder (Diagram) -->
            <rect x="${startX + (i * (cardWidth + gap)) + 40}" y="${startY + 100}" width="${cardWidth - 80}" height="200" rx="12" fill="white" opacity="0.6" />
            <circle cx="${startX + (i * (cardWidth + gap)) + cardWidth/2}" cy="${startY + 200}" r="40" fill="${borderColors[i]}" opacity="0.4" />
            
            <!-- Panel Text -->
            <foreignObject x="${startX + (i * (cardWidth + gap)) + 30}" y="${startY + 320}" width="${cardWidth - 60}" height="160">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, sans-serif; font-size: 20px; color: #334155; text-align: center; line-height: 1.4;">
                    ${this.truncateText(keyPoints[i] || 'Key architectural difference and improvement point.', 120)}
                </div>
            </foreignObject>
        `).join('')}
        `;
    } else {
        // Default List Layout
        svgContent = keyPoints.length > 0 ? `
        <!-- Key Points Section -->
        ${keyPoints.slice(0, 3).map((point, i) => `
          <!-- Point ${i + 1} -->
          <circle cx="200" cy="${450 + (i * 100)}" r="24" fill="${primaryColor}" opacity="0.2"/>
          <text x="200" y="${458 + (i * 100)}" font-family="Inter, SF Pro, Arial, sans-serif" font-size="20" font-weight="bold" fill="${primaryColor}" text-anchor="middle">${i + 1}</text>
          <text x="250" y="${458 + (i * 100)}" font-family="Inter, SF Pro, Arial, sans-serif" font-size="22" fill="${textColor}" opacity="0.9">${this.truncateText(point, 80)}</text>
        `).join('')}
        ` : `
        <!-- Subtitle -->
        <text x="896" y="500" font-family="Inter, SF Pro, Arial, sans-serif" font-size="32" fill="${textColor}" opacity="0.6" text-anchor="middle">
          Professional Tech Infographic
        </text>
        `;
    }

    const svg = `
    <svg width="1792" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.2"/>
        </filter>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
        </filter>
      </defs>

      <!-- Background -->
      ${isDark
        ? `<rect width="100%" height="100%" fill="${bgColor}"/>`
        : `<rect width="100%" height="100%" fill="url(#bg)"/>`
      }

      <!-- Main Content Card -->
      <rect x="80" y="80" width="1632" height="864" rx="32" fill="${bgColor}" fill-opacity="${isDark ? '0.95' : '0.97'}" filter="url(#shadow)"/>

      <!-- Header Section -->
      <rect x="120" y="120" width="1552" height="4" fill="${primaryColor}" opacity="0.3"/>

      <!-- Title -->
      ${this.wrapText(title, 896, 200, 56, textColor, 1400)}

      ${svgContent}

      <!-- Decorative Elements -->
      <circle cx="1600" cy="200" r="80" fill="${secondaryColor}" opacity="0.08"/>
      <circle cx="180" cy="850" r="60" fill="${primaryColor}" opacity="0.08"/>
      <rect x="1500" y="750" width="180" height="180" rx="20" fill="${secondaryColor}" opacity="0.05"/>

      <!-- Footer -->
      <text x="1660" y="920" font-family="Inter, SF Pro, Arial, sans-serif" font-size="18" fill="${textColor}" opacity="0.5" text-anchor="end">
        by Bhargav
      </text>

      <!-- Tech Badge -->
      <rect x="120" y="860" width="200" height="40" rx="20" fill="${primaryColor}" opacity="0.1"/>
      <text x="220" y="887" font-family="Inter, SF Pro, Arial, sans-serif" font-size="16" font-weight="600" fill="${primaryColor}" text-anchor="middle">
        AI-Generated
      </text>
    </svg>`;

    // Generate PNG from SVG and return as base64 (production-safe)
    const pngBuffer = await sharp(Buffer.from(svg))
      .png({ quality: 95 })
      .toBuffer();

    const base64Image = pngBuffer.toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log('✅ Professional infographic created (SVG fallback)');

    return {
      imageUrl,
      imageBase64: base64Image,
      cost: 0
    };
  }

  /**
   * Helper: Wrap text for SVG
   */
  private wrapText(text: string, x: number, y: number, fontSize: number, color: string, maxWidth: number): string {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      // Rough estimate: each char is ~0.6 * fontSize wide
      if (testLine.length * (fontSize * 0.6) > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);

    // Limit to 3 lines
    lines = lines.slice(0, 3);

    return lines.map((line, i) => `
      <text x="${x}" y="${y + (i * (fontSize + 10))}" font-family="Inter, SF Pro, Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" text-anchor="middle">
        ${line}${i === 2 && lines.length > 3 ? '...' : ''}
      </text>
    `).join('');
  }

  /**
   * Helper: Truncate text
   */
  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // ============================================
  // LEGACY METHODS (maintained for compatibility)
  // ============================================

  /**
   * Search stock photos from Pexels
   */
  async searchStockPhotos(query: string, perPage: number = 6): Promise<PexelsPhoto[]> {
    if (!this.pexelsApiKey) {
      throw new Error('PEXELS_API_KEY not configured');
    }

    try {
      const response = await axios.get(`${this.PEXELS_BASE_URL}/search`, {
        headers: { 'Authorization': this.pexelsApiKey },
        params: { query, per_page: perPage, orientation: 'landscape' }
      });

      return response.data.photos.map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        photographer: photo.photographer,
        src: {
          original: photo.src.original,
          large: photo.src.large,
          medium: photo.src.medium,
          small: photo.src.small
        }
      }));
    } catch (error: any) {
      console.error('Error searching Pexels:', error.message);
      return [];
    }
  }

  /**
   * Optimize image for LinkedIn
   */
  async optimizeImageForLinkedIn(imageUrl: string, outputPath: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      await sharp(buffer)
        .resize(1200, 627, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      return outputPath;
    } catch (error: any) {
      console.error('Error optimizing image:', error.message);
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Validate API keys
   */
  async validateApiKeys(): Promise<{ gemini: boolean; pexels: boolean }> {
    const results = { gemini: false, pexels: false };

    try {
      // New @google/genai SDK API
      await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'test'
      });
      results.gemini = true;
    } catch { results.gemini = false; }

    if (this.pexelsApiKey) {
      try {
        await axios.get(`${this.PEXELS_BASE_URL}/search?query=test&per_page=1`, {
          headers: { 'Authorization': this.pexelsApiKey }
        });
        results.pexels = true;
      } catch { results.pexels = false; }
    }

    return results;
  }

  /**
   * Legacy method - Generate infographic image
   * Now wraps the new generateImageFromPost method
   */
  async generateInfographicImage(params: {
    postContent: string;
    topic?: string;
    templateType?: string;
    colorPalette?: string;
  }): Promise<{
    imageUrl: string;
    imageBase64?: string;
    templateUsed: string;
    extractedData: any;
    webResearch?: string;
    photos: PexelsPhoto[];
    searchQuery: string;
    cost: number;
  }> {
    try {
      const result = await this.generateImageFromPost(params.postContent, {
        colorScheme: this.mapLegacyColorPalette(params.colorPalette)
      });

      const searchQuery = result.analysis.techKeywords.slice(0, 3).join(' ') + ' technology';
      let photos: PexelsPhoto[] = [];

      try {
        photos = await this.searchStockPhotos(searchQuery, 4);
      } catch (e) {
        console.log('Stock photos fetch failed, continuing without them');
      }

      return {
        imageUrl: result.imageUrl,
        imageBase64: result.imageBase64,
        templateUsed: result.analysis.contentType || 'insight',
        extractedData: {
          headline: result.analysis.mainTopic,
          keyPoints: result.analysis.keyPoints,
          metrics: result.analysis.keyMetrics
        },
        webResearch: result.analysis.visualConcept,
        photos,
        searchQuery,
        cost: result.cost
      };
    } catch (error: any) {
      console.error('generateInfographicImage error:', error);
      throw error;
    }
  }

  /**
   * Legacy method - Get infographic images for post
   */
  async getInfographicImagesForPost(postContent: string, topic?: string): Promise<{
    searchQuery: string;
    photos: PexelsPhoto[];
    infographicPrompt?: string;
    imageUrl: string;
    imageBase64?: string;
    templateUsed: string;
    extractedData: any;
    webResearch?: string;
    cost: number;
  }> {
    return this.generateInfographicImage({ postContent, topic });
  }

  /**
   * Map legacy color palette names to new scheme
   */
  private mapLegacyColorPalette(palette?: string): ImageGenerationOptions['colorScheme'] {
    const mapping: Record<string, ImageGenerationOptions['colorScheme']> = {
      'professional_blue': 'tech-blue',
      'energetic_gradient': 'modern-gradient',
      'minimalist_mono': 'clean-white',
      'tech_teal': 'tech-blue',
      'warm_professional': 'vibrant-tech'
    };
    return palette ? (mapping[palette] || 'tech-blue') : 'tech-blue';
  }

  /**
   * Legacy prompt builder (maintained for compatibility)
   */
  public buildNanoBananaPrompt(
    templateType: string,
    extractedData: any,
    postContent: string,
    webResearch: string,
    colorPalette?: string
  ): string {
    // Use new system
    const analysis: PostAnalysis = {
      mainTopic: extractedData?.headline || 'Tech Insights',
      subTopics: [],
      keyMetrics: extractedData?.metrics || [],
      keyPoints: extractedData?.keyPoints || [],
      tone: 'educational',
      contentType: templateType as any || 'insight',
      techKeywords: ['technology', 'innovation', 'AI'],
      visualConcept: 'professional tech infographic'
    };

    const options: ImageGenerationOptions = {
      style: 'minimal-data',
      colorScheme: this.mapLegacyColorPalette(colorPalette),
      aspectRatio: '16:9',
      includeText: true
    };

    return this.buildTechInfographicPrompt(analysis, options);
  }
}

// Export singleton
export const imageService = new ImageService();
export default ImageService;

// Export template and color scheme options for UI
export const AVAILABLE_STYLES = [
  { value: 'minimal-data', label: 'Minimal Data', description: 'Clean metrics and numbers' },
  { value: 'gradient-abstract', label: 'Gradient Abstract', description: 'Modern flowing backgrounds' },
  { value: 'icon-grid', label: 'Icon Grid', description: 'Framework/Process with icons' },
  { value: 'chart-focus', label: 'Chart Focus', description: 'Data visualization emphasis' },
  { value: 'conceptual', label: 'Conceptual', description: 'Abstract tech imagery' }
] as const;

export const AVAILABLE_COLOR_SCHEMES = [
  { value: 'tech-blue', label: 'Tech Blue', description: 'LinkedIn professional (default)' },
  { value: 'modern-gradient', label: 'Modern Gradient', description: 'Startup & innovation' },
  { value: 'dark-mode', label: 'Dark Mode', description: 'Developer & technical' },
  { value: 'clean-white', label: 'Clean White', description: 'Educational & minimal' },
  { value: 'vibrant-tech', label: 'Vibrant Tech', description: 'Bold & attention-grabbing' },
  { value: 'minimalist-mono', label: 'Minimalist', description: 'Premium & elegant' },
  { value: 'warm-professional', label: 'Warm Professional', description: 'Marketing & sales' }
] as const;

export const AVAILABLE_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 Landscape', description: 'Standard LinkedIn (1792x1024)' },
  { value: '1:1', label: '1:1 Square', description: 'Instagram style (1080x1080)' },
  { value: '4:5', label: '4:5 Vertical', description: 'Mobile carousel (1080x1350)' }
] as const;
