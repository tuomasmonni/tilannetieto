/**
 * FMI (Ilmatieteen laitos) sääasemadata
 * Hakee reaaliaikaista säädataa FMI:n avoimesta rajapinnasta
 * Käytetään simple-muotoista WFS-kyselyä (BsWfsElement)
 */

const FMI_WFS_URL = 'https://opendata.fmi.fi/wfs';
const STORED_QUERY = 'fmi::observations::weather::simple';

export interface FmiObservation {
  stationId: string;
  stationName: string;
  lat: number;
  lon: number;
  temperature: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  precipitation: number | null;
  humidity: number | null;
  timestamp: string;
}

interface SimpleObservation {
  lat: number;
  lon: number;
  time: string;
  parameter: string;
  value: number | null;
}

/**
 * Parsii FMI WFS BsWfsElement (simple) XML-vastauksen
 */
function parseSimpleFeatures(xmlText: string): FmiObservation[] {
  const observations: SimpleObservation[] = [];

  // Parse each BsWfsElement
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

    // Extract parameter name and value
    const paramMatch = element.match(/<BsWfs:ParameterName>(.*?)<\/BsWfs:ParameterName>/);
    const valueMatch = element.match(/<BsWfs:ParameterValue>(.*?)<\/BsWfs:ParameterValue>/);

    if (!paramMatch || !valueMatch) continue;

    const parameter = paramMatch[1];
    const rawValue = valueMatch[1].trim();
    const value = rawValue === 'NaN' || rawValue === '' ? null : parseFloat(rawValue);

    observations.push({ lat, lon, time, parameter, value });
  }

  // Group by station (lat+lon) and get latest observation per parameter
  const stationMap = new Map<string, {
    lat: number;
    lon: number;
    latestTime: string;
    temperature: number | null;
    windSpeed: number | null;
    windDirection: number | null;
    precipitation: number | null;
    humidity: number | null;
  }>();

  for (const obs of observations) {
    const key = `${obs.lat.toFixed(4)}_${obs.lon.toFixed(4)}`;
    let station = stationMap.get(key);

    if (!station) {
      station = {
        lat: obs.lat,
        lon: obs.lon,
        latestTime: obs.time,
        temperature: null,
        windSpeed: null,
        windDirection: null,
        precipitation: null,
        humidity: null,
      };
      stationMap.set(key, station);
    }

    // Update latest time
    if (obs.time > station.latestTime) {
      station.latestTime = obs.time;
    }

    // Update parameter value (use latest)
    switch (obs.parameter) {
      case 'temperature':
      case 't2m':
        if (obs.value !== null) station.temperature = obs.value;
        break;
      case 'windspeedms':
      case 'ws_10min':
        if (obs.value !== null) station.windSpeed = obs.value;
        break;
      case 'winddirection':
      case 'wd_10min':
        if (obs.value !== null) station.windDirection = obs.value;
        break;
      case 'precipitation1h':
      case 'r_1h':
        if (obs.value !== null) station.precipitation = obs.value;
        break;
      case 'humidity':
      case 'rh':
        if (obs.value !== null) station.humidity = obs.value;
        break;
    }
  }

  // Convert to array
  const results: FmiObservation[] = [];
  for (const [key, station] of stationMap) {
    // Skip stations with no useful data
    if (station.temperature === null && station.windSpeed === null) continue;

    results.push({
      stationId: key,
      stationName: `Sääasema ${station.lat.toFixed(2)}N, ${station.lon.toFixed(2)}E`,
      lat: station.lat,
      lon: station.lon,
      temperature: station.temperature,
      windSpeed: station.windSpeed,
      windDirection: station.windDirection,
      precipitation: station.precipitation,
      humidity: station.humidity,
      timestamp: station.latestTime || new Date().toISOString(),
    });
  }

  return results;
}

export async function fetchFmiWeatherData(): Promise<FmiObservation[]> {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'getFeature',
    storedquery_id: STORED_QUERY,
    parameters: 'temperature,windspeedms,winddirection,humidity,precipitation1h',
    bbox: '19.0,59.5,31.6,70.1',  // Finland bounding box
    timestep: '60',                 // 1 observation per hour
    maxlocations: '500',            // Limit stations
  });

  const response = await fetch(`${FMI_WFS_URL}?${params}`, {
    headers: {
      'Accept': 'application/xml',
      'User-Agent': 'tilannekuva.online/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`FMI API error: ${response.status}`);
  }

  const xmlText = await response.text();
  return parseSimpleFeatures(xmlText);
}
