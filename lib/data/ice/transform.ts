/**
 * SYKE jäänpaksuusdata -> EventFeatureCollection muunnos
 */

import type { IceObservation } from './types';
import type { EventFeatureCollection, EventFeature } from '@/lib/types';

function getSeverity(thickness: number): 'low' | 'medium' | 'high' {
  if (thickness >= 50) return 'high';
  if (thickness >= 20) return 'medium';
  return 'low';
}

export function transformIceToEventFeatures(observations: IceObservation[]): EventFeatureCollection {
  const features: EventFeature[] = observations
    .filter(obs => obs.lat && obs.lon && obs.iceThickness >= 0)
    .map((obs) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [obs.lon, obs.lat] as [number, number],
      },
      properties: {
        id: `ice-${obs.stationId}`,
        type: 'ice' as const,
        category: 'ice' as const,
        title: obs.stationName,
        description: `Jään paksuus: ${obs.iceThickness} cm${obs.lakeName ? ` — ${obs.lakeName}` : ''}`,
        locationName: obs.municipality || obs.stationName,
        timestamp: obs.timestamp,
        severity: getSeverity(obs.iceThickness),
        source: 'SYKE',
        metadata: JSON.stringify({
          iceThickness: obs.iceThickness,
          municipality: obs.municipality,
          lakeName: obs.lakeName,
        }),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
