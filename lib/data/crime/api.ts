/**
 * Tilastokeskus PxWeb API Client
 *
 * Dokumentaatio: https://pxdata.stat.fi/api1.html
 * Rikostilastot: https://pxdata.stat.fi/PXWeb/pxweb/fi/StatFin/StatFin__rpk/
 */

const PXWEB_BASE_URL = 'https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin';

export interface PxWebQuery {
  query: Array<{
    code: string;
    selection: {
      filter: string;
      values: string[];
    };
  }>;
  response: {
    format: 'json' | 'json-stat2' | 'csv' | 'xlsx';
  };
}

export interface CrimeStatistics {
  municipalityCode: string;
  municipalityName: string;
  year: number;
  totalCrimes: number;
  crimesPerCapita?: number;
}

/**
 * Hae rikostilastot kunnittain
 * Taulukko: 13kq - Tietoon tulleet rikokset kunnittain (ICCS-luokitus)
 *
 * API-muuttujat:
 * - Vuosi: "2023"
 * - Kunta: "KU091" (Helsinki), "SSS" (koko maa)
 * - ICCS rikosluokka: "SSS" (yhteensä), "0101" (henkirikokset), jne.
 * - Jutun luokittelu: "SSS" (yhteensä)
 * - Tiedot: "rikokset_lkm"
 *
 * @param year - Vuosi (esim. "2023")
 * @param categories - ICCS-luokkakoodit (esim. ["SSS"] tai ["0101", "0201"])
 */
export async function fetchCrimeStatsByMunicipality(
  year: string = '2023',
  categories: string[] = ['SSS']
): Promise<CrimeStatistics[]> {
  const url = `${PXWEB_BASE_URL}/rpk/statfin_rpk_pxt_13kq.px`;

  // Haetaan kaikki kunnat, valitut rikostyypit
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
        code: 'Kunta',
        selection: {
          filter: 'all',
          values: ['*'] // Kaikki kunnat
        }
      },
      {
        code: 'ICCS rikosluokka',
        selection: {
          filter: 'item',
          values: categories // Valitut rikosluokat
        }
      },
      {
        code: 'Jutun luokittelu',
        selection: {
          filter: 'item',
          values: ['SSS'] // Kaikki jutut yhteensä
        }
      }
    ],
    response: {
      format: 'json'
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Tilastokeskus API error: ${response.status}`);
    }

    const data = await response.json();
    return parseCrimeData(data, parseInt(year), categories);
  } catch (error) {
    console.error('Failed to fetch crime statistics:', error);
    throw error;
  }
}

/**
 * Parsii PxWeb JSON-vastauksen
 *
 * PxWeb JSON-rakenne:
 * {
 *   "columns": [{"code": "Vuosi"}, {"code": "Kunta"}, {"code": "ICCS rikosluokka"}, ...],
 *   "data": [{"key": ["2023", "KU091", "SSS", "SSS"], "values": ["12345"]}, ...]
 * }
 *
 * Huom: Kuntakoodi on muodossa "KU091" API:ssa, mutta WFS käyttää "091"
 *
 * Jos useita kategorioita on valittu, summataan rikokset kunnittain.
 */
function parseCrimeData(data: any, year: number, categories: string[] = ['SSS']): CrimeStatistics[] {
  // Jos useita kategorioita, kerätään summat kunnittain
  const municipalityTotals = new Map<string, { name: string; total: number }>();

  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      // Key-taulukossa: [Vuosi, Kunta, ICCS, Jutun luokittelu]
      // Kuntakoodi on indeksissä 1, muodossa "KU091" tai "SSS"
      const rawCode = item.key?.[1] || '';
      const crimeCount = parseInt(item.values?.[0]) || 0;

      // Ohita "SSS" (koko maa), "200" (ulkomaat), "X" (tuntematon)
      if (rawCode === 'SSS' || rawCode === '200' || rawCode === 'X') {
        continue;
      }

      // Muunna "KU091" → "091" (WFS-yhteensopiva)
      const municipalityCode = rawCode.startsWith('KU') ? rawCode.slice(2) : rawCode;

      if (!municipalityCode || municipalityCode.length !== 3) {
        continue;
      }

      // Hae kunnan nimi metadata-taulukosta tai käytä oletusta
      const municipalityName = getMunicipalityName(rawCode);

      // Lisää tai päivitä summa
      const existing = municipalityTotals.get(municipalityCode);
      if (existing) {
        existing.total += crimeCount;
      } else {
        municipalityTotals.set(municipalityCode, {
          name: municipalityName,
          total: crimeCount,
        });
      }
    }
  }

  // Muunna Map tulostaulukoksi
  const results: CrimeStatistics[] = [];
  for (const [code, data] of municipalityTotals) {
    results.push({
      municipalityCode: code,
      municipalityName: data.name,
      year,
      totalCrimes: data.total,
    });
  }

  return results;
}

// Kuntien nimet (yleisimmät, täydentyy API-metadatasta)
const MUNICIPALITY_NAMES: Record<string, string> = {
  'KU091': 'Helsinki', 'KU049': 'Espoo', 'KU092': 'Vantaa',
  'KU853': 'Turku', 'KU837': 'Tampere', 'KU564': 'Oulu',
  'KU297': 'Kuopio', 'KU179': 'Jyväskylä', 'KU398': 'Lahti',
  'KU609': 'Pori', 'KU405': 'Lappeenranta', 'KU167': 'Joensuu',
};

function getMunicipalityName(code: string): string {
  return MUNICIPALITY_NAMES[code] || code.replace('KU', '');
}

/**
 * Hae väkilukutiedot Tilastokeskuksen PxWeb API:sta
 * Taulukko: statfin_vaerak_pxt_11rh.px (Väestörakenne kunnittain)
 *
 * @param year - Vuosi (esim. "2024")
 * @returns Map<kuntakoodi, väkiluku>
 */
export async function fetchPopulationData(year: string = '2024'): Promise<Map<string, number>> {
  const url = `${PXWEB_BASE_URL}/vaerak/statfin_vaerak_pxt_11rh.px`;

  const query: PxWebQuery = {
    query: [
      {
        code: 'Alue',
        selection: {
          filter: 'all',
          values: ['*'] // Kaikki kunnat
        }
      },
      {
        code: 'Kansalaisuus',
        selection: {
          filter: 'item',
          values: ['SSS'] // Yhteensä (kaikki kansalaisuudet)
        }
      },
      {
        code: 'Sukupuoli',
        selection: {
          filter: 'item',
          values: ['SSS'] // Yhteensä (molemmat sukupuolet)
        }
      },
      {
        code: 'Vuosi',
        selection: {
          filter: 'item',
          values: [year]
        }
      },
      {
        code: 'Tiedot',
        selection: {
          filter: 'item',
          values: ['vaesto'] // Väestö 31.12.
        }
      }
    ],
    response: {
      format: 'json'
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Tilastokeskus API error: ${response.status}`);
    }

    const data = await response.json();
    return parsePopulationData(data);
  } catch (error) {
    console.error('Failed to fetch population data:', error);
    throw error;
  }
}

/**
 * Parsii väkilukudatan PxWeb JSON-vastauksesta
 *
 * PxWeb JSON-rakenne:
 * {
 *   "data": [{"key": ["KU091", "SSS", "SSS", "2024", "vaesto"], "values": ["664258"]}, ...]
 * }
 *
 * Kuntakoodi normalisoidaan: "KU091" → "091"
 */
function parsePopulationData(data: any): Map<string, number> {
  const populationMap = new Map<string, number>();

  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      // Key-taulukossa: [Alue, Kansalaisuus, Sukupuoli, Vuosi, Tiedot]
      const rawCode = item.key?.[0] || '';
      const population = parseInt(item.values?.[0]) || 0;

      // Ohita "SSS" (koko maa)
      if (rawCode === 'SSS' || !rawCode.startsWith('KU')) {
        continue;
      }

      // Muunna "KU091" → "091" (WFS-yhteensopiva)
      const municipalityCode = rawCode.slice(2);

      if (municipalityCode.length === 3) {
        populationMap.set(municipalityCode, population);
      }
    }
  }

  return populationMap;
}

/**
 * Hae saatavilla olevat vuodet
 */
export async function fetchAvailableYears(): Promise<string[]> {
  const url = `${PXWEB_BASE_URL}/rpk/statfin_rpk_pxt_13kq.px`;

  try {
    const response = await fetch(url);
    const metadata = await response.json();

    const yearVariable = metadata.variables?.find((v: any) => v.code === 'Vuosi');
    return yearVariable?.values || ['2023'];
  } catch (error) {
    console.error('Failed to fetch available years:', error);
    return ['2023'];
  }
}

/**
 * Hae saatavilla olevat ICCS-rikosluokat
 */
export async function fetchCrimeCategories(): Promise<Array<{ code: string; label: string }>> {
  const url = `${PXWEB_BASE_URL}/rpk/statfin_rpk_pxt_13kq.px`;

  try {
    const response = await fetch(url);
    const metadata = await response.json();

    const categoryVariable = metadata.variables?.find((v: any) => v.code === 'ICCS rikosluokka');
    if (!categoryVariable) {
      return [{ code: 'SSS', label: 'Kaikki rikokset' }];
    }

    // Yhdistä koodit ja tekstit
    const codes = categoryVariable.values || [];
    const labels = categoryVariable.valueTexts || codes;

    return codes.map((code: string, i: number) => ({
      code,
      label: labels[i] || code,
    }));
  } catch (error) {
    console.error('Failed to fetch crime categories:', error);
    return [{ code: 'SSS', label: 'Kaikki rikokset' }];
  }
}

/**
 * Muunna rikostilastot GeoJSON properties -muotoon
 */
export function crimeStatsToGeoJsonProperties(stats: CrimeStatistics[]): Record<string, any> {
  const properties: Record<string, any> = {};

  for (const stat of stats) {
    properties[stat.municipalityCode] = {
      crimes: stat.totalCrimes,
      year: stat.year,
      name: stat.municipalityName,
    };
  }

  return properties;
}

// ============================================
// KUNTARAJAT (Tilastokeskus WFS)
// ============================================

import { getOrFetch } from '@/lib/cache/redis';

const WFS_BASE_URL = 'https://geo.stat.fi/geoserver/tilastointialueet/wfs';

export interface MunicipalityBoundary {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    kunta: string;
    nimi: string;
    namn: string;
    name: string;
    vuosi: number;
  };
}

export interface MunicipalityGeoJSON {
  type: 'FeatureCollection';
  features: MunicipalityBoundary[];
}

/**
 * Hae kuntarajat Tilastokeskuksen WFS-palvelusta
 * Palauttaa GeoJSON WGS84-koordinaateilla (EPSG:4326)
 */
export async function fetchMunicipalityBoundaries(year: number = 2024): Promise<MunicipalityGeoJSON> {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: `tilastointialueet:kunta4500k_${year}`,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326', // WGS84 Mapboxille
  });

  const url = `${WFS_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WFS error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch municipality boundaries:', error);
    throw error;
  }
}

// ============================================
// YHDISTETTY RIKOSKARTTA-DATA
// ============================================

export interface CrimeMapFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    kunta: string;
    nimi: string;
    totalCrimes: number;
    crimesPerCapita?: number;
    year: number;
    category: 'low' | 'medium' | 'high' | 'very_high';
    crimeBreakdown?: string;
  };
}

export interface CrimeMapGeoJSON {
  type: 'FeatureCollection';
  features: CrimeMapFeature[];
  metadata: {
    year: number;
    totalMunicipalities: number;
    totalCrimes: number;
    fetchedAt: string;
  };
}

/**
 * Kategorisoi rikostaso värikoodausta varten
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
 * Hae yhdistetty rikoskartta-data (kuntarajat + tilastot)
 * Käyttää staattista dataa rikostilastoille (nopeampi, ei API-kutsuja)
 *
 * @param year - Vuosi (esim. "2023")
 * @param categories - ICCS-luokkakoodit (esim. ["SSS"] tai ["010000", "020000"])
 * @param useStaticData - Käytä staattista dataa (oletus: true)
 * @param usePerCapita - Näytä per capita -luvut (per 100 000 asukasta)
 */
export async function fetchCrimeMapData(
  year: string = '2023',
  categories: string[] = ['SSS'],
  useStaticData: boolean = true,
  usePerCapita: boolean = false
): Promise<CrimeMapGeoJSON> {
  // Hae kuntarajat (cached 24h - muuttuvat vain vuosittain)
  const boundaries = await getOrFetch(
    `boundaries:${year}`,
    () => fetchMunicipalityBoundaries(parseInt(year)),
    86400 // 24h TTL
  );

  // Kaikki rikoskategoriat erittelyä varten
  const ALL_CRIME_CATEGORIES = ['SSS', '010000', '020000', '030000', '050000', '060000', '070000', '090000'];

  // Käytä staattista dataa jos saatavilla
  let crimeStats: CrimeStatistics[];
  // Breakdown: kuntakoodi -> { kategoria: lkm }
  const crimeBreakdown = new Map<string, Record<string, number>>();

  if (useStaticData) {
    const { getStaticCrimeStats, getAvailableYears } = await import('./static-data');
    const availableYears = getAvailableYears();

    if (availableYears.includes(year)) {
      // Hae valittujen kategorioiden data normaalisti
      const staticStats = getStaticCrimeStats(year, categories);
      crimeStats = staticStats.map(s => ({
        municipalityCode: s.municipalityCode,
        municipalityName: s.municipalityName,
        year: parseInt(year),
        totalCrimes: s.totalCrimes,
      }));

      // Hae KAIKKI kategoriat erikseen klikki-erittelyä varten
      for (const cat of ALL_CRIME_CATEGORIES) {
        const catStats = getStaticCrimeStats(year, [cat]);
        for (const s of catStats) {
          const existing = crimeBreakdown.get(s.municipalityCode) || {};
          existing[cat] = s.totalCrimes;
          crimeBreakdown.set(s.municipalityCode, existing);
        }
      }

      console.log(`Käytetään staattista dataa vuodelle ${year}`);
    } else {
      console.log(`Vuosi ${year} ei staattisessa datassa, haetaan API:sta`);
      crimeStats = await fetchCrimeStatsByMunicipality(year, categories);
    }
  } else {
    crimeStats = await fetchCrimeStatsByMunicipality(year, categories);
  }

  // Hae väkilukudata jos per capita -moodi on käytössä
  let populationData: Map<string, number> | null = null;
  if (usePerCapita) {
    if (useStaticData) {
      const { getStaticPopulationData, getAvailableYears } = await import('./static-data');
      const availableYears = getAvailableYears();
      if (availableYears.includes(year)) {
        populationData = getStaticPopulationData(year);
        console.log(`Käytetään staattista väkilukudataa vuodelle ${year}`);
      }
    }
    // Jos staattista dataa ei ole, haetaan API:sta
    if (!populationData) {
      try {
        populationData = await fetchPopulationData(year);
        console.log(`Haettiin väkilukudata API:sta vuodelle ${year}`);
      } catch (error) {
        console.error('Väkilukudatan haku epäonnistui:', error);
      }
    }
  }

  // Laske per capita -arvot jos väkilukudata on saatavilla
  if (usePerCapita && populationData) {
    for (const stat of crimeStats) {
      const population = populationData.get(stat.municipalityCode);
      if (population && population > 0) {
        stat.crimesPerCapita = (stat.totalCrimes / population) * 100000;
      }
    }
  }

  // Luo lookup-taulukko rikostilastoista (kuntakoodi -> data)
  const crimeByMunicipality = new Map<string, CrimeStatistics>();
  for (const stat of crimeStats) {
    crimeByMunicipality.set(stat.municipalityCode, stat);
  }

  // Kerää kaikki arvot kvantiilikategorisointia varten
  // Käytä per capita -arvoja jos käytössä, muuten absoluuttisia
  const allValues = crimeStats
    .map(s => usePerCapita ? (s.crimesPerCapita ?? 0) : s.totalCrimes)
    .filter(v => v > 0);

  // Yhdistä kuntarajat ja tilastot
  const features: CrimeMapFeature[] = [];
  let totalCrimes = 0;

  for (const boundary of boundaries.features) {
    const kuntaCode = boundary.properties.kunta;
    const stats = crimeByMunicipality.get(kuntaCode);

    const crimes = stats?.totalCrimes || 0;
    totalCrimes += crimes;

    // Valitse kategorisointiarvo riippuen moodista
    const valueForCategory = usePerCapita
      ? (stats?.crimesPerCapita ?? 0)
      : crimes;

    // Rikosjakauma klikkimodaalia varten
    const breakdown = crimeBreakdown.get(kuntaCode);

    features.push({
      type: 'Feature',
      geometry: boundary.geometry,
      properties: {
        kunta: kuntaCode,
        nimi: boundary.properties.nimi,
        totalCrimes: crimes,
        crimesPerCapita: stats?.crimesPerCapita,
        year: parseInt(year),
        category: categorizeByQuantile(valueForCategory, allValues),
        crimeBreakdown: breakdown ? JSON.stringify(breakdown) : undefined,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      year: parseInt(year),
      totalMunicipalities: features.length,
      totalCrimes,
      fetchedAt: new Date().toISOString(),
    },
  };
}
