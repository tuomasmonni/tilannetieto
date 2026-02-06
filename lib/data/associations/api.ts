/**
 * Yhdistykset - Data API
 * Lataa staattinen yhdistysdata ja yhdistää kuntarajoihin
 */

import { getOrFetch } from '@/lib/cache/redis';
import { fetchMunicipalityBoundaries } from '@/lib/data/crime/api';
import type { MunicipalityGeoJSON } from '@/lib/data/crime/api';
import associationsJson from '@/data/static/associations.json';

interface AssociationsStaticData {
  metadata: {
    source: string;
    total: number;
    fetchedAt: string;
  };
  municipalityNames: Record<string, string>;
  associations: Record<string, { total: number }>;
}

const staticData = associationsJson as AssociationsStaticData;

/**
 * Kategorisoi kvantiilin mukaan
 */
function categorizeByQuantile(value: number, allValues: number[]): 'low' | 'medium' | 'high' | 'very_high' {
  const sorted = [...allValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q2 = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];

  if (value <= q1) return 'low';
  if (value <= q2) return 'medium';
  if (value <= q3) return 'high';
  return 'very_high';
}

/**
 * Hae yhdistysdata GeoJSON-muodossa
 */
export async function fetchAssociationsMapData(
  displayMode: 'count' | 'perCapita' = 'count'
): Promise<GeoJSON.FeatureCollection> {
  // Hae kuntarajat (cached 24h)
  const boundaries: MunicipalityGeoJSON = await getOrFetch(
    'boundaries:2024',
    () => fetchMunicipalityBoundaries(2024),
    86400
  );

  // Hae väkilukudata per capita -laskentaan
  let populationData: Map<string, number> | null = null;
  if (displayMode === 'perCapita') {
    const { getStaticPopulationData } = await import('@/lib/data/crime/static-data');
    populationData = getStaticPopulationData('2024');
  }

  // Kerää arvot kvantiilikategorisointia varten
  const values: number[] = [];
  for (const boundary of boundaries.features) {
    const kuntaCode = boundary.properties.kunta;
    const assocData = staticData.associations[kuntaCode];
    if (!assocData) continue;

    if (displayMode === 'perCapita' && populationData) {
      const pop = populationData.get(kuntaCode);
      if (pop && pop > 0) {
        values.push((assocData.total / pop) * 1000);
      }
    } else {
      values.push(assocData.total);
    }
  }

  const features: GeoJSON.Feature[] = [];

  for (const boundary of boundaries.features) {
    const kuntaCode = boundary.properties.kunta;
    const assocData = staticData.associations[kuntaCode];
    const total = assocData?.total || 0;

    let displayValue = total;
    let perCapitaValue: number | undefined;

    if (displayMode === 'perCapita' && populationData) {
      const pop = populationData.get(kuntaCode);
      if (pop && pop > 0) {
        perCapitaValue = (total / pop) * 1000;
        displayValue = perCapitaValue;
      }
    }

    features.push({
      type: 'Feature',
      geometry: boundary.geometry as GeoJSON.Geometry,
      properties: {
        kunta: kuntaCode,
        nimi: boundary.properties.nimi,
        category: values.length > 0 ? categorizeByQuantile(displayValue, values) : 'low',
        total,
        perCapita: perCapitaValue !== undefined ? Math.round(perCapitaValue * 10) / 10 : undefined,
        displayMode,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
