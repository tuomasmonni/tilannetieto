/**
 * Tilannekuva.online - Icebreaker Routes API
 * Digitraffic winter navigation dirways -> GeoJSON
 */

import { NextResponse } from 'next/server';
import { fetchIcebreakerRoutes } from '@/lib/data/ice/client';
import { getOrFetch } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const geojson = await getOrFetch(
      'ice:icebreakers',
      async () => {
        return await fetchIcebreakerRoutes();
      },
      600 // 10min TTL
    );

    console.log(`Icebreaker API: ${geojson.features?.length ?? 0} routes`);

    return NextResponse.json(geojson, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Icebreaker API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    );
  }
}
