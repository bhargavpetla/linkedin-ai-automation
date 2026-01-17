import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

function wrapText(text: string, maxChars = 64): string[] {
  const words = text.replace(/\r/g, '').split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = (line ? line + ' ' : '') + w;
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

function buildLinkedInSvg(postContent: string, author = 'Your Name • 1st', titleHint?: string) {
  const width = 1200;
  const height = 1350; // 4:5, good for LinkedIn
  const pad = 48;
  const contentX = pad;
  const contentY = pad + 120;
  const lineH = 36;

  const sanitized = postContent.replace(/[<>]/g, '');
  const paragraphs = sanitized.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const lines: string[] = [];
  for (const p of paragraphs) {
    const pLines = p.split(/\n/).map(s => s.trim()).filter(Boolean);
    for (const pl of pLines) {
      wrapText(pl, 72).forEach(l => lines.push(l));
    }
    lines.push(''); // paragraph gap
  }
  if (lines[lines.length - 1] === '') lines.pop();

  const maxLines = Math.floor((height - contentY - pad - 60) / lineH);
  const clipped = lines.slice(0, maxLines);

  const content = clipped.map((t, i) => (
    t === ''
      ? `<tspan x="${contentX}" dy="${lineH}" />`
      : `<tspan x="${contentX}" dy="${i === 0 ? 0 : lineH}">${t}</tspan>`
  )).join('');

  const title = titleHint || (paragraphs[0]?.split(/\.|!|\?/)[0] || 'LinkedIn Post').slice(0, 80);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#0A66C2"/>
      <stop offset="100%" stop-color="#004182"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="0" y="0" width="100%" height="96" fill="url(#g)"/>
  <circle cx="${pad + 28}" cy="48" r="24" fill="#E8F3FF" stroke="#0A66C2" />
  <text x="${pad + 64}" y="56" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="28" fill="#FFFFFF">${author}</text>
  <text x="${pad}" y="${pad + 160}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="42" fill="#0A2540">${title}</text>
  <text x="${contentX}" y="${contentY + 80}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="24" fill="#111111">${content}</text>
  <rect x="${width - pad - 220}" y="${height - pad - 60}" width="220" height="60" rx="12" fill="#0A66C2"/>
  <text x="${width - pad - 110}" y="${height - pad - 20}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">linkedin-style</text>
</svg>`;
  return svg;
}

export async function POST(request: NextRequest) {
  try {
    const { postContent, author, titleHint } = await request.json();
    if (!postContent) {
      return NextResponse.json({ error: 'postContent is required' }, { status: 400 });
    }
    const svg = buildLinkedInSvg(String(postContent), author ? String(author) : undefined, titleHint ? String(titleHint) : undefined);
    const png = await sharp(Buffer.from(svg)).png({ quality: 92 }).toBuffer();
    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
    return NextResponse.json({ success: true, imageDataUrl: dataUrl });
  } catch (err: any) {
    console.error('Postcard generation error:', err);
    return NextResponse.json({ error: 'Failed to generate post image', message: err.message }, { status: 500 });
  }
}
