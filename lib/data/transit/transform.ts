/**
 * HSL joukkoliikennedata → EventFeatureCollection muunnos
 */

import type { HslVehiclePosition } from './client';
import type { EventFeatureCollection, EventFeature } from '@/lib/types';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bus: 'Bussi',
  tram: 'Ratikka',
  metro: 'Metro',
  train: 'Lähijuna',
};

function formatDescription(vehicle: HslVehiclePosition): string {
  const parts: string[] = [];
  parts.push(`Tyyppi: ${VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}`);
  parts.push(`Reitti: ${vehicle.routeShortName}`);
  if (vehicle.speed !== null) parts.push(`Nopeus: ${Math.round(vehicle.speed * 3.6)} km/h`);
  return parts.join('\n');
}

export function transformTransitToEventFeatures(vehicles: HslVehiclePosition[]): EventFeatureCollection {
  const features: EventFeature[] = vehicles
    .filter(v => v.lat && v.lon)
    .map((vehicle) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [vehicle.lon, vehicle.lat] as [number, number],
      },
      properties: {
        id: `hsl-${vehicle.id}`,
        type: 'transit' as const,
        category: 'transit' as const,
        title: `${VEHICLE_TYPE_LABELS[vehicle.vehicleType] || 'Ajoneuvo'} ${vehicle.routeShortName}`,
        description: formatDescription(vehicle),
        locationName: `Reitti ${vehicle.routeShortName}`,
        timestamp: vehicle.timestamp,
        severity: 'low' as const,
        source: 'HSL / Digitransit',
        metadata: JSON.stringify({
          vehicleType: vehicle.vehicleType,
          routeShortName: vehicle.routeShortName,
          speed: vehicle.speed,
          heading: vehicle.heading,
        }),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
