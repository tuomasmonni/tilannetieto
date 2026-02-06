/**
 * Tilannetieto.fi - Traffic API Route
 * Fintraffic liikenneilmoitukset → EventFeatureCollection
 *
 * NOTE: Redis cache disabled — Upstash REST API response format
 * caused double-serialization. Using Vercel edge cache (max-age=60) instead.
 */

import { NextResponse } from 'next/server';
import { fetchAllTrafficMessages } from '@/lib/data/traffic/client';
import { transformTrafficToEventFeatures } from '@/lib/data/traffic/transform';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawData = await fetchAllTrafficMessages();
    const featureCollection = transformTrafficToEventFeatures(rawData);

    console.log(`Traffic API: ${featureCollection.features?.length ?? 0} events`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=30' },
      }
    );
  }
}
