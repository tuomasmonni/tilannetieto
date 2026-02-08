/**
 * Sotkanet API Client (THL)
 *
 * API: https://sotkanet.fi/rest/1.1/
 * Lisenssi: CC BY 4.0 (maininta THL/Sotkanet vaadittu)
 *
 * Huom: /json endpoint palauttaa flat-muodon:
 *   { indicator: 5641, region: 46, year: 2023, gender: "total", value: 196 }
 * Region on pelkkä ID → tarvitaan /regions endpoint koodimappiin.
 */

const SOTKANET_BASE = 'https://sotkanet.fi/rest/1.1';

interface SotkanetRawDataPoint {
  indicator: number;
  region: number;
  year: number;
  gender: string;
  value: number;
  absValue?: number;
}

interface SotkanetRegion {
  id: number;
  code: string;
  category: string;
  title: { fi: string; en?: string; sv?: string };
}

// Välimuisti alueille (ei muutu usein)
let regionCache: Map<number, SotkanetRegion> | null = null;

/**
 * Hae Sotkanet-aluetiedot ja rakenna id→alue mapping
 */
async function getRegionMap(): Promise<Map<number, SotkanetRegion>> {
  if (regionCache) return regionCache;

  const url = `${SOTKANET_BASE}/regions`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tilannetieto.fi/1.0' },
    next: { revalidate: 86400 }, // 24h cache
  });

  if (!response.ok) {
    throw new Error(`Sotkanet regions API error: ${response.status}`);
  }

  const regions: SotkanetRegion[] = await response.json();
  const map = new Map<number, SotkanetRegion>();

  for (const region of regions) {
    map.set(region.id, region);
  }

  regionCache = map;
  return map;
}

/**
 * Hae indikaattoridata kunnittain
 *
 * @param indicatorId - Sotkanet-indikaattorin ID
 * @param year - Vuosi
 * @returns Map<kuntakoodi, arvo>
 */
export async function fetchIndicatorByMunicipality(
  indicatorId: string,
  year: string
): Promise<Map<string, { value: number; absValue?: number; regionName: string }>> {
  const [dataResponse, regionMap] = await Promise.all([
    fetch(`${SOTKANET_BASE}/json?indicator=${indicatorId}&years=${year}&genders=total`, {
      headers: { 'User-Agent': 'tilannetieto.fi/1.0' },
      next: { revalidate: 86400 }, // 24h cache
    }),
    getRegionMap(),
  ]);

  if (!dataResponse.ok) {
    throw new Error(`Sotkanet API error: ${dataResponse.status}`);
  }

  const data: SotkanetRawDataPoint[] = await dataResponse.json();
  const result = new Map<string, { value: number; absValue?: number; regionName: string }>();

  for (const point of data) {
    const region = regionMap.get(point.region);
    if (!region) continue;

    // Suodata vain kunnat (3-numeroinen koodi)
    const code = region.code;
    if (!code || code.length !== 3 || isNaN(Number(code))) continue;

    result.set(code, {
      value: point.value,
      absValue: point.absValue,
      regionName: region.title?.fi || code,
    });
  }

  return result;
}

/**
 * Hae kansallinen keskiarvo indikaattorille
 */
export async function fetchNationalAverage(
  indicatorId: string,
  year: string
): Promise<number | null> {
  const [dataResponse, regionMap] = await Promise.all([
    fetch(`${SOTKANET_BASE}/json?indicator=${indicatorId}&years=${year}&genders=total`, {
      headers: { 'User-Agent': 'tilannetieto.fi/1.0' },
      next: { revalidate: 86400 },
    }),
    getRegionMap(),
  ]);

  if (!dataResponse.ok) return null;

  const data: SotkanetRawDataPoint[] = await dataResponse.json();

  // Koko Suomi: etsitään region jolla category on tyhjä/MANNER-SUOMI tai id 1
  const national = data.find((p) => {
    const region = regionMap.get(p.region);
    return region && (region.id === 1 || region.code === '' || region.category === 'MAA');
  });

  return national?.value ?? null;
}
