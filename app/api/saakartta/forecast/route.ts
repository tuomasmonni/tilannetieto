/**
 * Sääkartta — Ennustedata (Open-Meteo)
 * ~64 gridpistettä koko Suomen alueella, 48h eteenpäin
 */

import { NextResponse } from 'next/server';
import { getOrFetch } from '@/lib/cache/redis';
import { FORECAST_GRID, OPEN_METEO_URL } from '@/lib/weather-map/constants';
import type { ForecastPoint, ForecastHour } from '@/lib/weather-map/types';

export const revalidate = 1800; // 30min ISR

export async function GET() {
  try {
    const data = await getOrFetch(
      'saakartta:forecast',
      async () => {
        // Open-Meteo supports comma-separated coordinates
        const latitudes = FORECAST_GRID.map((p) => p.lat).join(',');
        const longitudes = FORECAST_GRID.map((p) => p.lon).join(',');

        const params = new URLSearchParams({
          latitude: latitudes,
          longitude: longitudes,
          hourly: 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code',
          forecast_days: '2',
          timezone: 'Europe/Helsinki',
        });

        const response = await fetch(`${OPEN_METEO_URL}?${params}`, {
          headers: { 'User-Agent': 'tilannetieto.fi/1.0' },
        });

        if (!response.ok) {
          throw new Error(`Open-Meteo API error: ${response.status}`);
        }

        const json = await response.json();

        // Open-Meteo returns array of results for multiple coordinates
        const results = Array.isArray(json) ? json : [json];
        const points: ForecastPoint[] = [];
        let hours: string[] = [];

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (!result.hourly) continue;

          const grid = FORECAST_GRID[i];
          if (!grid) continue;

          // Extract hours from first valid result
          if (hours.length === 0 && result.hourly.time) {
            hours = result.hourly.time;
          }

          const forecastHours: ForecastHour[] = [];
          const timeArray = result.hourly.time || [];

          for (let j = 0; j < timeArray.length; j++) {
            forecastHours.push({
              time: timeArray[j],
              temperature: result.hourly.temperature_2m?.[j] ?? 0,
              windSpeed: result.hourly.wind_speed_10m?.[j] ?? 0,
              windDirection: result.hourly.wind_direction_10m?.[j] ?? 0,
              precipitation: result.hourly.precipitation?.[j] ?? 0,
              weatherCode: result.hourly.weather_code?.[j] ?? 0,
            });
          }

          points.push({
            lat: grid.lat,
            lon: grid.lon,
            hours: forecastHours,
          });
        }

        return { points, hours, generatedAt: new Date().toISOString() };
      },
      1800 // 30min TTL
    );

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Saakartta forecast error:', error);
    return NextResponse.json(
      { points: [], hours: [], generatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
