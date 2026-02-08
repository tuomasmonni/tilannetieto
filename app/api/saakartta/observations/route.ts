/**
 * Sääkartta — Yhdistetty havaintodata (FMI + Digitraffic)
 * ~700 uniikkia havaintopistettä
 */

import { NextResponse } from 'next/server';
import { fetchFmiWeatherData } from '@/lib/data/weather/client';
import { fetchRoadWeatherData } from '@/lib/data/road-weather/client';
import { getOrFetch } from '@/lib/cache/redis';
import type { WeatherMapObservation } from '@/lib/weather-map/types';

export const revalidate = 300;

/**
 * Deduplikoi asemat lähietäisyydellä (0.02° ~ 2km)
 */
function deduplicateStations(stations: WeatherMapObservation[]): WeatherMapObservation[] {
  const result: WeatherMapObservation[] = [];
  const grid = new Map<string, boolean>();
  const gridSize = 0.02; // ~2km

  for (const station of stations) {
    const key = `${Math.round(station.lat / gridSize)}_${Math.round(station.lon / gridSize)}`;
    if (grid.has(key)) continue;
    grid.set(key, true);
    result.push(station);
  }

  return result;
}

export async function GET() {
  try {
    const data = await getOrFetch(
      'saakartta:observations',
      async () => {
        const [fmiData, roadData] = await Promise.all([
          fetchFmiWeatherData().catch(() => []),
          fetchRoadWeatherData().catch(() => []),
        ]);

        // Convert FMI observations
        const fmiStations: WeatherMapObservation[] = fmiData.map((obs) => ({
          id: `fmi_${obs.stationId}`,
          lat: obs.lat,
          lon: obs.lon,
          temperature: obs.temperature,
          windSpeed: obs.windSpeed,
          windDirection: obs.windDirection,
          humidity: obs.humidity,
          precipitation: obs.precipitation,
          roadTemperature: null,
          visibility: null,
          stationName: obs.stationName,
          source: 'fmi' as const,
          timestamp: obs.timestamp,
        }));

        // Convert Digitraffic road weather
        const roadStations: WeatherMapObservation[] = roadData.map((obs) => ({
          id: `dt_${obs.stationId}`,
          lat: obs.lat,
          lon: obs.lon,
          temperature: obs.airTemperature,
          windSpeed: obs.windSpeed,
          windDirection: null, // Digitraffic doesn't provide direction
          humidity: obs.humidity,
          precipitation: null,
          roadTemperature: obs.roadTemperature,
          visibility: obs.visibility,
          stationName: obs.name,
          source: 'digitraffic' as const,
          timestamp: obs.timestamp,
        }));

        // FMI first (higher quality), then Digitraffic
        const all = [...fmiStations, ...roadStations];
        return deduplicateStations(all);
      },
      240 // 4min TTL
    );

    return NextResponse.json(
      { observations: data, timestamp: new Date().toISOString() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=240, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Saakartta observations error:', error);
    return NextResponse.json(
      { observations: [], timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }
}
