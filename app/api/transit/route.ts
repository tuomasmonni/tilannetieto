/**
 * Tilannekuva.online - Transit API Route
 * HSL joukkoliikenne → EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchHslVehiclePositions } from '@/lib/data/transit/client';
import { transformTransitToEventFeatures } from '@/lib/data/transit/transform';

export const revalidate = 10; // ISR: 10 sec (real-time data)

export async function GET() {
  try {
    const vehicles = await fetchHslVehiclePositions();
    const featureCollection = transformTransitToEventFeatures(vehicles);

    console.log(`Transit API: ${featureCollection.features.length} vehicles`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Transit API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=5' },
      }
    );
  }
}
