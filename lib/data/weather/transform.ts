/**
 * FMI säädata → EventFeatureCollection muunnos
 */

import type { FmiObservation } from './client';
import type { EventFeatureCollection, EventFeature } from '@/lib/types';

function getSeverityFromTemperature(temp: number | null): 'low' | 'medium' | 'high' {
  if (temp === null) return 'low';
  if (temp < -25 || temp > 35) return 'high';
  if (temp < -15 || temp > 30) return 'medium';
  return 'low';
}

function formatDescription(obs: FmiObservation): string {
  const parts: string[] = [];
  if (obs.temperature !== null) parts.push(`Lämpötila: ${obs.temperature.toFixed(1)} °C`);
  if (obs.windSpeed !== null) parts.push(`Tuuli: ${obs.windSpeed.toFixed(1)} m/s`);
  if (obs.precipitation !== null) parts.push(`Sade (1h): ${obs.precipitation.toFixed(1)} mm`);
  if (obs.humidity !== null) parts.push(`Kosteus: ${obs.humidity.toFixed(0)} %`);
  return parts.join('\n');
}

export function transformFmiToEventFeatures(observations: FmiObservation[]): EventFeatureCollection {
  const features: EventFeature[] = observations
    .filter(obs => obs.lat && obs.lon)
    .map((obs) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [obs.lon, obs.lat] as [number, number],
      },
      properties: {
        id: `fmi-${obs.stationId}`,
        type: 'weather' as const,
        category: 'weather' as const,
        title: obs.stationName,
        description: formatDescription(obs),
        locationName: obs.stationName,
        timestamp: obs.timestamp,
        severity: getSeverityFromTemperature(obs.temperature),
        source: 'Ilmatieteen laitos',
        metadata: JSON.stringify({
          temperature: obs.temperature,
          windSpeed: obs.windSpeed,
          windDirection: obs.windDirection,
          precipitation: obs.precipitation,
          humidity: obs.humidity,
        }),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
