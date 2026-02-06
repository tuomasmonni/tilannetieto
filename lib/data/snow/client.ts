/**
 * FMI (Ilmatieteen laitos) lumensyvyysdata
 * Hakee lumensyvyyshavaintoja FMI:n avoimesta WFS-rajapinnasta
 * Käyttää simple-muotoista WFS-kyselyä (BsWfsElement), parametri snow_aws
 */

import type { SnowObservation } from '@/lib/types';

const FMI_WFS_URL = 'https://opendata.fmi.fi/wfs';
const STORED_QUERY = 'fmi::observations::weather::simple';

interface SimpleSnowObs {
  lat: number;
  lon: number;
  time: string;
  value: number | null;
}

/**
 * Parsii FMI WFS BsWfsElement (simple) XML-vastauksen lumensyvyydelle
 */
function parseSnowFeatures(xmlText: string): SnowObservation[] {
  const observations: SimpleSnowObs[] = [];

  const memberRegex = /<BsWfs:BsWfsElement[^>]*>([\s\S]*?)<\/BsWfs:BsWfsElement>/g;
  let match;

  while ((match = memberRegex.exec(xmlText)) !== null) {
    const element = match[1];

    // Extract position
    const posMatch = element.match(/<gml:pos>([\d.-]+)\s+([\d.-]+)\s*<\/gml:pos>/);
    if (!posMatch) continue;

    const lat = parseFloat(posMatch[1]);
    const lon = parseFloat(posMatch[2]);

    // Extract time
    const timeMatch = element.match(/<BsWfs:Time>(.*?)<\/BsWfs:Time>/);
    const time = timeMatch ? timeMatch[1] : '';

    // Extract value
    const valueMatch = element.match(/<BsWfs:ParameterValue>(.*?)<\/BsWfs:ParameterValue>/);
    if (!valueMatch) continue;

    const rawValue = valueMatch[1].trim();
    const value = rawValue === 'NaN' || rawValue === '' ? null : parseFloat(rawValue);

    observations.push({ lat, lon, time, value });
  }

  // Ryhmitä aseman mukaan (lat+lon), ota viimeisin arvo
  const stationMap = new Map<string, {
    lat: number;
    lon: number;
    latestTime: string;
    snowDepth: number | null;
  }>();

  for (const obs of observations) {
    const key = `${obs.lat.toFixed(4)}_${obs.lon.toFixed(4)}`;
    const existing = stationMap.get(key);

    if (!existing || obs.time > existing.latestTime) {
      stationMap.set(key, {
        lat: obs.lat,
        lon: obs.lon,
        latestTime: obs.time,
        snowDepth: obs.value,
      });
    }
  }

  const results: SnowObservation[] = [];
  for (const [key, station] of stationMap) {
    // Suodata pois asemat ilman dataa tai negatiivisilla arvoilla
    if (station.snowDepth === null || station.snowDepth < 0) continue;

    results.push({
      stationId: key,
      stationName: `Asema ${station.lat.toFixed(2)}N, ${station.lon.toFixed(2)}E`,
      lat: station.lat,
      lon: station.lon,
      snowDepth: station.snowDepth,
      timestamp: station.latestTime || new Date().toISOString(),
    });
  }

  return results;
}

export async function fetchFmiSnowData(): Promise<SnowObservation[]> {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'getFeature',
    storedquery_id: STORED_QUERY,
    parameters: 'snow_aws',
    bbox: '19.0,59.5,31.6,70.1',
    timestep: '60',
    maxlocations: '500',
  });

  const response = await fetch(`${FMI_WFS_URL}?${params}`, {
    headers: {
      'Accept': 'application/xml',
      'User-Agent': 'tilannekuva.online/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`FMI Snow API error: ${response.status}`);
  }

  const xmlText = await response.text();
  return parseSnowFeatures(xmlText);
}
