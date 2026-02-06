/**
 * Sotkanet API Client (THL)
 *
 * API: https://sotkanet.fi/rest/1.1/
 * Lisenssi: CC BY 4.0 (maininta THL/Sotkanet vaadittu)
 */

const SOTKANET_BASE = 'https://sotkanet.fi/rest/1.1';

export interface SotkanetDataPoint {
  indicator: { id: number };
  region: { id: number; code: string; title: { fi: string } };
  year: number;
  gender: string;
  value: number;
  absValue?: number;
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
  const url = `${SOTKANET_BASE}/json?indicator=${indicatorId}&years=${year}&genders=total`;

  const response = await fetch(url, {
    next: { revalidate: 86400 }, // 24h cache
  });

  if (!response.ok) {
    throw new Error(`Sotkanet API error: ${response.status}`);
  }

  const data: SotkanetDataPoint[] = await response.json();
  const result = new Map<string, { value: number; absValue?: number; regionName: string }>();

  for (const point of data) {
    // Sotkanet käyttää region.code muodossa "091" (kuntakoodi)
    // Suodata vain kunnat (code on 3-numeroinen)
    const code = point.region.code;
    if (!code || code.length !== 3 || isNaN(Number(code))) continue;

    result.set(code, {
      value: point.value,
      absValue: point.absValue,
      regionName: point.region.title?.fi || code,
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
  // Sotkanet region code "SSS" = koko maa (mutta Sotkanet käyttää region id:tä)
  const url = `${SOTKANET_BASE}/json?indicator=${indicatorId}&years=${year}&genders=total`;

  const response = await fetch(url, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) return null;

  const data: SotkanetDataPoint[] = await response.json();

  // Koko maan tieto: region code on tyypillisesti tyhjä tai "0" (valtio-taso)
  const national = data.find(p =>
    p.region.code === '' || p.region.code === '0' || p.region.id === 1
  );

  return national?.value ?? null;
}
