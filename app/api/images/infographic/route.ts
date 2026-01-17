import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

function buildSvg(title: string, keyPoints: string[], theme: 'nano-banana' | 'light' = 'nano-banana') {
  const palette = { bg: '#FFFFFF', acc: '#0066FF', text: '#111111', sub: '#666666', soft: '#F8F9FA' };

  const width = 1200;
  const height = 1500; // 4:5 for LinkedIn
  const padding = 56;
  const safeTitle = title.replace(/[<>]/g, '').slice(0, 60);
  const metrics = keyPoints.map((p) => p.replace(/[<>]/g, '')).slice(0, 3);
  const hasMetrics = metrics.some(m => !!m && m.trim().length > 0);

  // Headline (top)
  const headlineY = padding + 16;

  // Center comparison flow
  const centerY = 520;
  const colW = (width - padding * 2 - 40) / 2;
  const colH = 420;

  // Bottom metrics pills
  const pillY = height - 260;
  const pillW = Math.floor((width - padding * 2 - 40) / 3);
  const pillH = 80;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${palette.bg}"/>

  <!-- Headline -->
  <text x="${padding}" y="${headlineY}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="60" fill="#0A2540">${safeTitle}</text>

  <!-- Center Comparison Flow -->
  <g>
    <rect x="${padding}" y="${centerY}" rx="24" width="${colW}" height="${colH}" fill="${palette.soft}" stroke="#E5E7EB" />
    <text x="${padding + 24}" y="${centerY + 48}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="28" fill="#9CA3AF">Standard</text>
    <text x="${padding + 24}" y="${centerY + 98}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" fill="#6B7280">Linear, context-losing flow</text>

    <rect x="${padding + colW + 40}" y="${centerY}" rx="24" width="${colW}" height="${colH}" fill="#EFF6FF" stroke="#BFDBFE" />
    <text x="${padding + colW + 64}" y="${centerY + 48}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="28" fill="#0A66C2">Improved</text>
    <text x="${padding + colW + 64}" y="${centerY + 98}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" fill="#1F2937">Agent sandbox, recursive steps</text>

    <!-- Flow Arrow -->
    <path d="M ${padding + colW + 12} ${centerY + colH/2} H ${padding + colW + 28}" stroke="#0A66C2" stroke-width="4" />
    <polygon points="${padding + colW + 28},${centerY + colH/2} ${padding + colW + 18},${centerY + colH/2 - 8} ${padding + colW + 18},${centerY + colH/2 + 8}" fill="#0A66C2" />
  </g>

  ${hasMetrics ? `
  <!-- Bottom Metrics Pills -->
  <g>
    <rect x="${padding}" y="${pillY}" rx="40" width="${pillW}" height="${pillH}" fill="#EEF2FF" stroke="#E0E7FF" />
    <text x="${padding + 24}" y="${pillY + 50}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="24" fill="#111827">${metrics[0] || ''}</text>
    <rect x="${padding + pillW + 20}" y="${pillY}" rx="40" width="${pillW}" height="${pillH}" fill="#ECFEFF" stroke="#CFFAFE" />
    <text x="${padding + pillW + 44}" y="${pillY + 50}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="24" fill="#0F172A">${metrics[1] || ''}</text>
    <rect x="${padding + pillW*2 + 40}" y="${pillY}" rx="40" width="${pillW}" height="${pillH}" fill="#F0FDF4" stroke="#DCFCE7" />
    <text x="${padding + pillW*2 + 64}" y="${pillY + 50}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="24" fill="#065F46">${metrics[2] || ''}</text>
  </g>
  ` : ''}

  <!-- Watermark -->
  <text x="${width/2}" y="${height - 24}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="16" fill="#9CA3AF">Bhargav</text>
</svg>`;

  return svg;
}

export async function POST(request: NextRequest) {
  try {
    const { title, keyPoints, theme } = await request.json();
    if (!title || !keyPoints || !Array.isArray(keyPoints)) {
      return NextResponse.json({ error: 'title and keyPoints[] are required' }, { status: 400 });
    }

    const svg = buildSvg(String(title), keyPoints.map(String), theme === 'light' ? 'light' : 'nano-banana');
    const png = await sharp(Buffer.from(svg)).png({ quality: 85 }).toBuffer();

    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
    return NextResponse.json({ success: true, imageDataUrl: dataUrl });
  } catch (err: any) {
    console.error('Infographic generation error:', err);
    return NextResponse.json({ error: 'Failed to generate infographic', message: err.message }, { status: 500 });
  }
}
