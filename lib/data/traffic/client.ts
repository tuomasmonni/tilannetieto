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
  situationType?: 'TRAFFIC_ANNOUNCEMENT' | 'ROAD_WORK' | 'WEIGHT_RESTRICTION'
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
  const response = await fetch(API_ENDPOINTS.trafficMessages, {
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

