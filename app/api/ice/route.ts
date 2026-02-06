/**
 * Tilannekuva.online - Ice API Route
 * SYKE jäänpaksuus -> EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchIceData } from '@/lib/data/ice/client';
import { transformIceToEventFeatures } from '@/lib/data/ice/transform';
import { getOrFetch } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const featureCollection = await getOrFetch(
      'ice:stations',
      async () => {
        const observations = await fetchIceData();
        return transformIceToEventFeatures(observations);
      },
      1800 // 30min TTL
    );

    console.log(`Ice API: ${featureCollection.features?.length ?? 0} stations`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Ice API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    );
  }
}
