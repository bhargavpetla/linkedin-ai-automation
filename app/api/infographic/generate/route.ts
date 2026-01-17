import { NextRequest, NextResponse } from 'next/server';
import { imageService } from '@/lib/services/ImageService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      postContent,
      topic,
      templateType,
      colorPalette,
      includeWebResearch = true
    } = body;

    if (!postContent) {
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      );
    }

    console.log('Generating infographic prompt for:', topic || 'auto-detected topic');

    // Generate comprehensive infographic with web research
    const result = await imageService.getInfographicImagesForPost(
      postContent,
      topic
    );

    return NextResponse.json({
      success: true,
      infographic: {
        prompt: result.infographicPrompt,
        templateUsed: result.templateUsed,
        extractedData: result.extractedData,
        webResearch: result.webResearch,
        searchQuery: result.searchQuery
      },
      photos: result.photos.map(photo => ({
        id: photo.id,
        url: photo.src.large,
        photographer: photo.photographer,
        thumbnailUrl: photo.src.medium
      })),
      cost: result.cost,
      meta: {
        topic: topic || 'Auto-detected from content',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error generating infographic:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate infographic' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available templates
export async function GET() {
  try {
    const { INFOGRAPHIC_TEMPLATES, INFOGRAPHIC_COLOR_PALETTES } = await import('@/lib/prompts/linkedin-templates');

    return NextResponse.json({
      templates: Object.keys(INFOGRAPHIC_TEMPLATES).map(key => ({
        id: key,
        name: INFOGRAPHIC_TEMPLATES[key as keyof typeof INFOGRAPHIC_TEMPLATES].name,
        description: INFOGRAPHIC_TEMPLATES[key as keyof typeof INFOGRAPHIC_TEMPLATES].description,
        bestFor: INFOGRAPHIC_TEMPLATES[key as keyof typeof INFOGRAPHIC_TEMPLATES].bestFor
      })),
      colorPalettes: Object.keys(INFOGRAPHIC_COLOR_PALETTES).map(key => ({
        id: key,
        colors: INFOGRAPHIC_COLOR_PALETTES[key as keyof typeof INFOGRAPHIC_COLOR_PALETTES],
        bestFor: INFOGRAPHIC_COLOR_PALETTES[key as keyof typeof INFOGRAPHIC_COLOR_PALETTES].bestFor
      }))
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
