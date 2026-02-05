/**
 * Digitraffic tiesäädata → EventFeatureCollection muunnos
 */

import type { RoadWeatherData } from './client';
import type { EventFeatureCollection, EventFeature } from '@/lib/types';

function getSeverity(data: RoadWeatherData): 'low' | 'medium' | 'high' {
  // Korkea: jää, erittäin huono näkyvyys, erittäin kylmä tienpinta
  if (data.roadTemperature !== null && data.roadTemperature < -10) return 'high';
  if (data.visibility !== null && data.visibility < 200) return 'high';
  if (data.roadCondition === 'ICE' || data.roadCondition === 'FROST') return 'high';

  // Keskitaso: kohtalainen keli
  if (data.roadTemperature !== null && data.roadTemperature < 0) return 'medium';
  if (data.visibility !== null && data.visibility < 500) return 'medium';
  if (data.roadCondition === 'SNOW' || data.roadCondition === 'WET') return 'medium';

  return 'low';
}

function formatDescription(data: RoadWeatherData): string {
  const parts: string[] = [];
  if (data.airTemperature !== null) parts.push(`Ilman lämpötila: ${data.airTemperature.toFixed(1)} °C`);
  if (data.roadTemperature !== null) parts.push(`Tienpinnan lämpötila: ${data.roadTemperature.toFixed(1)} °C`);
  if (data.windSpeed !== null) parts.push(`Tuuli: ${data.windSpeed.toFixed(1)} m/s`);
  if (data.humidity !== null) parts.push(`Kosteus: ${data.humidity.toFixed(0)} %`);
  if (data.visibility !== null) parts.push(`Näkyvyys: ${data.visibility >= 1000 ? `${(data.visibility / 1000).toFixed(1)} km` : `${Math.round(data.visibility)} m`}`);
  if (data.roadCondition) parts.push(`Tienpinta: ${data.roadCondition}`);
  if (data.precipitationType && data.precipitationType !== 'DRY') parts.push(`Sade: ${data.precipitationType}`);
  return parts.join('\n');
}

export function transformRoadWeatherToEventFeatures(data: RoadWeatherData[]): EventFeatureCollection {
  const features: EventFeature[] = data
    .filter(d => d.lat && d.lon)
    .map((station) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [station.lon, station.lat] as [number, number],
      },
      properties: {
        id: `rw-${station.stationId}`,
        type: 'road_weather' as const,
        category: 'road_weather' as const,
        title: station.name,
        description: formatDescription(station),
        locationName: station.name,
        municipality: station.municipality || undefined,
        road: station.roadNumber ? String(station.roadNumber) : undefined,
        timestamp: station.timestamp,
        severity: getSeverity(station),
        source: 'Digitraffic / Fintraffic',
        metadata: JSON.stringify({
          airTemperature: station.airTemperature,
          roadTemperature: station.roadTemperature,
          humidity: station.humidity,
          windSpeed: station.windSpeed,
          visibility: station.visibility,
          precipitationType: station.precipitationType,
          roadCondition: station.roadCondition,
        }),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
