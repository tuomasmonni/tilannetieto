import { NextRequest, NextResponse } from 'next/server';
import { fetchUnemploymentMapData } from '@/lib/data/unemployment/api';
import { validateYear } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const year = validateYear(request.nextUrl.searchParams.get('year'), '2024');
  const mode = request.nextUrl.searchParams.get('mode') || 'perCapita';

  try {
    const data = await fetchUnemploymentMapData(year, mode === 'perCapita');

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Unemployment API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], metadata: { error: true } },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }
}
