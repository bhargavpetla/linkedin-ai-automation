import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface VideoAnalysisResult {
  summary: string;
  keyPoints: string[];
  themes: string[];
  suggestedLinkedInPost: string;
  transcription?: string;
  tokensUsed: number;
  cost: number;
}

class VideoAnalysisService {
  private genAI: GoogleGenAI;
  private openai: OpenAI;
  private readonly WHISPER_COST_PER_MINUTE = 0.006; // $0.006 per minute
  private readonly GEMINI_ANALYSIS_COST = 0.002; // ~$0.002 for Gemini analysis
  private readonly POST_MODEL_VENDOR = process.env.POST_MODEL_VENDOR || 'gemini'; // 'gemini' | 'openai'
  private readonly OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'; // e.g., 'gpt-5.2'
  private readonly SERPER_API_KEY = process.env.SERPER_API_KEY;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables');
    }

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not found for Whisper transcription');
    }

    // New @google/genai SDK
    this.genAI = new GoogleGenAI({ apiKey: geminiKey });
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  // Optional: lightweight web search using Serper (Google) if SERPER_API_KEY is set
  private async fetchWebContext(query: string): Promise<string> {
    try {
      if (!this.SERPER_API_KEY || !query) return '';
      const resp = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.SERPER_API_KEY
        },
        body: JSON.stringify({ q: query, num: 5 })
      } as any);
      if (!resp.ok) return '';
      const data = await resp.json();
      const items: any[] = data?.organic || [];
      const lines = items.slice(0, 5).map((it: any) => `- ${it.title}: ${it.snippet || it.link}`);
      return lines.join('\n');
    } catch {
      return '';
    }
  }

  // OpenAI generator path (e.g., gpt-5.2 when configured)
  private async generateWithOpenAI(content: string, additionalContext?: string, webContext?: string): Promise<VideoAnalysisResult> {
    const system = `You are a LinkedIn content expert. Make the writing very human and authentic, business-focused yet technically accurate. Use ASCII-safe characters, minimal emojis (0-2). Use short paragraphs and hyphen bullets. Return ONLY the JSON.`;
    let prompt = `Analyze this content and produce the JSON described below.\n\nCONTENT:\n${content}\n`;
    if (additionalContext) prompt += `\nADDITIONAL CONTEXT:\n${additionalContext}\n`;
    if (webContext) prompt += `\nWEB CONTEXT:\n${webContext}\n`;
    prompt += `\nReturn a JSON object with keys: summary, keyPoints (3-5), themes (2-3), linkedInPost.`;

    const completion = await this.openai.chat.completions.create({
      model: this.OPENAI_CHAT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    } as any);

    const text = completion.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse response');
    const parsed = JSON.parse(jsonMatch[0]);
    const tokensUsed = Math.ceil((prompt.length + text.length) / 4);
    return {
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      themes: parsed.themes || [],
      suggestedLinkedInPost: parsed.linkedInPost || parsed.linkedinPost || '',
      tokensUsed,
      cost: this.GEMINI_ANALYSIS_COST
    };
  }

  // No-op placeholder: we do not extract audio on serverless. We transcribe supported containers directly.
  private async extractAudio(_videoPath: string): Promise<string> {
    throw new Error('Audio extraction is not supported in this environment');
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  private async transcribeAudio(audioPath: string): Promise<{ text: string; duration: number; cost: number }> {
    try {
      // Get audio duration estimate
      const duration = await this.getAudioDurationFromFile(audioPath);

      // Read audio file
      const stats = fs.statSync(audioPath);
      const maxBytes = 25 * 1024 * 1024; // ~25MB typical API limit
      if (stats.size > maxBytes) {
        throw new Error(`Audio file too large for transcription (~${(stats.size/1024/1024).toFixed(1)}MB). Please use a shorter clip.`);
      }
      const audioFile = fs.createReadStream(audioPath);

      // Transcribe with Whisper
      let transcriptionText = '';
      try {
        const transcription = await this.openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'en'
        } as any);
        // SDK may return { text } or a string depending on version
        transcriptionText = (typeof transcription === 'string') ? transcription : (transcription?.text ?? '');
      } catch (primaryErr: any) {
        console.warn('Whisper-1 failed, retrying with gpt-4o-mini-transcribe...', primaryErr?.message);
        const retryFile = fs.createReadStream(audioPath);
        const retry = await this.openai.audio.transcriptions.create({
          file: retryFile,
          model: 'gpt-4o-mini-transcribe',
          language: 'en'
        } as any);
        transcriptionText = (typeof retry === 'string') ? retry : (retry?.text ?? '');
      }

      // Calculate cost
      const cost = (duration / 60) * this.WHISPER_COST_PER_MINUTE;

      return {
        text: transcriptionText,
        duration,
        cost
      };
    } catch (error: any) {
      console.error('Whisper transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Get audio duration in seconds using Whisper API headers
   */
  private async getAudioDurationFromFile(audioPath: string): Promise<number> {
    try {
      // For simplicity, estimate based on file size (rough approximation)
      const stats = fs.statSync(audioPath);
      // Average MP3 bitrate ~128kbps = 16KB/s
      // This is a rough estimate; exact duration comes from Whisper
      const estimatedSeconds = (stats.size / 16000) * 1.2; // Add 20% buffer
      return estimatedSeconds;
    } catch (error) {
      console.warn('Could not get audio duration, using default estimate');
      return 60; // Default estimate of 1 minute
    }
  }

  /**
   * Analyze video from downloaded file:
   * 1. Extract audio from video
   * 2. Transcribe audio with Whisper
   * 3. Analyze transcript and create LinkedIn post
   * 
   * FALLBACK: If audio extraction fails, use description-based analysis
   */
  async analyzeVideoFromFile(videoPath: string, description?: string): Promise<VideoAnalysisResult> {
    let transcription = '';
    let whisperCost = 0;
    let audioPath: string | null = null;
    const ext = path.extname(videoPath).toLowerCase();
    const audioExts = ['.m4a', '.mp3', '.aac', '.wav', '.ogg', '.flac', '.mpega'];
    const videoExts = ['.mp4', '.mov', '.webm', '.mkv', '.mpg', '.mpeg', '.m4v', '.avi'];
    const isAudioFile = audioExts.includes(ext);

    try {
      // Step 1: Extract or use existing audio
      if (isAudioFile) {
        console.log('Detected audio file input, skipping extraction...');
        audioPath = videoPath;
      } else if (videoExts.includes(ext)) {
        console.log('Detected transcribable video file, using directly for transcription...');
        audioPath = videoPath; // Whisper supports video containers like mp4
      } else {
        throw new Error(`Unsupported file type for transcription: ${ext}`);
      }

      // Wrap transcription and analysis in inner try/catch
      try {
        // Step 2: Transcribe audio with Whisper
        console.log('Step 2: Transcribing audio with Whisper...');
        const transcriptionResult = await this.transcribeAudio(audioPath);
        transcription = transcriptionResult.text;
        whisperCost = transcriptionResult.cost;
        console.log('Transcription complete:', transcription.substring(0, 100) + '...');

        // Step 3 & 4: Analyze and generate LinkedIn post
        console.log('Step 3-4: Analyzing transcript and creating LinkedIn post...');
        const result = await this.generatePostFromTranscript(transcription, description);

        // Cleanup audio file if it was a temp extracted file (not original input)
        if (audioPath && !isAudioFile && fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }

        return {
          ...result,
          transcription,
          cost: whisperCost + result.cost
        };
      } catch (audioError: any) {
        console.warn('Audio extraction/transcription failed, falling back to description analysis...');
        console.warn('Error:', audioError.message);

        // Cleanup audio file if it exists
        if (audioPath && !isAudioFile && fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }

        // FALLBACK: Use description-based analysis
        if (!description || description.trim().length === 0) {
          throw new Error('Audio extraction failed and no description provided. Please provide a description of the reel content.');
        }

        console.log('Using provided description for analysis (fallback)');
        return this.generatePostFromDescription(description, undefined);
      }
    } catch (error: any) {
      // Cleanup on error
      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      console.error('Error analyzing video:', error.message);
      throw error;
    }
  }

  /**
   * Analyze video content from description only (fallback when download fails)
   */
  async analyzeVideoFromDescription(description?: string, videoUrl?: string): Promise<VideoAnalysisResult> {
    if (!description || description.trim().length === 0) {
      throw new Error('Please provide a video description');
    }

    console.log('Using description-based analysis (fallback)');
    return this.generatePostFromDescription(description, videoUrl);
  }

  /**
   * Generate LinkedIn post from transcription (Step 4-5)
   */
  private async generatePostFromTranscript(
    transcription: string,
    additionalContext?: string
  ): Promise<VideoAnalysisResult> {
    // Optional: fetch web context to enrich post
    const webContext = await this.fetchWebContext(additionalContext || transcription.substring(0, 120));
    if (this.POST_MODEL_VENDOR === 'openai') {
      return this.generateWithOpenAI(transcription, additionalContext, webContext);
    }

    let prompt = `You are a LinkedIn content expert. Analyze this Instagram reel/video transcript and create a professional, engaging LinkedIn post following best practices.
  Make the writing very human and authentic, business-focused yet technically accurate, and directly usable on LinkedIn.
  Prefer first person when natural, use contractions, avoid buzzwords and generic platitudes. Vary sentence length. Include one concrete, practical detail.
  Use plain ASCII characters so it is copy/paste safe (avoid fancy unicode bullets/symbols). Keep emojis minimal (0-2, optional).

TRANSCRIPT:
${transcription}

WEB CONTEXT (optional, if present):
${webContext || 'n/a'}`;

    if (additionalContext) {
      prompt += `\n\nADDITIONAL CONTEXT:\n${additionalContext}`;
    }

    prompt += `

ANALYSIS INSTRUCTIONS:
1. Extract main message and key themes
2. Identify 3-5 key takeaways
3. Note any actionable advice or insights

LINKEDIN POST REQUIREMENTS (Best Practices):
- Hook: Start with a compelling 1-2 line hook that makes people stop scrolling
- Length: 800-1,300 characters (optimal for engagement)
- Structure: Use short paragraphs (1-2 lines) for readability
- Include: Specific examples, data points, or quotes from transcript
- CTA: End with an engaging question to spark comments
- Hashtags: 5-7 relevant hashtags that match your industry
- Tone: Professional but conversational, suitable for tech/business audience
- Emoji: Optional, 0-2 only, avoid overuse
- Characters: Use standard ASCII punctuation and hyphen bullets ('- ') for lists.

Return a JSON object with this structure:
{
  "summary": "Brief 1-sentence summary of the video content",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "themes": ["theme1", "theme2", "theme3"],
  "linkedInPost": "The complete LinkedIn post ready to publish, including hashtags"
}`;

    try {
      // New @google/genai SDK API
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Could not extract JSON from response:', responseText.substring(0, 200));
        throw new Error('Could not parse response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Estimate token usage
      const tokensUsed = Math.ceil((prompt.length + responseText.length) / 4);

      return {
        summary: parsed.summary || '',
        keyPoints: parsed.keyPoints || [],
        themes: parsed.themes || [],
        suggestedLinkedInPost: parsed.linkedInPost || '',
        tokensUsed,
        cost: this.GEMINI_ANALYSIS_COST
      };
    } catch (error: any) {
      console.error('Error generating post from transcript:', error.message);
      throw new Error('Failed to generate LinkedIn post from transcript');
    }
  }

  /**
   * Generate LinkedIn post from description (fallback)
   */
  private async generatePostFromDescription(
    description: string,
    videoUrl?: string
  ): Promise<VideoAnalysisResult> {
    const webContext = await this.fetchWebContext(description);
    if (this.POST_MODEL_VENDOR === 'openai') {
      return this.generateWithOpenAI(description, videoUrl, webContext);
    }

    let prompt = `You are a LinkedIn content expert. Based on this video/reel description, create a professional, engaging LinkedIn post following best practices.
  Make the writing very human and authentic, business-focused yet technically accurate, and directly usable on LinkedIn.
  Prefer first person when natural, use contractions, avoid buzzwords and generic platitudes. Vary sentence length. Include one concrete, practical detail.
  Use plain ASCII characters so it is copy/paste safe (avoid fancy unicode bullets/symbols). Keep emojis minimal (0-2, optional).

VIDEO DESCRIPTION:
${description}

WEB CONTEXT (optional, if present):
${webContext || 'n/a'}`;

    if (videoUrl) {
      prompt += `\n\nVIDEO URL: ${videoUrl}`;
    }

    prompt += `

LINKEDIN POST REQUIREMENTS (Best Practices):
- Hook: Start with a compelling 1-2 line hook that makes people stop scrolling
- Length: 800-1,300 characters (optimal for engagement)
- Structure: Use short paragraphs (1-2 lines) for readability
- Include: Specific examples or insights from the description
- CTA: End with an engaging question to spark comments
- Hashtags: 5-7 relevant hashtags
- Tone: Professional but conversational, suitable for tech/business audience
- Emoji: Optional, 0-2 only, avoid overuse
- Characters: Use standard ASCII punctuation and hyphen bullets ('- ') for lists.

Extract key themes and return a JSON object with:
{
  "summary": "Brief 1-sentence summary of content",
  "keyPoints": ["point1", "point2", "point3"],
  "themes": ["theme1", "theme2"],
  "linkedInPost": "The complete LinkedIn post ready to publish, including hashtags"
}`;

    try {
      // New @google/genai SDK API
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Estimate token usage
      const tokensUsed = Math.ceil((prompt.length + responseText.length) / 4);

      return {
        summary: parsed.summary || '',
        keyPoints: parsed.keyPoints || [],
        themes: parsed.themes || [],
        suggestedLinkedInPost: parsed.linkedInPost || '',
        tokensUsed,
        cost: this.GEMINI_ANALYSIS_COST
      };
    } catch (error: any) {
      console.error('Error generating post from description:', error.message);
      throw new Error('Failed to generate LinkedIn post');
    }
  }

  /**
   * Save uploaded video file
   */
  async saveUploadedVideo(fileBuffer: Buffer, filename: string): Promise<string> {
    const baseTemp = process.env.VERCEL ? '/tmp' : process.cwd();
    const tempDir = path.join(baseTemp, 'temp');

    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, fileBuffer);

    return filePath;
  }

  /**
   * Clean up temp video files
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    const baseTemp = process.env.VERCEL ? '/tmp' : process.cwd();
    const tempDir = path.join(baseTemp, 'temp');

    if (!fs.existsSync(tempDir)) {
      return;
    }

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = olderThanHours * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old temp file: ${file}`);
      }
    });
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // New @google/genai SDK API
      await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'test'
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton
export const videoAnalysisService = new VideoAnalysisService();
export default VideoAnalysisService;
