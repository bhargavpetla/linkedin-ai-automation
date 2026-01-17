// LinkedIn Content Generation Prompts - Optimized for Maximum Engagement

export const LINKEDIN_POST_SYSTEM_PROMPT = `SYSTEM PROMPT: LINKEDIN NARRATIVE ENGINEER

ROLE:
You are an expert LinkedIn Social Media Copywriter specializing in AI, Technology, and Professional Thought Leadership. Transform raw transcripts, research notes, or topics into high-performance LinkedIn posts using the 2025 Algorithmic Distribution Framework.

ANALYSIS PHASE:
- Extract Golden Nuggets: Find provocative, contrarian, or tactical insights with standalone value.
- Persona Preservation: Write in authentic first person; use natural contractions; avoid generic buzzwords.
- Quantified Proof: Include specific stats, metrics, or concrete examples.

WRITING REQUIREMENTS:
- Hook (first 210 chars): Curiosity gap, pattern interrupt, or quantified promise that forces a "See More" click.
- White Space Engineering: 1–2 line paragraphs; strategic breaks; visual rhythm.
- Cliffhanger Rhythm: After the hook, insert 4–5 empty lines to create a visual cliff. Then continue with short paragraphs and bullets.
- Tone: Professional yet conversational, direct, human. Avoid corporate-speak.
- Formatting: Manual bullets (- or •). Optional ALL CAPS for 1–2 emphasis words. Emojis minimal (0–2, optional).
- Length: Target total 1,300–1,600 characters.

ENGAGEMENT OPTIMIZATION:
- Call to Engagement (CTE): End with a specific, open-ended question that encourages a 15+ word reply.
- Hashtags: Exactly 3–5 relevant hashtags at the bottom.
- Mentions: Tag 0–3 collaborators naturally if relevant.

OUTPUT:
Return ONLY the final LinkedIn post, formatted and ready to publish.`;

export const HIGH_ENGAGEMENT_TEMPLATES = {
  personal_story: `Create a LinkedIn post about [TOPIC] following this proven viral structure:

🎯 HOOK: Start with a bold statement or surprising statistic
Example: "I made a $50K mistake in our AI implementation. Here's what I learned:"

📖 STORY: Share a specific personal experience (2-3 paragraphs, short lines)
- What happened
- What went wrong or surprised you
- The turning point

💡 INSIGHT: Extract the key lesson
- What you'd do differently
- The framework you now use
- The principle you discovered

🔑 TAKEAWAY: One actionable item readers can use today

❓ CTA: Ask a question to drive comments
Example: "What's your biggest challenge with AI adoption?"

Add 5-7 relevant hashtags.`,

  contrarian_take: `Create a LinkedIn post with a contrarian viewpoint on [TOPIC]:

🚫 HOOK: Challenge conventional wisdom
Example: "Everyone says [popular belief]. But after implementing AI in 50+ projects, I disagree."

📊 EVIDENCE: Share data or specific examples
- Real numbers
- Client cases
- Industry observations

🔄 ALTERNATIVE: Present your approach
- Why it works better
- Results you've seen
- When to use it

⚠️ CAVEAT: Acknowledge when traditional approach works
- Nuance is credibility
- Show you understand both sides

💬 CTA: Invite debate
Example: "Change my mind. What's your experience?"

Hashtags: Mix of broad and niche.`,

  framework_post: `Create a LinkedIn post teaching a framework about [TOPIC]:

🎯 HOOK: Promise a specific outcome
Example: "Here's my 3-step framework for [outcome] that saved our team 20 hours/week"

📋 FRAMEWORK: Number each step (3-5 steps max)

Step 1: [Name]
→ What to do
→ Why it works
→ Quick example

Step 2: [Name]
→ What to do
→ Why it works
→ Quick example

[Continue for each step]

🎁 BONUS: Add one extra insight

✅ IMPLEMENTATION: How to get started today

💬 CTA: Ask what framework they use

Hashtags focused on AI, productivity, leadership.`,

  stats_driven: `Create a data-driven LinkedIn post about [TOPIC]:

📊 HOOK: Lead with a shocking statistic
Example: "73% of AI projects fail in the first year. Here's why:"

🔍 ANALYSIS: Break down the numbers
- What the data reveals
- Why it matters now
- What's often missed

📈 TREND: Connect to bigger picture
- Industry implications
- Future predictions
- Opportunities

💡 ACTION: What to do with this info
- Specific steps
- Tools or resources
- Metrics to track

🤔 CTA: Ask for their data/experience

Add hashtags: #AI #DataScience #Technology`,

  client_win: `Create a success story post about [TOPIC]:

🎯 HOOK: Lead with the result
Example: "Client reduced AI model training time by 85%. Here's the playbook:"

⚠️ PROBLEM: What they struggled with
- Specific pain points
- Why it mattered
- Previous attempts

💡 SOLUTION: Your approach
- Key insight that changed everything
- What you implemented
- Why this vs alternatives

📈 RESULTS: Quantify the impact
- Metrics before/after
- Time saved
- Cost reduction
- Other benefits

🔑 LESSON: What others can learn
- Applicable principle
- When to use this approach

💬 CTA: "What's your biggest AI challenge?"

Hashtags for AI consulting and leadership.`,

  how_to: `Create a practical how-to post on [TOPIC]:

💡 HOOK: Promise quick value
Example: "You can implement [outcome] in 30 minutes. Here's how:"

⚙️ STEPS: Clear, actionable instructions

1. [Step name]
   • Exact action
   • Tools needed
   • Common mistakes to avoid

2. [Step name]
   • Exact action
   • Tools needed
   • Common mistakes to avoid

[Continue...]

⏱️ TIME: Set expectations
"This takes about [X] minutes"

🎁 PRO TIP: Share an insider trick

✅ VALIDATION: How to know it worked

💬 CTA: "What tool do you use for this?"

Hashtags: Mix of skill-based and industry tags.`,

  trend_analysis: `Create a thought leadership post about an AI trend [TOPIC]:

🔥 HOOK: Point out what everyone's missing
Example: "Everyone's talking about [trend], but they're missing the real story:"

📰 TREND: What's happening now
- Quick overview
- Why it's buzzing
- Surface-level takes

🎯 INSIGHT: Your unique perspective
- What others don't see
- Why it matters more/less than people think
- Second-order effects

🔮 PREDICTION: Where this goes
- 6-month outlook
- What to prepare for
- Opportunities to watch

💼 ACTION: What to do now
- Concrete steps
- Resources
- Skills to develop

💭 CTA: "Am I wrong? What's your take?"

Hashtags: Include trending ones + your expertise.`
};

export const TONE_VARIATIONS = {
  professional: "Maintain expert credibility, use industry terms appropriately, cite sources",
  casual: "Conversational and relatable, use simple language, occasional humor",
  technical: "Deep dive into implementation, include code or technical details, for technical audience",
  inspirational: "Focus on vision and possibility, use storytelling, emotional connection",
  educational: "Teaching-focused, step-by-step, include examples and analogies"
};

export const HASHTAG_STRATEGY = {
  ai_consultant: [
    "#ArtificialIntelligence", "#AIConsulting", "#MachineLearning",
    "#AITransformation", "#AILeadership", "#AIStrategy"
  ],
  technical: [
    "#AI", "#ML", "#DeepLearning", "#GenerativeAI", "#LLM", "#AIEngineering"
  ],
  business: [
    "#Innovation", "#DigitalTransformation", "#TechLeadership",
    "#FutureOfWork", "#BusinessStrategy"
  ],
  trending: [
    "#ChatGPT", "#GPT4", "#OpenAI", "#AITools", "#AIInBusiness"
  ]
};

export const CALL_TO_ACTION_PATTERNS = [
  "What's your experience with [topic]?",
  "Agree or disagree? Drop your thoughts below.",
  "What am I missing? Let me know in the comments.",
  "Have you tried this? Share your results.",
  "What would you add to this list?",
  "Which of these resonates most with you?",
  "What's your go-to approach?",
  "Challenge me on this. What's your take?",
  "Drop a 💡 if this was helpful.",
  "Tag someone who needs to see this."
];

// ========================================
// INFOGRAPHIC GENERATION SYSTEM
// Tech-focused LinkedIn Image Best Practices (2025)
// ========================================

export const INFOGRAPHIC_SYSTEM_PROMPT = `SYSTEM PROMPT: TECH LINKEDIN INFOGRAPHIC DESIGNER

ROLE:
You are an expert visual designer specializing in tech-focused LinkedIn infographics. You create modern, professional visuals that maximize engagement for technology, AI, SaaS, and startup content.

CORE DESIGN PRINCIPLES:
1. MINIMALIST TECH AESTHETIC: Clean lines, generous white space, flat design
2. DATA-FIRST VISUALIZATION: Numbers and metrics are heroes, not decorations
3. MOBILE-FIRST: 70% of LinkedIn views are mobile - design for thumbs
4. VISUAL HIERARCHY: Eye flow from headline → key insight → supporting data → CTA
5. BRAND-SAFE COLORS: Professional palettes that work for B2B audiences
6. ANTI-CLIP-ART: No cheesy graphics - modern illustrations or abstract visuals only

TECH LINKEDIN IMAGE BEST PRACTICES:
- Hook in 0.5 seconds: Bold headline or shocking stat visible at thumbnail size
- One Big Idea: Each infographic communicates ONE clear message
- Scannable: Information digestible in 3-5 seconds of scrolling
- Shareable: Design that makes people want to save/repost
- Professional: Would look appropriate in a Fortune 500 board presentation

TECHNICAL SPECIFICATIONS:
- Resolution: 1792x1024 (16:9) or 1080x1080 (1:1) or 1080x1350 (4:5)
- Typography: Bold sans-serif (Inter, SF Pro, Helvetica Neue)
- Color Strategy: 2-3 colors max, one accent for emphasis
- White Space: Minimum 25% negative space
- Text Size: Headlines 48px+, body 24px+ (mobile readable)
- Contrast: WCAG AA compliant (4.5:1 minimum)

VISUAL STYLE OPTIONS:
- Minimal Data Cards: Clean metric displays with trend indicators
- Gradient Abstract: Modern mesh gradients with glass-morphism overlays
- Icon Grid: Framework/process visualization with flat icons
- Chart Focus: Data visualization as the hero element
- Conceptual: Abstract tech imagery (neural networks, data flows, etc.)

OUTPUT: Production-ready prompt for Gemini Imagen that generates LinkedIn-optimized tech infographics.`;

export const INFOGRAPHIC_TEMPLATES = {
  kpi_dashboard: {
    name: "KPI Dashboard",
    description: "Clean metrics display with large numbers and trend indicators",
    structure: `
Modern tech KPI dashboard infographic:
- Bold headline at top (48-64px, dark text)
- 3-4 metric cards in horizontal row or 2x2 grid
- Each card: LARGE number (80px+), brief label, trend arrow with color (green up, red down)
- Subtle card shadows (2px blur, 10% opacity)
- Thin accent line under headline
- White/off-white background (#FAFAFA)
- Inter or SF Pro typography
- Generous padding (40px+ between cards)
- 16:9 aspect ratio (1792x1024)
- Mobile-readable at thumbnail size`,
    bestFor: ["metrics", "results", "statistics", "performance", "quarterly reports", "roi", "growth"]
  },

  timeline_horizontal: {
    name: "Horizontal Timeline",
    description: "Evolution or chronological progression with milestones",
    structure: `
Clean horizontal timeline for tech/business:
- Title at top left, not centered
- 4-6 milestone nodes connected by thin line (2px)
- Each milestone: Circle marker + Date above + Event below
- Alternating above/below placement for space
- Gradient line from primary to secondary color
- Flat design icons at each milestone
- Light background with subtle grid
- Clear date typography (bold)
- Event descriptions max 8 words
- 16:9 aspect ratio
- Arrow at end suggesting continuation`,
    bestFor: ["history", "evolution", "journey", "progress", "roadmap", "milestones", "product launch"]
  },

  funnel_visualization: {
    name: "Process Funnel",
    description: "Multi-stage process with metrics and conversion rates",
    structure: `
Modern conversion funnel infographic:
- 4-5 stages as horizontal bars (not triangle)
- Each bar: Stage name + Number + Percentage
- Bars decrease in width proportionally
- Color gradient from dark (top) to light (bottom)
- Conversion rate arrows between stages
- Clean sans-serif typography
- No 3D effects - flat design only
- Right-aligned percentages
- White background
- 4:5 aspect ratio (vertical)
- Drop-off insights highlighted`,
    bestFor: ["conversion", "sales process", "customer journey", "filtering", "stages", "pipeline", "marketing"]
  },

  educational_steps: {
    name: "Step-by-Step Guide",
    description: "Numbered process with clear instructions",
    structure: `
Vertical step-by-step infographic:
- Bold headline: "How to [X]" or "[N] Steps to [Outcome]"
- 4-6 numbered steps in vertical stack
- Each step: Number badge (circle) + Title (bold) + One-line description
- Connecting dotted line between steps
- Flat icons representing each concept
- Alternating subtle background tints
- Progress indicator on left side
- 4:5 aspect ratio (vertical)
- Perfect for LinkedIn carousel
- Each step scannable in 2 seconds`,
    bestFor: ["tutorial", "how-to", "guide", "process", "methodology", "framework", "tips"]
  },

  blueprint_technical: {
    name: "Technical Architecture",
    description: "System design with modern tech aesthetic",
    structure: `
Modern tech architecture diagram:
- Clean boxes representing components
- Labeled connections with arrows
- Color-coded by layer (frontend/backend/data)
- API endpoints as small badges
- Database icons for storage
- Cloud symbols for infrastructure
- Dark mode option (dark blue background)
- Monospace font for technical labels
- Grid background (subtle)
- 16:9 aspect ratio
- Legend explaining symbols`,
    bestFor: ["architecture", "system design", "technical explanation", "infrastructure", "workflow", "API", "cloud"]
  },

  comparison_matrix: {
    name: "Comparison Matrix",
    description: "Side-by-side feature comparison",
    structure: `
Clean comparison table infographic:
- Header row: Option names with logos/icons
- 5-7 feature rows with clear labels
- Checkmarks (✓) in green, X marks in red/gray
- Alternating row backgrounds (2% opacity)
- Highlight column for recommended option
- Summary row at bottom with verdict
- Clean borders (1px, light gray)
- Bold feature names, regular check marks
- 16:9 aspect ratio
- Winner badge on top choice`,
    bestFor: ["comparison", "versus", "alternatives", "features", "pros and cons", "evaluation", "tools"]
  },

  stat_highlight: {
    name: "Single Stat Hero",
    description: "One impactful number as the centerpiece",
    structure: `
Bold single-stat infographic:
- MASSIVE number (takes 50%+ of space)
- Number in accent color or gradient
- Brief context line below (24px)
- Subtle background pattern or gradient
- Optional: small chart showing trend
- Source citation in footer (small, gray)
- Minimal supporting text
- High contrast for impact
- 1:1 or 16:9 aspect ratio
- Perfect for thumb-stopping scroll`,
    bestFor: ["shocking statistic", "key metric", "research finding", "trend data", "announcement", "milestone"]
  },

  framework_diagram: {
    name: "Framework Diagram",
    description: "Conceptual model with connected elements",
    structure: `
Professional framework visualization:
- Central concept in middle (highlighted)
- 3-5 connected elements around it
- Each element: Icon + Title + 3-word description
- Connecting lines showing relationships
- Circular, hub-spoke, or matrix layout
- Consistent icon style throughout
- White space between elements (30%+)
- Color coding for categories
- 16:9 aspect ratio
- Clear visual hierarchy`,
    bestFor: ["framework", "model", "system", "methodology", "strategy", "concept map", "mental model"]
  },

  quote_highlight: {
    name: "Quote Highlight",
    description: "Impactful quote with visual treatment",
    structure: `
Quote-focused infographic:
- Large quotation marks as design element
- Quote text in large, readable font (36px+)
- Attribution below with photo/icon optional
- Gradient or solid background
- Quote text in contrasting color
- Minimal other elements
- Social proof indicators optional
- 1:1 aspect ratio ideal
- Perfect for thought leadership`,
    bestFor: ["quote", "testimonial", "insight", "thought leadership", "wisdom", "lesson learned"]
  },

  data_story: {
    name: "Data Story",
    description: "Multiple data points telling a narrative",
    structure: `
Data storytelling infographic:
- Headline stating the insight
- 3-4 supporting data points
- Mini charts or icons for each point
- Visual flow from problem to solution
- Before/after or cause/effect structure
- Color progression through story
- Call-out boxes for key insights
- 16:9 or 4:5 aspect ratio
- Narrative arc visible in design`,
    bestFor: ["case study", "research", "analysis", "report", "findings", "insights", "data-driven"]
  }
};

export const INFOGRAPHIC_COLOR_PALETTES = {
  // LinkedIn-native blue - trust, professional, tech
  professional_blue: {
    primary: "#0A66C2",      // LinkedIn blue
    secondary: "#00D4AA",    // Tech teal
    accent: "#FF6B35",       // Action orange
    background: "#FFFFFF",
    darkBg: "#0F172A",
    text: "#1E293B",
    textSecondary: "#64748B",
    bestFor: "corporate, technology, B2B, SaaS, professional"
  },

  // Modern gradient - startup, innovation
  energetic_gradient: {
    primary: "#6366F1",      // Indigo
    secondary: "#EC4899",    // Pink
    accent: "#14B8A6",       // Teal
    background: "#FAFAFA",
    darkBg: "#18181B",
    text: "#18181B",
    textSecondary: "#71717A",
    bestFor: "startup, creative, modern, AI, innovation"
  },

  // Clean minimal - premium, elegant
  minimalist_mono: {
    primary: "#000000",
    secondary: "#525252",
    accent: "#DC2626",       // Red accent
    background: "#FFFFFF",
    darkBg: "#171717",
    text: "#0A0A0A",
    textSecondary: "#737373",
    bestFor: "elegant, sophisticated, premium, executive"
  },

  // Tech teal - AI, future, digital
  tech_teal: {
    primary: "#06B6D4",      // Cyan
    secondary: "#8B5CF6",    // Purple
    accent: "#F59E0B",       // Amber
    background: "#F8FAFC",
    darkBg: "#0C4A6E",
    text: "#0F172A",
    textSecondary: "#475569",
    bestFor: "AI, machine learning, tech, digital, future"
  },

  // Growth/results - marketing, sales
  warm_professional: {
    primary: "#DC2626",      // Red
    secondary: "#2563EB",    // Blue
    accent: "#16A34A",       // Green
    background: "#FFFFFF",
    darkBg: "#1E293B",
    text: "#1E293B",
    textSecondary: "#64748B",
    bestFor: "marketing, sales, growth, results, revenue"
  },

  // Dark mode - developer, technical
  dark_mode: {
    primary: "#3B82F6",      // Blue
    secondary: "#10B981",    // Emerald
    accent: "#F59E0B",       // Amber
    background: "#0F172A",   // Slate 900
    darkBg: "#020617",       // Slate 950
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    bestFor: "developer, technical, code, engineering, DevOps"
  },

  // Vibrant tech - bold, attention-grabbing
  vibrant_tech: {
    primary: "#7C3AED",      // Violet
    secondary: "#0EA5E9",    // Sky
    accent: "#F97316",       // Orange
    background: "#FEFEFE",
    darkBg: "#1E1B4B",
    text: "#1E1B4B",
    textSecondary: "#6B7280",
    bestFor: "bold, attention, viral, breakthrough, announcement"
  }
};

export interface InfographicPromptParams {
  topic: string;
  templateType: keyof typeof INFOGRAPHIC_TEMPLATES;
  data?: {
    metrics?: Array<{ label: string; value: string; change?: string }>;
    steps?: Array<{ title: string; description: string }>;
    timeline?: Array<{ date: string; event: string }>;
    comparison?: { options: string[]; criteria: string[] };
  };
  colorPalette?: keyof typeof INFOGRAPHIC_COLOR_PALETTES;
  headline?: string;
  webResearchContext?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1';
}

export function generateInfographicPrompt(params: InfographicPromptParams): string {
  const template = INFOGRAPHIC_TEMPLATES[params.templateType];
  const colors = params.colorPalette
    ? INFOGRAPHIC_COLOR_PALETTES[params.colorPalette]
    : INFOGRAPHIC_COLOR_PALETTES.professional_blue;

  const aspectRatio = params.aspectRatio || '16:9';
  const resolution = aspectRatio === '16:9' ? '3840x2160' : '1200x1500';

  let dataSection = '';

  // Generate data-specific instructions based on template type
  if (params.data) {
    if (params.data.metrics && params.templateType === 'kpi_dashboard') {
      dataSection = `
METRIC CARDS TO DISPLAY:
${params.data.metrics.map((m, i) => `
Card ${i + 1}:
  - Value: ${m.value}
  - Label: ${m.label}
  - Change: ${m.change || 'N/A'}
`).join('')}`;
    }

    if (params.data.steps && params.templateType === 'educational_steps') {
      dataSection = `
STEPS TO DISPLAY:
${params.data.steps.map((s, i) => `
Step ${i + 1}: ${s.title}
  Description: ${s.description}
`).join('')}`;
    }

    if (params.data.timeline && params.templateType === 'timeline_horizontal') {
      dataSection = `
TIMELINE MILESTONES:
${params.data.timeline.map((t, i) => `
Milestone ${i + 1}: ${t.date}
  Event: ${t.event}
`).join('')}`;
    }
  }

  const webContext = params.webResearchContext
    ? `\n\nWEB RESEARCH CONTEXT:\n${params.webResearchContext}\n(Use this to inform visual elements, data accuracy, and current trends)`
    : '';

  return `${INFOGRAPHIC_SYSTEM_PROMPT}

SELECTED TEMPLATE: ${template.name}
Template Purpose: ${template.description}
Best Used For: ${template.bestFor.join(', ')}

TOPIC: ${params.topic}
${params.headline ? `HEADLINE: ${params.headline}` : ''}

COLOR PALETTE:
- Primary Color: ${colors.primary}
- Secondary Color: ${colors.secondary}
- Accent Color: ${colors.accent}
- Background: ${colors.background}
- Text Color: ${colors.text}
Palette Style: ${colors.bestFor}

LAYOUT SPECIFICATIONS:
${template.structure}
${dataSection}
${webContext}

TECHNICAL SPECIFICATIONS:
- Aspect Ratio: ${aspectRatio}
- Resolution: ${resolution} (4K quality)
- File Format: PNG with transparency support
- Text Rendering: Ultra-sharp, anti-aliased, crisp at all zoom levels
- Use "--text-sharp" flag if available in your image generation tool

ACCESSIBILITY & READABILITY:
- Minimum font size: 24px for body text, 48px+ for headlines
- High contrast ratios (WCAG AA compliant)
- Consistent visual hierarchy
- Clear information architecture

LINKEDIN OPTIMIZATION:
- Mobile-first design (70% of LinkedIn views are mobile)
- Thumb-stopping visual in first glance
- Information density: Not too cluttered, not too sparse
- Professional and credible appearance
- Shareable and saves-worthy quality

OUTPUT: Generate a complete, production-ready infographic prompt that can be directly used with AI image generation tools (Midjourney, DALL-E, Stable Diffusion, or similar). The prompt should be specific, detailed, and result in a professional LinkedIn-ready infographic.`;
}

export function analyzePostForInfographicType(postContent: string, webContext?: string): {
  recommendedTemplate: keyof typeof INFOGRAPHIC_TEMPLATES;
  reasoning: string;
  extractedData: any;
  confidence: number;
} {
  const content = postContent.toLowerCase();
  const contextContent = webContext ? webContext.toLowerCase() : '';
  const combined = content + ' ' + contextContent;

  // Score each template based on content keywords
  const scores: Record<keyof typeof INFOGRAPHIC_TEMPLATES, number> = {
    kpi_dashboard: 0,
    timeline_horizontal: 0,
    funnel_visualization: 0,
    educational_steps: 0,
    blueprint_technical: 0,
    comparison_matrix: 0,
    stat_highlight: 0,
    framework_diagram: 0,
    quote_highlight: 0,
    data_story: 0
  };

  // Count numbers/percentages in content
  const numberMatches = combined.match(/\d+(?:\.\d+)?%|\$[\d,]+[KMB]?|\d+x/gi) || [];
  const hasMultipleMetrics = numberMatches.length >= 3;
  const hasSingleBigStat = numberMatches.length === 1 && /\d{2,}%|\$[\d,]+[KMB]/.test(numberMatches[0]);

  // KPI Dashboard - multiple metrics, results-focused
  if (hasMultipleMetrics) scores.kpi_dashboard += 35;
  if (/revenue|profit|growth|metrics|kpi|results|performance|roi|increased|decreased/i.test(combined)) {
    scores.kpi_dashboard += 20;
  }

  // Timeline - chronological content
  if (/timeline|history|evolution|journey|roadmap|milestones|progression/i.test(combined)) {
    scores.timeline_horizontal += 35;
  }
  if (/\d{4}|years? ago|over the past|since \d/i.test(combined)) {
    scores.timeline_horizontal += 15;
  }

  // Funnel - conversion/process stages
  if (/funnel|conversion|stages?|pipeline|customer journey|drop.?off|leads?|prospects?/i.test(combined)) {
    scores.funnel_visualization += 35;
  }

  // Educational Steps - how-to content
  if (/how to|step[s]?\s*\d|guide|tutorial|learn|instructions|here's how/i.test(combined)) {
    scores.educational_steps += 35;
  }
  if (/first|second|third|then|next|finally|step \d/i.test(combined)) {
    scores.educational_steps += 15;
  }

  // Technical Architecture - system/tech content
  if (/architecture|infrastructure|api|workflow|backend|frontend|database|cloud|aws|gcp/i.test(combined)) {
    scores.blueprint_technical += 35;
  }
  if (/system design|tech stack|microservices|deployment/i.test(combined)) {
    scores.blueprint_technical += 15;
  }

  // Comparison Matrix - versus content
  if (/vs\.?|versus|compare|comparison|alternative|difference|better than|which one/i.test(combined)) {
    scores.comparison_matrix += 40;
  }
  if (/pros|cons|advantages|disadvantages|features/i.test(combined)) {
    scores.comparison_matrix += 15;
  }

  // Stat Highlight - single impactful number
  if (hasSingleBigStat) scores.stat_highlight += 40;
  if (/shocking|surprising|incredible|research shows|study found|did you know/i.test(combined)) {
    scores.stat_highlight += 20;
  }

  // Framework Diagram - conceptual models
  if (/framework|model|approach|methodology|principle|concept|mental model/i.test(combined)) {
    scores.framework_diagram += 30;
  }
  if (/pillar|component|element|layer|dimension/i.test(combined)) {
    scores.framework_diagram += 15;
  }

  // Quote Highlight - wisdom/insight content
  if (/[""].*[""]|said|quote|wisdom|lesson|truth|realize|insight/i.test(combined)) {
    scores.quote_highlight += 30;
  }
  if (/i learned|biggest lesson|key takeaway|truth is/i.test(combined)) {
    scores.quote_highlight += 15;
  }

  // Data Story - narrative with data
  if (hasMultipleMetrics && /story|journey|case study|result|transformation|before|after/i.test(combined)) {
    scores.data_story += 35;
  }
  if (/findings|research|analysis|report|discovered/i.test(combined)) {
    scores.data_story += 15;
  }

  // Find highest scoring template
  const maxScore = Math.max(...Object.values(scores));
  const recommendedTemplate = Object.keys(scores).find(
    key => scores[key as keyof typeof scores] === maxScore
  ) as keyof typeof INFOGRAPHIC_TEMPLATES;

  // Calculate confidence (0-100)
  const confidence = Math.min(Math.round((maxScore / 50) * 100), 100);

  // Get matched keywords for reasoning
  const template = INFOGRAPHIC_TEMPLATES[recommendedTemplate];
  const matchedKeywords = template.bestFor.filter(keyword =>
    combined.includes(keyword.toLowerCase())
  );

  return {
    recommendedTemplate,
    reasoning: `"${template.name}" selected (${confidence}% confidence). ` +
      (matchedKeywords.length > 0
        ? `Matched: ${matchedKeywords.join(', ')}`
        : `Best fit based on content structure`),
    extractedData: null,
    confidence
  };
}

export function generatePostPrompt(
  topic: string,
  template: keyof typeof HIGH_ENGAGEMENT_TEMPLATES,
  tone: keyof typeof TONE_VARIATIONS = 'professional',
  additionalContext?: string
): string {
  const templateContent = HIGH_ENGAGEMENT_TEMPLATES[template];
  const toneGuidance = TONE_VARIATIONS[tone];

  return `${LINKEDIN_POST_SYSTEM_PROMPT}

TEMPLATE TO USE:
${templateContent}

TOPIC: ${topic}

TONE: ${toneGuidance}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}` : ''}

IMPORTANT RULES:
1. First 210 characters must be a thumb-stopping hook (curiosity gap, pattern interrupt, or quantified promise)
2. Use white space engineering: 1–2 line paragraphs, 4–5 empty lines after the hook
3. Target 1,300–1,600 characters total
4. Include exactly 3–5 relevant hashtags at the end
5. End with a Call to Engagement that elicits 15+ word replies
6. Write in authentic first person; keep tone human and specific
7. Include at least one concrete number/example
8. Avoid corporate jargon and empty buzzwords

Generate a LinkedIn post that will stop scrolling and drive deep dwell time.`;
}

export function improvePostPrompt(
  originalPost: string,
  feedbackPoints: string[]
): string {
  return `You are a LinkedIn content expert. Improve this post while maintaining its core message.

ORIGINAL POST:
${originalPost}

FEEDBACK TO ADDRESS:
${feedbackPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

IMPROVEMENT GUIDELINES:
- Strengthen the hook in the first 1-2 lines
- Ensure mobile readability (short paragraphs)
- Add specific examples or numbers if missing
- Optimize call-to-action for comments
- Improve hashtag selection (5-7 most relevant)
- Keep under 1,300 characters
- Make it more actionable

Provide the improved version only, no explanations.`;
}

export function generateHashtags(
  topic: string,
  category: 'ai_consultant' | 'technical' | 'business' | 'trending'
): string[] {
  const baseHashtags = HASHTAG_STRATEGY[category];
  return baseHashtags.slice(0, 7);
}

export const CONTENT_ANALYSIS_PROMPT = `Analyze this LinkedIn post and provide scores (0-10) for:

1. Hook Strength: Does it stop scrolling in first 2 lines?
2. Readability: Short paragraphs, white space, mobile-friendly?
3. Value: Does it teach something concrete and actionable?
4. Specificity: Numbers, examples, names vs generic advice?
5. Call-to-Action: Clear question that invites comments?
6. Length: Optimal length (800-1300 characters)?
7. Hashtags: Relevant and strategic (5-7)?
8. Engagement Potential: Overall likelihood of high engagement?

POST:
{post}

Return JSON with scores and brief improvement suggestions.`;

export const POST_EXAMPLES_HIGH_ENGAGEMENT = `
EXAMPLE 1 (Personal Story - 15K impressions):
"I once spent 3 months building an AI model that nobody used.

The model was 95% accurate. The UI was clean. The API was fast.

But I made one critical mistake:

I built what I thought users needed, not what they actually wanted.

Here's what I learned about AI adoption:

1. Start with the problem, not the technology
→ Interview actual users first
→ Map their current workflow
→ Find the painful manual tasks

2. Build the smallest possible version
→ One use case
→ One metric to improve
→ Ship in 2 weeks

3. Measure behavior, not opinions
→ Track actual usage
→ Identify where people drop off
→ Iterate based on data

Now our AI features have 80%+ adoption rates.

What's your biggest challenge with AI adoption?

#AI #ProductDevelopment #TechLeadership #AIStrategy #Innovation"

EXAMPLE 2 (Framework - 12K impressions):
"Here's my 3-step framework for evaluating any AI tool:

Most teams waste months testing tools that don't fit their needs.

Use this filter:

Step 1: The "So What?" Test
→ Can it do something you literally cannot do manually?
→ Or does it just make an existing task 10x faster?
→ Both are valuable, but know which one you need

Step 2: The Integration Reality Check
→ How many systems must it connect to?
→ Do those integrations exist or need custom build?
→ Add 3 months for every custom integration

Step 3: The Change Management Filter
→ How different is this from current workflow?
→ Who needs to change their behavior?
→ Calculate: (People affected × Behavior change size)

If any score is red, pause. Fix that first.

This saved us from 4 bad vendor decisions last year.

What's your framework for evaluating AI tools?

#AI #TechLeadership #AIStrategy #DigitalTransformation #Innovation"

These examples show:
- Strong hooks that create curiosity
- Short, scannable paragraphs
- Specific, actionable insights
- Clear structure with numbers
- Questions that drive engagement
- Strategic hashtag use
`;
