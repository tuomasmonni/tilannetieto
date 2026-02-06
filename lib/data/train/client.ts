/**
 * Rata.digitraffic.fi - Junaseuranta
 * Hakee reaaliaikaiset junasijainnit ja junatiedot GraphQL API:lla
 */

const GRAPHQL_URL = 'https://rata.digitraffic.fi/api/v2/graphql/graphql';
const TRAIN_LOCATIONS_URL = 'https://rata.digitraffic.fi/api/v1/train-locations/latest';

export type TrainCategory = 'Long-distance' | 'Commuter' | 'Cargo' | 'Locomotive' | 'Shunting';

export interface TrainWithLocation {
  trainNumber: number;
  departureDate: string;
  trainType: string;
  trainCategory: TrainCategory;
  commuterLineID?: string;
  lat: number;
  lon: number;
  speed: number;
  lateMinutes: number;
  timestamp: string;
}

const GRAPHQL_QUERY = `{
  currentlyRunningTrains {
    trainNumber
    departureDate
    commuterLineid
    trainType { name trainCategory { name } }
    trainLocations(orderBy: {timestamp: DESCENDING}, take: 1) {
      speed timestamp location
    }
    timeTableRows(orderBy: {scheduledTime: DESCENDING}, take: 1) {
      differenceInMinutes
    }
  }
}`;

interface GraphQLTrain {
  trainNumber: number;
  departureDate: string;
  commuterLineid: string | null;
  trainType: { name: string; trainCategory: { name: string } };
  trainLocations: Array<{
    speed: number;
    timestamp: string;
    location: [number, number]; // [lon, lat]
  }>;
  timeTableRows: Array<{
    differenceInMinutes: number | null;
  }>;
}

/**
 * Hakee junadata GraphQL API:lla (41 KB vs 18 MB REST)
 */
async function fetchTrainDataGraphQL(): Promise<TrainWithLocation[]> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'Digitraffic-User': 'tilannekuva.online/1.0',
    },
    body: JSON.stringify({ query: GRAPHQL_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL API error: ${response.status}`);
  }

  const json = await response.json();
  const trains: GraphQLTrain[] = json.data?.currentlyRunningTrains ?? [];

  const result: TrainWithLocation[] = [];

  for (const train of trains) {
    const category = train.trainType.trainCategory.name as TrainCategory;

    // Suodata pois veturit ja vaihtotyöjunat
    if (category === 'Locomotive' || category === 'Shunting') continue;

    // Ohita junat ilman sijaintidataa
    if (!train.trainLocations.length) continue;

    const loc = train.trainLocations[0];

    result.push({
      trainNumber: train.trainNumber,
      departureDate: train.departureDate,
      trainType: train.trainType.name,
      trainCategory: category,
      commuterLineID: train.commuterLineid || undefined,
      lon: loc.location[0],
      lat: loc.location[1],
      speed: loc.speed,
      lateMinutes: train.timeTableRows[0]?.differenceInMinutes ?? 0,
      timestamp: loc.timestamp,
    });
  }

  console.log(`[Train] GraphQL: ${result.length} trains (from ${trains.length} running)`);
  return result;
}

/**
 * Fallback: hakee vain sijainnit REST API:lla (ilman viive/tyyppi-tietoja)
 */
async function fetchTrainLocationsOnly(): Promise<TrainWithLocation[]> {
  const response = await fetch(TRAIN_LOCATIONS_URL, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'Digitraffic-User': 'tilannekuva.online/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Train locations API error: ${response.status}`);
  }

  const locations = await response.json();
  const result: TrainWithLocation[] = [];

  for (const loc of locations) {
    result.push({
      trainNumber: loc.trainNumber,
      departureDate: loc.departureDate,
      trainType: 'Unknown',
      trainCategory: 'Long-distance',
      lat: loc.location.coordinates[1],
      lon: loc.location.coordinates[0],
      speed: loc.speed,
      lateMinutes: 0,
      timestamp: loc.timestamp,
    });
  }

  console.log(`[Train] REST fallback: ${result.length} trains (no type/delay info)`);
  return result;
}

/**
 * Hakee junadata: GraphQL ensin, fallback REST-lokaatioihin
 */
export async function fetchTrainData(): Promise<TrainWithLocation[]> {
  try {
    return await fetchTrainDataGraphQL();
  } catch (error) {
    console.warn('[Train] GraphQL failed, trying REST fallback:', error);
    return await fetchTrainLocationsOnly();
  }
}
