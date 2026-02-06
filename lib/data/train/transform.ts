/**
 * Junadata -> EventFeatureCollection muunnos
 */

import type { TrainWithLocation } from './client';
import type { EventFeatureCollection, EventFeature } from '@/lib/types';

type AppTrainType = 'IC' | 'S' | 'Pendolino' | 'commuter' | 'cargo';

function getAppTrainType(train: TrainWithLocation): AppTrainType {
  if (train.trainCategory === 'Cargo') return 'cargo';
  if (train.trainCategory === 'Commuter') return 'commuter';
  if (train.trainType === 'IC') return 'IC';
  if (train.trainType === 'S') return 'S';
  if (train.trainType === 'PYO') return 'Pendolino';
  // Oletuksena IC muille kaukojunille
  return 'IC';
}

function getDisplayName(train: TrainWithLocation): string {
  if (train.trainCategory === 'Commuter' && train.commuterLineID) {
    return `${train.commuterLineID} ${train.trainNumber}`;
  }
  if (train.trainType === 'PYO') {
    return `Pendolino ${train.trainNumber}`;
  }
  return `${train.trainType} ${train.trainNumber}`;
}

function formatDescription(train: TrainWithLocation): string {
  const parts: string[] = [];
  const appType = getAppTrainType(train);
  const typeLabels: Record<AppTrainType, string> = {
    IC: 'InterCity',
    S: 'S-juna',
    Pendolino: 'Pendolino',
    commuter: 'Lähijuna',
    cargo: 'Tavarajuna',
  };
  parts.push(`Tyyppi: ${typeLabels[appType]}`);
  parts.push(`Nopeus: ${Math.round(train.speed)} km/h`);
  if (train.lateMinutes > 0) {
    parts.push(`Viive: +${train.lateMinutes} min`);
  } else if (train.lateMinutes < 0) {
    parts.push(`Etuajassa: ${train.lateMinutes} min`);
  }
  return parts.join('\n');
}

function getSeverity(lateMinutes: number): 'low' | 'medium' | 'high' {
  if (lateMinutes > 15) return 'high';
  if (lateMinutes > 5) return 'medium';
  return 'low';
}

export function transformTrainToEventFeatures(trains: TrainWithLocation[]): EventFeatureCollection {
  const features: EventFeature[] = trains
    .filter(t => t.lat && t.lon)
    .map((train) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [train.lon, train.lat] as [number, number],
      },
      properties: {
        id: `train-${train.trainNumber}-${train.departureDate}`,
        type: 'train' as const,
        category: 'train' as const,
        title: getDisplayName(train),
        description: formatDescription(train),
        locationName: `Juna ${getDisplayName(train)}`,
        timestamp: train.timestamp,
        severity: getSeverity(train.lateMinutes),
        source: 'Fintraffic / rata.digitraffic.fi',
        metadata: JSON.stringify({
          trainType: getAppTrainType(train),
          trainNumber: train.trainNumber,
          speed: train.speed,
          lateMinutes: train.lateMinutes,
          trainCategory: train.trainCategory,
          commuterLineID: train.commuterLineID,
        }),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
