/**
 * Rata.digitraffic.fi - Junaseuranta
 * Hakee reaaliaikaiset junasijainnit ja junatiedot
 */

const TRAIN_LOCATIONS_URL = 'https://rata.digitraffic.fi/api/v1/train-locations/latest';
const TRAINS_URL = 'https://rata.digitraffic.fi/api/v1/trains';

export type TrainCategory = 'Long-distance' | 'Commuter' | 'Cargo' | 'Locomotive' | 'Shunting';

export interface RataTrainLocation {
  trainNumber: number;
  departureDate: string;
  timestamp: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  speed: number;
}

export interface RataTrainInfo {
  trainNumber: number;
  departureDate: string;
  trainType: string; // IC, S, PYO, HDM, MUS, etc.
  trainCategory: TrainCategory;
  commuterLineID?: string; // A, E, I, K, etc.
  timetableRows: Array<{
    stationShortCode: string;
    type: 'ARRIVAL' | 'DEPARTURE';
    scheduledTime: string;
    liveEstimateTime?: string;
    actualTime?: string;
    differenceInMinutes?: number;
  }>;
}

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

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Hakee viimeiset junasijainnit
 */
async function fetchTrainLocations(): Promise<RataTrainLocation[]> {
  const response = await fetch(TRAIN_LOCATIONS_URL, {
    headers: {
      'Accept-Encoding': 'gzip',
      'Digitraffic-User': 'tilannekuva.online/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Train locations API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Hakee junatiedot (tyyppi, viive)
 */
async function fetchTrainInfo(): Promise<RataTrainInfo[]> {
  const date = getToday();
  const response = await fetch(`${TRAINS_URL}/${date}`, {
    headers: {
      'Accept-Encoding': 'gzip',
      'Digitraffic-User': 'tilannekuva.online/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Train info API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Laske junan viive viimeisen timetableRow differenceInMinutes -kentästä
 */
function calculateDelay(train: RataTrainInfo): number {
  const rows = train.timetableRows;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].differenceInMinutes !== undefined) {
      return rows[i].differenceInMinutes!;
    }
  }
  return 0;
}

/**
 * Hakee ja yhdistää junadata: sijainti + tyyppi + viive
 */
export async function fetchTrainData(): Promise<TrainWithLocation[]> {
  const [locations, trainInfos] = await Promise.all([
    fetchTrainLocations(),
    fetchTrainInfo(),
  ]);

  // Luo lookup map junatiedoille
  const trainInfoMap = new Map<string, RataTrainInfo>();
  for (const train of trainInfos) {
    trainInfoMap.set(`${train.trainNumber}-${train.departureDate}`, train);
  }

  const result: TrainWithLocation[] = [];

  for (const loc of locations) {
    const key = `${loc.trainNumber}-${loc.departureDate}`;
    const info = trainInfoMap.get(key);

    // Suodata pois junat joiden tietoja ei löydy
    if (!info) continue;

    // Suodata pois veturit ja vaihtotyöjunat
    if (info.trainCategory === 'Locomotive' || info.trainCategory === 'Shunting') continue;

    result.push({
      trainNumber: loc.trainNumber,
      departureDate: loc.departureDate,
      trainType: info.trainType,
      trainCategory: info.trainCategory,
      commuterLineID: info.commuterLineID,
      lat: loc.location.coordinates[1],
      lon: loc.location.coordinates[0],
      speed: loc.speed,
      lateMinutes: calculateDelay(info),
      timestamp: loc.timestamp,
    });
  }

  console.log(`[Train] ${result.length} trains with location (from ${locations.length} locations, ${trainInfos.length} trains)`);
  return result;
}
