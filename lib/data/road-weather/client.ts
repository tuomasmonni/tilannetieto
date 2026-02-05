/**
 * Digitraffic tiesääasemat
 * Hakee reaaliaikaista tiesäädataa Digitraffic-rajapinnasta
 */

const ROAD_WEATHER_STATIONS_URL = 'https://tie.digitraffic.fi/api/weather/v1/stations';
const ROAD_WEATHER_DATA_URL = 'https://tie.digitraffic.fi/api/weather/v1/stations/data';

export interface RoadWeatherStation {
  stationId: number;
  name: string;
  lat: number;
  lon: number;
  roadNumber: number | null;
  municipality: string | null;
}

export interface RoadWeatherData {
  stationId: number;
  name: string;
  lat: number;
  lon: number;
  roadNumber: number | null;
  municipality: string | null;
  airTemperature: number | null;
  roadTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  visibility: number | null;       // meters
  precipitationType: string | null; // DRY, RAIN, SLEET, SNOW
  roadCondition: string | null;     // DRY, MOIST, WET, FROST, ICE, SNOW
  timestamp: string;
}

interface DigitrafficStationsResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id: number;
    geometry: {
      type: 'Point';
      coordinates: [number, number, number];
    };
    properties: {
      id: number;
      name: string;
      collectionStatus: string;
      municipality?: string;
      municipalityCode?: number;
      province?: string;
      roadNumber?: number;
    };
  }>;
}

interface DigitrafficDataResponse {
  stations: Array<{
    id: number;
    dataUpdatedTime: string;
    sensorValues: Array<{
      id: number;
      stationId: number;
      name: string;
      shortName: string;
      sensorValue: number;
      sensorUnit: string;
      measuredTime: string;
    }>;
  }>;
}

// Sensor names/IDs for extracting data
const SENSOR_MAP: Record<string, string> = {
  ILMA: 'airTemperature',
  TIE_1: 'roadTemperature',
  ILMAN_KOSTEUS: 'humidity',
  KESKITUULI: 'windSpeed',
  NAKYVYYS: 'visibility',
  SPITYPE: 'precipitationType',
  TIEN_SUOLA: 'roadCondition',
};

export async function fetchRoadWeatherData(): Promise<RoadWeatherData[]> {
  // Fetch stations and sensor data in parallel
  const [stationsRes, dataRes] = await Promise.all([
    fetch(ROAD_WEATHER_STATIONS_URL, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'tilannekuva.online/1.0' },
    }),
    fetch(ROAD_WEATHER_DATA_URL, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'tilannekuva.online/1.0' },
    }),
  ]);

  if (!stationsRes.ok) throw new Error(`Digitraffic stations API error: ${stationsRes.status}`);
  if (!dataRes.ok) throw new Error(`Digitraffic data API error: ${dataRes.status}`);

  const stationsJson: DigitrafficStationsResponse = await stationsRes.json();
  const dataJson: DigitrafficDataResponse = await dataRes.json();

  // Build station lookup
  const stationMap = new Map<number, {
    name: string;
    lat: number;
    lon: number;
    roadNumber: number | null;
    municipality: string | null;
  }>();

  for (const feature of stationsJson.features) {
    if (feature.properties.collectionStatus !== 'GATHERING') continue;
    stationMap.set(feature.properties.id, {
      name: feature.properties.name,
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      roadNumber: feature.properties.roadNumber || null,
      municipality: feature.properties.municipality || null,
    });
  }

  // Map sensor data to stations
  const results: RoadWeatherData[] = [];

  for (const stationData of (dataJson.stations || [])) {
    const stationInfo = stationMap.get(stationData.id);
    if (!stationInfo) continue;

    const sensorValues: Record<string, number | null> = {
      airTemperature: null,
      roadTemperature: null,
      humidity: null,
      windSpeed: null,
      visibility: null,
    };
    let precipitationType: string | null = null;
    let roadCondition: string | null = null;

    for (const sensor of stationData.sensorValues) {
      const shortName = sensor.shortName || sensor.name;
      if (shortName === 'ILMA') sensorValues.airTemperature = sensor.sensorValue;
      else if (shortName === 'TIE_1') sensorValues.roadTemperature = sensor.sensorValue;
      else if (shortName === 'ILMAN_KOSTEUS') sensorValues.humidity = sensor.sensorValue;
      else if (shortName === 'KESKITUULI') sensorValues.windSpeed = sensor.sensorValue;
      else if (shortName === 'NAKYVYYS') sensorValues.visibility = sensor.sensorValue;
    }

    results.push({
      stationId: stationData.id,
      name: stationInfo.name,
      lat: stationInfo.lat,
      lon: stationInfo.lon,
      roadNumber: stationInfo.roadNumber,
      municipality: stationInfo.municipality,
      airTemperature: sensorValues.airTemperature,
      roadTemperature: sensorValues.roadTemperature,
      humidity: sensorValues.humidity,
      windSpeed: sensorValues.windSpeed,
      visibility: sensorValues.visibility,
      precipitationType,
      roadCondition,
      timestamp: stationData.dataUpdatedTime || new Date().toISOString(),
    });
  }

  return results;
}
