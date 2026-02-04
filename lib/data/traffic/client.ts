/**
 * Fintraffic Digitraffic API Client
 *
 * Dokumentaatio: https://www.digitraffic.fi/tieliikenne/
 */

import { API_ENDPOINTS } from '@/lib/constants';
import type { FintrafficMessageResponse, TrainLocation } from '@/lib/types';

/**
 * Hae liikenneilmoitukset (onnettomuudet, häiriöt)
 */
export async function fetchTrafficMessages(
  situationType?: 'TRAFFIC_ANNOUNCEMENT' | 'ROAD_WORK' | 'WEIGHT_RESTRICTION' | 'EXEMPTED_TRANSPORT'
): Promise<FintrafficMessageResponse> {
  const url = new URL(API_ENDPOINTS.trafficMessages);

  if (situationType) {
    url.searchParams.set('situationType', situationType);
  }

  // Hae vain aktiiviset (ei menneet)
  url.searchParams.set('inactiveHours', '0');

  const response = await fetch(url.toString(), {
    headers: {
      'Accept-Encoding': 'gzip',
      'Accept': 'application/json',
    },
    next: { revalidate: 60 }, // Cache 60s
  });

  if (!response.ok) {
    throw new Error(`Fintraffic API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Hae kaikki liikenneilmoitukset (kaikki tyypit)
 */
export async function fetchAllTrafficMessages(): Promise<FintrafficMessageResponse> {
  const url = new URL(API_ENDPOINTS.trafficMessages);

  // KRIITTINEN: Hae vain aktiiviset tapahtumat (ei päättyneitä)
  url.searchParams.set('inactiveHours', '0');

  const response = await fetch(url.toString(), {
    headers: {
      'Accept-Encoding': 'gzip',
      'Accept': 'application/json',
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Fintraffic API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Hae kaikki tapahtumat hakemalla tyypit erikseen
 * Varmistaa että TRAFFIC_ANNOUNCEMENT ja ROAD_WORK molemmat tulevat
 */
export async function fetchAllTrafficMessagesByType(): Promise<FintrafficMessageResponse> {
  const situationTypes: Array<'TRAFFIC_ANNOUNCEMENT' | 'ROAD_WORK' | 'WEIGHT_RESTRICTION' | 'EXEMPTED_TRANSPORT'> = [
    'TRAFFIC_ANNOUNCEMENT',
    'ROAD_WORK',
    'WEIGHT_RESTRICTION',
    'EXEMPTED_TRANSPORT',
  ];

  // Hae tyypit rinnakkain (parallelointi)
  const promises = situationTypes.map(type =>
    fetchTrafficMessages(type)
  );

  const results = await Promise.all(promises);

  // Yhdistä tulokset, poista duplikaatit situationId:n mukaan
  const allFeatures = results.flatMap(r => r.features);
  const uniqueFeatures = Array.from(
    new Map(allFeatures.map(f => [f.properties.situationId, f])).values()
  );

  return {
    type: 'FeatureCollection',
    dataUpdatedTime: results[0]?.dataUpdatedTime || new Date().toISOString(),
    features: uniqueFeatures,
  };
}

/**
 * Hae junien reaaliaikaiset sijainnit
 */
export async function fetchTrainLocations(): Promise<TrainLocation[]> {
  const response = await fetch(API_ENDPOINTS.trainLocations, {
    headers: {
      'Accept-Encoding': 'gzip',
      'Accept': 'application/json',
    },
    next: { revalidate: 10 }, // Cache 10s
  });

  if (!response.ok) {
    throw new Error(`Rata API error: ${response.status}`);
  }

  return response.json();
}

