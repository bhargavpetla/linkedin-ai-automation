import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { title, keyPoints, theme, topic, context } = await request.json();
    if ((!title || !keyPoints || !Array.isArray(keyPoints)) && !topic && !context) {
      return NextResponse.json({ error: 'Provide (title + keyPoints[]) or topic/context' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // New @google/genai SDK
    const genAI = new GoogleGenAI({ apiKey: geminiKey });

    const tp = (theme === 'light') ? 'light' : 'nano-banana';

    const sys = `System Instruction: The "Nano Banana" Infographic Architect\nRole: You are an expert Technical Information Architect specializing in "NotebookLM" aesthetic visualization. Transform tech topics into high-fidelity, 4K images using minimal text and maximum visual logic.\n\n1) Strategic Analysis:\n- Infer the most accurate visual depiction from the provided topic/context ONLY. Do not fabricate or drift.\n- Prefer mechanism/flow diagrams over KPI dashboards. Do NOT render generic KPI cards unless explicit, relevant metrics are provided.\n- For algorithm topics (e.g., Recursive Language Models vs Standard RAG): use a comparison flow with a faded "Standard" left and a vibrant "Recursive/Improved" right, with a clear recursive loop and a clean agent sandbox node.\n\n2) 2025 Meta Style:\n- Layout: Minimalist, generous padding, perfect alignment.\n- Aesthetic: White #FFFFFF or soft grey #F8F9FA background.\n- UI: Rounded cards with soft shadows (MD3).\n- Palette: Primary #0066FF or #00BCD4; accents indigo/slate.\n- Typography: Bold sans headline; crisp labels.\n\n3) Composition (4:5):\n- One compelling visual metaphor best representing the topic.\n- Comparison left/right only if relevant to the topic.\n- Bottom: up to three small pills ONLY if metrics are explicitly provided and directly relevant.\n- Watermark: bottom-center 'Bhargav' in neutral grey.\n\n4) Constraints:\n- Max 20 words total across the image.\n- Prioritize whitespace; no clutter.\n- Aspect ratio 4:5 (e.g., 1200x1500).`;

    // Build Reddit Nano Banana style prompt from provided content
    const src = (context || topic || title || '').toString();
    const text = src.replace(/\r/g, '');
    const firstLine = text.split('\n').find((l) => l.trim().length > 0) || (title ? String(title) : '');
    const headline = firstLine.replace(/[\"']/g, '').slice(0, 100);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const stepRx = /^(?:\d+\.|[-•])\s*(.+)$/;
    const steps: string[] = [];
    for (const l of lines) {
      const m = l.match(stepRx);
      if (m && m[1]) steps.push(m[1].trim());
      if (steps.length >= 6) break;
    }
    const nums = Array.from(text.matchAll(/\b(\d{1,3}(?:,\d{3})*|\d+)(?:%|\s*(?:ms|s|m|h|K|M|B))?\b/g)).map(m => m[0]).slice(0, 6);
    const hasYear = /\b(19\d{2}|20\d{2})\b/.test(text);
    const hasPercent = /\b\d+%\b/.test(text);
    let template: 'educational_steps' | 'kpi_dashboard' | 'timeline' | 'single_stat' | 'comparison' = 'educational_steps';
    if (/\bRLM|Recursive Language Model|RAG\b/i.test(text)) template = 'comparison';
    else if (hasYear && !steps.length) template = 'timeline';
    else if (nums.length >= 3 && !steps.length) template = 'kpi_dashboard';
    else if (hasPercent && nums.length <= 2 && !steps.length) template = 'single_stat';

    let imgPrompt = '';
    if (template === 'kpi_dashboard') {
      const m1 = nums[0] || '67%';
      const m2 = nums[1] || '1,247';
      const m3 = nums[2] || '2.4M';
      imgPrompt = `Modern minimalist dashboard infographic: "${headline}", 4 large metric cards showing "Metric 1: ${m3}", "Metric 2: ${m2}", "Metric 3: ${m1}", clean grid layout, bold numbers with trend arrows (up/down), watermark "by Bhargav" in bottom right corner, soft gradient background (#0066FF→#FFFFFF), perfect readable text at 4K, vertical 4:5 aspect`;
    } else if (template === 'timeline') {
      imgPrompt = `Horizontal timeline infographic: "${headline}", 6 milestone points with years and short labels, left-to-right progression with connecting line, watermark "by Bhargav" in bottom right corner, soft gradient background (#F8F9FA→#FFFFFF), perfect readable text at 4K, vertical 4:5 aspect`;
    } else if (template === 'single_stat') {
      const big = nums[0] || '73%';
      imgPrompt = `Single statistic hero infographic: "${headline}", massive bold number "${big}" as centerpiece, 3 supporting points below, watermark "by Bhargav" in bottom right corner, ultra-clean layout, perfect readable text at 4K, vertical 4:5 aspect`;
    } else if (template === 'comparison') {
      imgPrompt = `NotebookLM-style comparison infographic: "${headline}", left faded "Standard" process vs right vibrant "Recursive/Improved" with a clear recursive loop and an AI agent sandbox node, minimal labels (<=20 words total), watermark "by Bhargav" bottom right, white background, vertical 4:5 aspect`;
    } else {
      const list = (steps.length ? steps : (Array.isArray(keyPoints) ? keyPoints.slice(0, 6) : [])).map((s, i) => `"Step ${i + 1}: ${s.toString().slice(0, 60)}"`).join(', ');
      const n = steps.length || (Array.isArray(keyPoints) ? Math.min(keyPoints.length, 6) : 3);
      imgPrompt = `Vertical Pinterest-style infographic: "${headline}", ${n} illustrated steps with simple diagrams showing ${list}, numbered sequence with icons, friendly illustrations, soft gradient background (#0066FF→#FFFFFF), perfect readable text at 4K, educational tone, watermark "by Bhargav" in bottom right corner, vertical 4:5 aspect`;
    }

    const prompt = `${sys}\n${imgPrompt}`;

    // New @google/genai SDK API
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt
    });

    // Check for image in response
    let imageBase64: string | undefined;
    let mimeType = 'image/png';

    // Method 1: Check candidates for inline data
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if ('inlineData' in part && part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image generation failed - no image data in response' }, { status: 500 });
    }

    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    return NextResponse.json({ success: true, imageDataUrl: dataUrl });
  } catch (err: any) {
    console.error('Gemini image generation error:', err);
    return NextResponse.json({ error: 'Failed to generate image', message: err.message }, { status: 500 });
  }
}
