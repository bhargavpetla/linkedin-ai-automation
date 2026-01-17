import { NextRequest, NextResponse } from 'next/server';
import { db_helpers } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const logs = await db_helpers.getLogs(limit);
    
    return NextResponse.json({
      success: true,
      logs
    });
  } catch (error: any) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
