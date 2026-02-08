import { NextRequest, NextResponse } from 'next/server';
import { fetchIndicatorByMunicipality } from '@/lib/data/sotkanet/client';
import { getOrFetch } from '@/lib/cache/redis';
import { fetchMunicipalityBoundaries } from '@/lib/data/crime/api';
import { validateYear } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function categorizeByQuantile(
  value: number,
  allValues: number[]
): 'low' | 'medium' | 'high' | 'very_high' {
  const sorted = [...allValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q2 = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];

  if (value <= q1) return 'low';
  if (value <= q2) return 'medium';
  if (value <= q3) return 'high';
  return 'very_high';
}

export async function GET(request: NextRequest) {
  const indicator = request.nextUrl.searchParams.get('indicator') || '5641';
  const year = validateYear(request.nextUrl.searchParams.get('year'), '2023');

  try {
    const [boundaries, indicatorData] = await Promise.all([
      getOrFetch(`boundaries:${year}`, () => fetchMunicipalityBoundaries(parseInt(year)), 86400),
      fetchIndicatorByMunicipality(indicator, year),
    ]);

    const allValues = Array.from(indicatorData.values())
      .map((d) => d.value)
      .filter((v) => v > 0 && !isNaN(v));

    const features = [];

    for (const boundary of boundaries.features) {
      const code = boundary.properties.kunta;
      const data = indicatorData.get(code);

      if (!data) continue;

      features.push({
        type: 'Feature',
        geometry: boundary.geometry,
        properties: {
          kunta: code,
          nimi: boundary.properties.nimi,
          value: data.value,
          absValue: data.absValue,
          year: parseInt(year),
          indicator,
          category: categorizeByQuantile(data.value, allValues),
        },
      });
    }

    return NextResponse.json(
      {
        type: 'FeatureCollection',
        features,
        metadata: {
          indicator,
          year: parseInt(year),
          totalMunicipalities: features.length,
          fetchedAt: new Date().toISOString(),
          source: 'THL / Sotkanet',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], metadata: { error: true } },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }
}
