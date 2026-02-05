/**
 * Tilannekuva.online - Road Weather API Route
 * Digitraffic tiesääasemat → EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchRoadWeatherData } from '@/lib/data/road-weather/client';
import { transformRoadWeatherToEventFeatures } from '@/lib/data/road-weather/transform';

export const revalidate = 300; // ISR: 5 min cache

export async function GET() {
  try {
    const stationData = await fetchRoadWeatherData();
    const featureCollection = transformRoadWeatherToEventFeatures(stationData);

    console.log(`Road Weather API: ${featureCollection.features.length} stations`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Road Weather API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    );
  }
}
