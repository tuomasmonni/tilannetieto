/**
 * Fintraffic liikenneilmoitukset
 * Hakee liikennetiedotteet Digitraffic-rajapinnasta
 */

import { API_ENDPOINTS } from '@/lib/constants';
import type { FintrafficMessageResponse } from '@/lib/types';

const SITUATION_TYPES = [
  'TRAFFIC_ANNOUNCEMENT',
  'EXEMPTED_TRANSPORT',
  'WEIGHT_RESTRICTION',
  'ROAD_WORK',
];

export async function fetchAllTrafficMessages(): Promise<FintrafficMessageResponse> {
  const allFeatures: any[] = [];

  for (const situationType of SITUATION_TYPES) {
    try {
      const url = `${API_ENDPOINTS.trafficMessages}?inactiveHours=0&includeAreaGeometry=false&situationType=${situationType}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'tilannekuva.online/1.0',
        },
      });

      if (!response.ok) continue;

      const data: FintrafficMessageResponse = await response.json();
      if (data.features) {
        allFeatures.push(...data.features);
      }
    } catch (error) {
      console.error(`Failed to fetch ${situationType}:`, error);
    }
  }

  return {
    type: 'FeatureCollection',
    dataUpdatedTime: new Date().toISOString(),
    features: allFeatures,
  };
}
