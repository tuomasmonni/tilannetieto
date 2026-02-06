import { NextRequest, NextResponse } from 'next/server';
import { fetchAssociationsMapData } from '@/lib/data/associations';

export const revalidate = 86400; // 24h - staattinen data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const displayMode = (searchParams.get('displayMode') || 'count') as 'count' | 'perCapita';

  try {
    const data = await fetchAssociationsMapData(displayMode);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Associations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations data' },
      { status: 500 }
    );
  }
}
