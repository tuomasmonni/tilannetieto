import { NextRequest, NextResponse } from 'next/server';
import { fetchPopulationMapData } from '@/lib/data/population/api';

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year') || '2024';

  try {
    const data = await fetchPopulationMapData(year);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Population API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], metadata: { error: true } },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }
}
