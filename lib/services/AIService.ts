import OpenAI from 'openai';
import {
  generatePostPrompt,
  improvePostPrompt,
  CONTENT_ANALYSIS_PROMPT,
  HIGH_ENGAGEMENT_TEMPLATES,
  TONE_VARIATIONS
} from '../prompts/linkedin-templates';

export type PostTemplate = keyof typeof HIGH_ENGAGEMENT_TEMPLATES;
export type PostTone = keyof typeof TONE_VARIATIONS;

export interface GeneratePostOptions {
  topic: string;
  template: PostTemplate;
  tone?: PostTone;
  additionalContext?: string;
}

export interface GeneratePostResult {
  content: string;
  tokensUsed: number;
  cost: number;
  model: string;
}

export interface ImprovePostOptions {
  originalPost: string;
  feedbackPoints: string[];
}

export interface AnalyzePostResult {
  scores: {
    hookStrength: number;
    readability: number;
    value: number;
    specificity: number;
    callToAction: number;
    length: number;
    hashtags: number;
    engagementPotential: number;
  };
  suggestions: string[];
  overallScore: number;
}

class AIService {
  private openai: OpenAI;
  private model: string = process.env.OPENAI_CHAT_MODEL || 'gpt-5.2'; // Primary model
  private fallbackModel: string = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini'; // Fallback
  private SERPER_API_KEY: string | undefined = process.env.SERPER_API_KEY;

  // Pricing per 1K tokens (as of 2024)
  private readonly PRICING = {
    'gpt-5.2': { input: 0.01, output: 0.03 },
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4o-mini': { input: 0.005, output: 0.015 }
  };

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Estimate tokens in text (1 token ≈ 4 characters for English)
   * This is a rough estimate - actual token count from API is used for accurate cost tracking
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    // OpenAI will provide exact count in response
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on tokens and model
   */
  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING] || this.PRICING['gpt-4-turbo-preview'];
    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Generate LinkedIn post content
   */
  async generatePost(options: GeneratePostOptions): Promise<GeneratePostResult> {
    const { topic, template, tone = 'professional', additionalContext } = options;

    // Create the prompt
    const systemPrompt = generatePostPrompt(topic, template, tone, additionalContext);
    // Optional: web search enrichment
    const webContext = await this.fetchWebContext(`${topic} ${additionalContext || ''}`.trim());

    // Count input tokens (estimate)
    const inputTokens = this.estimateTokens(systemPrompt);

    try {
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Create a high-engagement LinkedIn post about: ${topic}\n\nWEB CONTEXT (optional):\n${webContext || 'n/a'}`
          }
        ],
        temperature: 0.8, // Creative but controlled
        max_tokens: 1000, // Enough for a full post
        top_p: 0.9,
        frequency_penalty: 0.3, // Reduce repetition
        presence_penalty: 0.3 // Encourage diverse content
      });

      const content = completion.choices[0]?.message?.content || '';
      const outputTokens = completion.usage?.completion_tokens || this.estimateTokens(content);
      const totalTokens = completion.usage?.total_tokens || (inputTokens + outputTokens);

      const cost = this.calculateCost(inputTokens, outputTokens, this.model);

      return {
        content,
        tokensUsed: totalTokens,
        cost,
        model: this.model
      };
    } catch (error: any) {
      // If GPT-4 fails or is too expensive, fallback to GPT-3.5
      console.error('Error with primary model, trying fallback:', error.message);

      const fallbackCompletion = await this.openai.chat.completions.create({
        model: this.fallbackModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Create a high-engagement LinkedIn post about: ${topic}\n\nWEB CONTEXT (optional):\n${webContext || 'n/a'}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      const content = fallbackCompletion.choices[0]?.message?.content || '';
      const outputTokens = fallbackCompletion.usage?.completion_tokens || this.estimateTokens(content);
      const totalTokens = fallbackCompletion.usage?.total_tokens || (inputTokens + outputTokens);

      const cost = this.calculateCost(inputTokens, outputTokens, this.fallbackModel);

      return {
        content,
        tokensUsed: totalTokens,
        cost,
        model: this.fallbackModel
      };
    }
  }

  /**
   * Improve existing post
   */
  async improvePost(options: ImprovePostOptions): Promise<GeneratePostResult> {
    const { originalPost, feedbackPoints } = options;

    const systemPrompt = improvePostPrompt(originalPost, feedbackPoints);
    const inputTokens = this.estimateTokens(systemPrompt);

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content || '';
    const outputTokens = completion.usage?.completion_tokens || this.estimateTokens(content);
    const totalTokens = completion.usage?.total_tokens || (inputTokens + outputTokens);

    const cost = this.calculateCost(inputTokens, outputTokens, this.model);

    return {
      content,
      tokensUsed: totalTokens,
      cost,
      model: this.model
    };
  }

  /**
   * Analyze post quality and provide scores
   */
  async analyzePost(post: string): Promise<AnalyzePostResult> {
    const prompt = CONTENT_ANALYSIS_PROMPT.replace('{post}', post);
    const inputTokens = this.estimateTokens(prompt); // Rough estimate

    const completion = await this.openai.chat.completions.create({
      model: this.fallbackModel,
      messages: [
        {
          role: 'system',
          content: 'You are a LinkedIn content analyst. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // More deterministic for analysis
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(responseText);

    // Calculate overall score
    const scores = analysis.scores || {};
    const scoreValues = Object.values(scores) as number[];
    const overallScore = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length;

    return {
      scores: {
        hookStrength: scores.hookStrength || 0,
        readability: scores.readability || 0,
        value: scores.value || 0,
        specificity: scores.specificity || 0,
        callToAction: scores.callToAction || 0,
        length: scores.length || 0,
        hashtags: scores.hashtags || 0,
        engagementPotential: scores.engagementPotential || 0
      },
      suggestions: analysis.suggestions || [],
      overallScore: Math.round(overallScore * 10) / 10
    };
  }

  /**
   * Generate multiple post variations
   */
  async generateVariations(
    topic: string,
    count: number = 3
  ): Promise<GeneratePostResult[]> {
    const templates: PostTemplate[] = ['personal_story', 'framework_post', 'how_to'];
    const variations: GeneratePostResult[] = [];

    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const result = await this.generatePost({
        topic,
        template: templates[i],
        tone: 'professional'
      });
      variations.push(result);
    }

    return variations;
  }

  /**
   * Get estimated cost for generation
   */
  estimateCost(topic: string, template: PostTemplate): number {
    // Rough estimate: average prompt is ~500 tokens, output is ~300 tokens
    const estimatedInputTokens = 500;
    const estimatedOutputTokens = 300;
    return this.calculateCost(estimatedInputTokens, estimatedOutputTokens, this.model);
  }

  // Lightweight web search using Serper (Google) if configured
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

  /**
   * Check if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default AIService;
