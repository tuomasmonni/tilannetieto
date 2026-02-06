/**
 * Tilannekuva.online - Train API Route
 * Junaseuranta -> EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchTrainData } from '@/lib/data/train/client';
import { transformTrainToEventFeatures } from '@/lib/data/train/transform';
import { getOrFetch } from '@/lib/cache/redis';

export const revalidate = 10; // ISR: 10 sec (real-time data)

export async function GET() {
  try {
    const featureCollection = await getOrFetch(
      'train:locations',
      async () => {
        const trains = await fetchTrainData();
        return transformTrainToEventFeatures(trains);
      },
      8 // 8s TTL (polling 10s)
    );

    console.log(`Train API: ${featureCollection.features.length} trains`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Train API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=5' },
      }
    );
  }
}
