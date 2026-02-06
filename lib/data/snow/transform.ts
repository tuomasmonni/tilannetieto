/**
 * FMI lumensyvyysdata -> EventFeatureCollection muunnos
 */

import type { SnowObservation } from '@/lib/types';
import type { EventFeatureCollection, EventFeature } from '@/lib/types';

function getSeverity(snowDepth: number | null): 'low' | 'medium' | 'high' {
  if (snowDepth === null) return 'low';
  if (snowDepth > 80) return 'high';
  if (snowDepth > 30) return 'medium';
  return 'low';
}

export function transformSnowToEventFeatures(observations: SnowObservation[]): EventFeatureCollection {
  const features: EventFeature[] = observations
    .filter(obs => obs.lat && obs.lon && obs.snowDepth !== null)
    .map((obs) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [obs.lon, obs.lat] as [number, number],
      },
      properties: {
        id: `snow-${obs.stationId}`,
        type: 'snow' as const,
        category: 'snow' as const,
        title: obs.stationName,
        description: `Lumensyvyys: ${obs.snowDepth} cm`,
        locationName: obs.stationName,
        timestamp: obs.timestamp,
        severity: getSeverity(obs.snowDepth),
        source: 'Ilmatieteen laitos',
        metadata: JSON.stringify({
          snowDepth: obs.snowDepth,
        }),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
