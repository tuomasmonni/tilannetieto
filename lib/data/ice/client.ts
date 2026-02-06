/**
 * SYKE Hydrologia OData — jäänpaksuusdata
 * + Digitraffic — jäänmurtajareitit
 */

import type { SykeStation, SykeMeasurement, IceObservation, IcebreakerGeoJSON } from './types';

const SYKE_BASE = 'https://rajapinnat.ymparisto.fi/api/Hydrologiarajapinta/1.1/odata';

/**
 * Parse DDMMSS coordinate string to decimal degrees
 * Example: "633104" → 63 + 31/60 + 04/3600 = 63.5178
 */
function parseDDMMSS(coord: string): number {
  const trimmed = coord.trim();
  if (trimmed.length < 5) return 0;

  const deg = parseInt(trimmed.substring(0, trimmed.length - 4), 10);
  const min = parseInt(trimmed.substring(trimmed.length - 4, trimmed.length - 2), 10);
  const sec = parseInt(trimmed.substring(trimmed.length - 2), 10);

  return deg + min / 60 + sec / 3600;
}

/**
 * Fetch ice thickness stations from SYKE
 * Suure_Id 9 = Jäänpaksuus, Tila_Id 1 = Aktiivinen
 */
async function fetchStations(): Promise<SykeStation[]> {
  const url = `${SYKE_BASE}/Paikka?$filter=Suure_Id eq 9 and Tila_Id eq 1&$select=Paikka_Id,Nimi,KoordLat,KoordLong,KuntaNimi,JarviNimi`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`SYKE stations API error: ${response.status}`);
  }

  const data = await response.json();
  return data.value || [];
}

/**
 * Fetch latest ice thickness measurements from SYKE
 */
async function fetchMeasurements(): Promise<SykeMeasurement[]> {
  const url = `${SYKE_BASE}/Jaanpaksuus?$orderby=Aika desc&$top=500&$select=Paikka_Id,Aika,Arvo`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`SYKE measurements API error: ${response.status}`);
  }

  const data = await response.json();
  return data.value || [];
}

/**
 * Fetch ice data: combine stations + measurements
 */
export async function fetchIceData(): Promise<IceObservation[]> {
  const [stations, measurements] = await Promise.all([
    fetchStations(),
    fetchMeasurements(),
  ]);

  console.log(`[Ice] SYKE: ${stations.length} stations, ${measurements.length} measurements`);

  // Build station lookup
  const stationMap = new Map<number, SykeStation>();
  for (const s of stations) {
    stationMap.set(s.Paikka_Id, s);
  }

  // Get latest measurement per station
  const latestByStation = new Map<number, SykeMeasurement>();
  for (const m of measurements) {
    if (!latestByStation.has(m.Paikka_Id)) {
      latestByStation.set(m.Paikka_Id, m);
    }
  }

  const observations: IceObservation[] = [];

  for (const [paikkaId, measurement] of latestByStation) {
    const station = stationMap.get(paikkaId);
    if (!station) continue;

    const thickness = measurement.Arvo;
    if (thickness === null || thickness === undefined || thickness < 0) continue;

    const lat = parseDDMMSS(station.KoordLat);
    const lon = parseDDMMSS(station.KoordLong);

    if (lat === 0 || lon === 0) continue;

    observations.push({
      stationId: `syke-${paikkaId}`,
      stationName: station.Nimi,
      lat,
      lon,
      iceThickness: thickness,
      timestamp: measurement.Aika,
      municipality: station.KuntaNimi,
      lakeName: station.JarviNimi,
    });
  }

  console.log(`[Ice] ${observations.length} valid observations after join`);
  return observations;
}

/**
 * Fetch icebreaker routes from Digitraffic
 */
export async function fetchIcebreakerRoutes(): Promise<IcebreakerGeoJSON> {
  const response = await fetch('https://meri.digitraffic.fi/api/winter-navigation/v2/dirways', {
    headers: {
      'Accept': 'application/json',
      'Digitraffic-User': 'tilannekuva.online/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Digitraffic icebreaker API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Ice] Icebreaker routes: ${data.features?.length ?? 0} dirways`);
  return data;
}
