/**
 * Sääkartta — Tutkakuva-URL:t (FMI WMS)
 * Generoi 24 URL:ä viimeisen 2 tunnin ajalta (5min välein)
 */

import { NextResponse } from 'next/server';
import { getOrFetch } from '@/lib/cache/redis';
import { RADAR_CONFIG } from '@/lib/weather-map/constants';
import type { RadarFrame } from '@/lib/weather-map/types';

export const revalidate = 120; // 2min ISR

function generateRadarFrames(): RadarFrame[] {
  const frames: RadarFrame[] = [];
  const now = new Date();
  const { frameCount, intervalMs, wmsBaseUrl, layer, bounds } = RADAR_CONFIG;

  // Round to nearest 5 minutes
  now.setMinutes(Math.floor(now.getMinutes() / 5) * 5, 0, 0);

  for (let i = frameCount - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs);
    const timeStr = timestamp.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const params = new URLSearchParams({
      service: 'WMS',
      version: '1.3.0',
      request: 'GetMap',
      layers: layer,
      crs: 'EPSG:4326',
      bbox: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
      width: '512',
      height: '512',
      format: 'image/png',
      transparent: 'true',
      time: timeStr,
    });

    frames.push({
      url: `${wmsBaseUrl}?${params}`,
      timestamp: timeStr,
    });
  }

  return frames;
}

export async function GET() {
  try {
    const frames = await getOrFetch(
      'saakartta:radar',
      async () => generateRadarFrames(),
      120 // 2min TTL
    );

    return NextResponse.json(
      { frames },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Saakartta radar error:', error);
    return NextResponse.json({ frames: [] }, { status: 200 });
  }
}
