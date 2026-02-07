/**
 * Fingrid API Client
 *
 * Reaaliaikainen sähköntuotanto- ja kulutusdata Suomessa.
 * API: https://data.fingrid.fi/api/
 * Rate limit: 10 000 req/24h, 10 req/min
 */

const FINGRID_API_BASE = 'https://data.fingrid.fi/api';

export interface FingridDataPoint {
  startTime: string;
  endTime: string;
  value: number;
  datasetId: number;
}

export interface FingridResponse {
  data: FingridDataPoint[];
  pagination?: {
    total: number;
    lastPage: number;
    prevPage: number | null;
    nextPage: number | null;
    perPage: number;
    currentPage: number;
    from: number;
    to: number;
  };
}

/** Fingridin keskeiset datasetit */
export const FINGRID_DATASETS = {
  production: { id: 192, label: 'Sähköntuotanto', unit: 'MW', color: '#22c55e' },
  consumption: { id: 124, label: 'Sähkönkulutus', unit: 'MW', color: '#ef4444' },
  wind: { id: 75, label: 'Tuulivoima', unit: 'MW', color: '#06b6d4' },
  nuclear: { id: 188, label: 'Ydinvoima', unit: 'MW', color: '#f59e0b' },
  hydro: { id: 123, label: 'Vesivoima', unit: 'MW', color: '#3b82f6' },
  surplus: { id: 198, label: 'Yli-/alijäämä', unit: 'MW', color: '#8b5cf6' },
  windForecast: { id: 245, label: 'Tuulivoimaennuste', unit: 'MWh/h', color: '#67e8f9' },
  // Rajasiirrot
  transferFiSe1: { id: 87, label: 'FI↔SE1', unit: 'MW', color: '#facc15' },
  transferFiSe3: { id: 89, label: 'FI↔SE3', unit: 'MW', color: '#facc15' },
  transferFiEe:  { id: 180, label: 'FI↔EE', unit: 'MW', color: '#facc15' },
  transferFiNo:  { id: 187, label: 'FI↔NO', unit: 'MW', color: '#facc15' },
} as const;

export type FingridDatasetKey = keyof typeof FINGRID_DATASETS;

export interface CrossBorderTransfer {
  connection: string;  // 'FI-SE1' | 'FI-SE3' | 'FI-EE' | 'FI-NO'
  value: number;       // MW (positiivinen = vienti, negatiivinen = tuonti)
  timestamp: string;
}

export interface EnergyOverview {
  production: number;
  consumption: number;
  wind: number;
  nuclear: number;
  hydro: number;
  surplus: number;
  other: number;
  transfers: CrossBorderTransfer[];
  timestamp: string;
  fetchedAt: string;
}

/**
 * Hae viimeisin datapiste yhdestä datasetistä
 */
export async function fetchLatestDatapoint(
  datasetId: number,
  apiKey: string
): Promise<FingridDataPoint | null> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const params = new URLSearchParams({
    startTime: oneHourAgo.toISOString(),
    endTime: now.toISOString(),
    format: 'json',
    pageSize: '1',
    sortOrder: 'desc',
  });

  const url = `${FINGRID_API_BASE}/datasets/${datasetId}/data?${params}`;

  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json',
    },
    cache: 'no-store', // Ei ISR-cachea — route-tason Cache-Control hoitaa
  });

  if (!response.ok) {
    console.error(`Fingrid API error for dataset ${datasetId}: ${response.status} ${response.statusText}`);
    return null;
  }

  const result: FingridResponse = await response.json();
  return result.data?.[0] || null;
}

/**
 * Hae kaikkien keskeisten datasettien viimeisimmät arvot
 */
export async function fetchEnergyOverview(apiKey: string): Promise<EnergyOverview | null> {
  const datasetIds = {
    production: FINGRID_DATASETS.production.id,
    consumption: FINGRID_DATASETS.consumption.id,
    wind: FINGRID_DATASETS.wind.id,
    nuclear: FINGRID_DATASETS.nuclear.id,
    hydro: FINGRID_DATASETS.hydro.id,
    surplus: FINGRID_DATASETS.surplus.id,
  };

  const transferDatasets = [
    { key: 'FI-SE1', id: FINGRID_DATASETS.transferFiSe1.id },
    { key: 'FI-SE3', id: FINGRID_DATASETS.transferFiSe3.id },
    { key: 'FI-EE',  id: FINGRID_DATASETS.transferFiEe.id },
    { key: 'FI-NO',  id: FINGRID_DATASETS.transferFiNo.id },
  ];

  // Hae sarjassa viiveellä (Fingrid rate limit: 10 req/min, burst ~1/s)
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const values: Record<string, number> = {};
  let latestTimestamp = '';

  const entries = Object.entries(datasetIds);
  for (let i = 0; i < entries.length; i++) {
    const [key, id] = entries[i];
    if (i > 0) await delay(3000);
    try {
      const point = await fetchLatestDatapoint(id, apiKey);
      values[key] = point?.value ?? 0;
      if (point?.startTime && point.startTime > latestTimestamp) {
        latestTimestamp = point.startTime;
      }
    } catch {
      values[key] = 0;
    }
  }

  const transfers: CrossBorderTransfer[] = [];
  for (let i = 0; i < transferDatasets.length; i++) {
    const { key, id } = transferDatasets[i];
    await delay(3000);
    try {
      const point = await fetchLatestDatapoint(id, apiKey);
      transfers.push({
        connection: key,
        value: point?.value ?? 0,
        timestamp: point?.startTime ?? '',
      });
    } catch {
      transfers.push({ connection: key, value: 0, timestamp: '' });
    }
  }

  const production = values.production ?? 0;
  const wind = values.wind ?? 0;
  const nuclear = values.nuclear ?? 0;
  const hydro = values.hydro ?? 0;
  const other = Math.max(0, production - wind - nuclear - hydro);

  return {
    production,
    consumption: values.consumption ?? 0,
    wind,
    nuclear,
    hydro,
    surplus: values.surplus ?? 0,
    other,
    transfers,
    timestamp: latestTimestamp,
    fetchedAt: new Date().toISOString(),
  };
}
