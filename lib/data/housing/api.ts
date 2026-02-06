/**
 * Tilastokeskus PxWeb - Asuntohinnat
 *
 * Taulukko: statfin_ashi_pxt_112q.px (Vanhojen asuntojen hinnat)
 * Dokumentaatio: https://pxdata.stat.fi/PXWeb/pxweb/fi/StatFin/StatFin__ashi/
 */

import { getOrFetch } from '@/lib/cache/redis';
import { fetchMunicipalityBoundaries, type PxWebQuery } from '@/lib/data/crime/api';

const PXWEB_BASE_URL = 'https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin';

export interface HousingStats {
  municipalityCode: string;
  municipalityName: string;
  year: number;
  pricePerSqm: number; // €/m²
}

export interface HousingMapFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    kunta: string;
    nimi: string;
    pricePerSqm: number;
    year: number;
    category: 'low' | 'medium' | 'high' | 'very_high';
  };
}

export interface HousingMapGeoJSON {
  type: 'FeatureCollection';
  features: HousingMapFeature[];
  metadata: {
    year: number;
    totalMunicipalities: number;
    fetchedAt: string;
  };
}

/**
 * Hae asuntohinnat kunnittain
 */
export async function fetchHousingPricesByMunicipality(
  year: string = '2024'
): Promise<HousingStats[]> {
  const url = `${PXWEB_BASE_URL}/ashi/statfin_ashi_pxt_112q.px`;

  const query: PxWebQuery = {
    query: [
      {
        code: 'Vuosi',
        selection: {
          filter: 'item',
          values: [year]
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
        code: 'Huoneistotyypit',
        selection: {
          filter: 'item',
          values: ['0'] // Yhteensä (kaikki tyypit)
        }
      },
      {
        code: 'Tiedot',
        selection: {
          filter: 'item',
          values: ['keskihinta_m2'] // €/m² keskiarvo
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
  return parseHousingData(data, parseInt(year));
}

function parseHousingData(data: any, year: number): HousingStats[] {
  const results: HousingStats[] = [];

  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      const rawCode = item.key?.[1] || '';
      const value = parseFloat(item.values?.[0]);

      if (!value || isNaN(value) || value === 0) continue;
      if (rawCode === 'SSS' || rawCode === '200' || rawCode === 'X') continue;

      const municipalityCode = rawCode.startsWith('KU') ? rawCode.slice(2) : rawCode;
      if (!municipalityCode || municipalityCode.length !== 3) continue;

      results.push({
        municipalityCode,
        municipalityName: rawCode,
        year,
        pricePerSqm: value,
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
 * Hae yhdistetty asuntohintakartta-data (kuntarajat + hinnat)
 */
export async function fetchHousingMapData(
  year: string = '2024'
): Promise<HousingMapGeoJSON> {
  const boundaries = await getOrFetch(
    `boundaries:${year}`,
    () => fetchMunicipalityBoundaries(parseInt(year)),
    86400
  );

  const stats = await fetchHousingPricesByMunicipality(year);
  const statsByCode = new Map(stats.map(s => [s.municipalityCode, s]));
  const allValues = stats.map(s => s.pricePerSqm).filter(v => v > 0);

  const features: HousingMapFeature[] = [];

  for (const boundary of boundaries.features) {
    const code = boundary.properties.kunta;
    const stat = statsByCode.get(code);

    if (!stat) continue; // Ohita kunnat joille ei ole hintadataa

    features.push({
      type: 'Feature',
      geometry: boundary.geometry,
      properties: {
        kunta: code,
        nimi: boundary.properties.nimi,
        pricePerSqm: stat.pricePerSqm,
        year: parseInt(year),
        category: categorizeByQuantile(stat.pricePerSqm, allValues),
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
