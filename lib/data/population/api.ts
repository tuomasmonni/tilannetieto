/**
 * Tilastokeskus PxWeb - Väestörakenne
 *
 * Käyttää samaa dataa kuin crime/api.ts:n fetchPopulationData(),
 * mutta tuottaa oman karttalayerin.
 */

import { getOrFetch } from '@/lib/cache/redis';
import { fetchMunicipalityBoundaries, fetchPopulationData } from '@/lib/data/crime/api';

export interface PopulationMapFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    kunta: string;
    nimi: string;
    population: number;
    year: number;
    category: 'low' | 'medium' | 'high' | 'very_high';
  };
}

export interface PopulationMapGeoJSON {
  type: 'FeatureCollection';
  features: PopulationMapFeature[];
  metadata: {
    year: number;
    totalMunicipalities: number;
    totalPopulation: number;
    fetchedAt: string;
  };
}

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
 * Hae yhdistetty väestökartta-data (kuntarajat + väkiluku)
 */
export async function fetchPopulationMapData(
  year: string = '2024'
): Promise<PopulationMapGeoJSON> {
  const boundaries = await getOrFetch(
    `boundaries:${year}`,
    () => fetchMunicipalityBoundaries(parseInt(year)),
    86400
  );

  const populationData = await fetchPopulationData(year);
  const allValues = Array.from(populationData.values()).filter(v => v > 0);

  const features: PopulationMapFeature[] = [];
  let totalPop = 0;

  for (const boundary of boundaries.features) {
    const code = boundary.properties.kunta;
    const pop = populationData.get(code) ?? 0;
    totalPop += pop;

    features.push({
      type: 'Feature',
      geometry: boundary.geometry,
      properties: {
        kunta: code,
        nimi: boundary.properties.nimi,
        population: pop,
        year: parseInt(year),
        category: categorizeByQuantile(pop, allValues),
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      year: parseInt(year),
      totalMunicipalities: features.length,
      totalPopulation: totalPop,
      fetchedAt: new Date().toISOString(),
    },
  };
}
