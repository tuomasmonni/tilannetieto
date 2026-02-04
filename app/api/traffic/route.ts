import { NextResponse } from 'next/server';
import { fetchAllTrafficMessages } from '@/lib/data/traffic/client';
import { transformAllTrafficEvents } from '@/lib/data/traffic/transform';
import { updateHistory } from '@/lib/data/traffic/history-postgres';
import { getCached, setCached } from '@/lib/cache/redis';
import type { EventFeatureCollection } from '@/lib/types';

/**
 * GET /api/traffic
 *
 * Palauttaa Fintraffic liikenneilmoitukset GeoJSON-muodossa
 * ja tallentaa historian
 */
export async function GET() {
  try {
    // 1. Yritä hakea cachesta (60 sekunnin TTL)
    const cached = await getCached<EventFeatureCollection>('traffic:all');
    if (cached) {
      console.log('📦 Traffic cache hit');
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      });
    }

    console.log('🔄 Traffic cache miss, fetching from API...');
    let data;
    try {
      data = await fetchAllTrafficMessages();
    } catch (fetchErr) {
      console.error('❌ Failed to fetch from Digitraffic API:', fetchErr);
      // Fallback: palauta tyhjä GeoJSON jos API failaa
      return NextResponse.json({
        type: 'FeatureCollection',
        features: [],
      }, {
        headers: {
          'Cache-Control': 'public, max-age=30',
          'X-Cache': 'ERROR',
        },
      });
    }

    // Muunna normalisoiduiksi tapahtumiksi
    const events = transformAllTrafficEvents(data.features);

    // Tallenna historiaan (asynkronisesti, ei odoteta)
    // TÄRKEÄ: Ei odoteta, jotta vaikka tämä failaa, data silti palautuu
    updateHistory(events).catch(err => {
      console.error('⚠️  History update failed (non-blocking):', err);
    });

    // Muunna GeoJSON FeatureCollectioniksi
    const geojson: EventFeatureCollection = {
      type: 'FeatureCollection',
      features: events.map(event => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: event.location.coordinates,
        },
        properties: {
          id: event.id,
          type: event.type,
          category: event.category,
          title: event.title,
          description: event.description,
          locationName: event.location.name,
          municipality: event.location.municipality,
          road: event.location.road,
          timestamp: event.timestamp.toISOString(),
          endTime: event.endTime?.toISOString(),
          severity: event.severity,
          source: event.source,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        },
      })),
    };

    // 2. Tallenna cacheen (60 sekunnin TTL) - fail-safe
    setCached('traffic:all', geojson, 60).catch(err => {
      console.error('⚠️  Cache save failed (non-blocking):', err);
    });

    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic data', details: String(error) },
      { status: 500 }
    );
  }
}
