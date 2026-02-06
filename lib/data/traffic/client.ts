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
  const results = await Promise.all(
    SITUATION_TYPES.map(async (situationType) => {
      try {
        const url = `${API_ENDPOINTS.trafficMessages}?inactiveHours=0&includeAreaGeometry=false&situationType=${situationType}`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'Digitraffic-User': 'tilannekuva.online/1.0',
          },
        });

        if (!response.ok) return [];

        const data: FintrafficMessageResponse = await response.json();
        return data.features || [];
      } catch (error) {
        console.error(`Failed to fetch ${situationType}:`, error);
        return [];
      }
    })
  );

  return {
    type: 'FeatureCollection',
    dataUpdatedTime: new Date().toISOString(),
    features: results.flat(),
  };
}
