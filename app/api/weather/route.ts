/**
 * Tilannekuva.online - Weather API Route
 * FMI sääasemat → EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchFmiWeatherData } from '@/lib/data/weather/client';
import { transformFmiToEventFeatures } from '@/lib/data/weather/transform';

export const revalidate = 300; // ISR: 5 min cache

export async function GET() {
  try {
    const observations = await fetchFmiWeatherData();
    const featureCollection = transformFmiToEventFeatures(observations);

    console.log(`Weather API: ${featureCollection.features.length} stations`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    );
  }
}
