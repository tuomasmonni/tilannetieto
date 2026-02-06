/**
 * Tilastokeskus PxWeb - Työttömyystilastot
 *
 * Taulukko: statfin_tyonv_pxt_12ti.px (Työttömät työnhakijat kunnittain)
 * Dokumentaatio: https://pxdata.stat.fi/PXWeb/pxweb/fi/StatFin/StatFin__tyonv/
 */

import { getOrFetch } from '@/lib/cache/redis';
import { fetchMunicipalityBoundaries, fetchPopulationData, type PxWebQuery } from '@/lib/data/crime/api';

const PXWEB_BASE_URL = 'https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin';

export interface UnemploymentStats {
  municipalityCode: string;
  municipalityName: string;
  year: number;
  unemployed: number;
  unemploymentRate?: number; // Jos saatavilla
}

export interface UnemploymentMapFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    kunta: string;
    nimi: string;
    unemployed: number;
    unemploymentRate?: number;
    population?: number;
    year: number;
    category: 'low' | 'medium' | 'high' | 'very_high';
  };
}

export interface UnemploymentMapGeoJSON {
  type: 'FeatureCollection';
  features: UnemploymentMapFeature[];
  metadata: {
    year: number;
    totalMunicipalities: number;
    fetchedAt: string;
  };
}

/**
 * Hae työttömyystilastot kunnittain
 */
export async function fetchUnemploymentByMunicipality(
  year: string = '2024'
): Promise<UnemploymentStats[]> {
  const url = `${PXWEB_BASE_URL}/tyonv/statfin_tyonv_pxt_12ti.px`;

  const query: PxWebQuery = {
    query: [
      {
        code: 'Kuukausi',
        selection: {
          filter: 'item',
          values: [`${year}M12`] // Joulukuu = vuoden loppu
        }
      },
      {
        code: 'Alue',
        selection: {
          filter: 'all',
          values: ['*']
        }
      },
      {
        code: 'Tiedot',
        selection: {
          filter: 'item',
          values: ['TYOTTOMIEN_MAARA'] // Työttömien lukumäärä
        }
      }
    ],
    response: { format: 'json' }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`Tilastokeskus API error: ${response.status}`);
  }

  const data = await response.json();
  return parseUnemploymentData(data, parseInt(year));
}

function parseUnemploymentData(data: any, year: number): UnemploymentStats[] {
  const results: UnemploymentStats[] = [];

  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      const rawCode = item.key?.[1] || '';
      const value = parseInt(item.values?.[0]) || 0;

      if (rawCode === 'SSS' || rawCode === '200' || rawCode === 'X') continue;

      const municipalityCode = rawCode.startsWith('KU') ? rawCode.slice(2) : rawCode;
      if (!municipalityCode || municipalityCode.length !== 3) continue;

      results.push({
        municipalityCode,
        municipalityName: rawCode,
        year,
        unemployed: value,
      });
    }
  }

  return results;
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
 * Hae yhdistetty työttömyyskartta-data (kuntarajat + tilastot)
 */
export async function fetchUnemploymentMapData(
  year: string = '2024',
  usePerCapita: boolean = true
): Promise<UnemploymentMapGeoJSON> {
  const boundaries = await getOrFetch(
    `boundaries:${year}`,
    () => fetchMunicipalityBoundaries(parseInt(year)),
    86400
  );

  const stats = await fetchUnemploymentByMunicipality(year);

  let populationData: Map<string, number> | null = null;
  if (usePerCapita) {
    try {
      populationData = await fetchPopulationData(year);
    } catch (error) {
      console.error('Väkilukudatan haku epäonnistui:', error);
    }
  }

  // Laske työttömyysprosentit
  if (usePerCapita && populationData) {
    for (const stat of stats) {
      const pop = populationData.get(stat.municipalityCode);
      if (pop && pop > 0) {
        stat.unemploymentRate = (stat.unemployed / pop) * 100;
      }
    }
  }

  const statsByCode = new Map(stats.map(s => [s.municipalityCode, s]));
  const allValues = stats
    .map(s => usePerCapita ? (s.unemploymentRate ?? 0) : s.unemployed)
    .filter(v => v > 0);

  const features: UnemploymentMapFeature[] = [];

  for (const boundary of boundaries.features) {
    const code = boundary.properties.kunta;
    const stat = statsByCode.get(code);

    const valueForCategory = usePerCapita
      ? (stat?.unemploymentRate ?? 0)
      : (stat?.unemployed ?? 0);

    features.push({
      type: 'Feature',
      geometry: boundary.geometry,
      properties: {
        kunta: code,
        nimi: boundary.properties.nimi,
        unemployed: stat?.unemployed ?? 0,
        unemploymentRate: stat?.unemploymentRate,
        population: populationData?.get(code),
        year: parseInt(year),
        category: categorizeByQuantile(valueForCategory, allValues),
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      year: parseInt(year),
      totalMunicipalities: features.length,
      fetchedAt: new Date().toISOString(),
    },
  };
}
