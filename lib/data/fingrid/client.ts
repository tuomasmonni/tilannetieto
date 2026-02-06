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
} as const;

export type FingridDatasetKey = keyof typeof FINGRID_DATASETS;

export interface EnergyOverview {
  production: number;
  consumption: number;
  wind: number;
  nuclear: number;
  hydro: number;
  surplus: number;
  other: number;
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
    next: { revalidate: 300 }, // 5 min ISR cache
  });

  if (!response.ok) {
    console.error(`Fingrid API error for dataset ${datasetId}: ${response.status}`);
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

  // Hae kaikki rinnakkain
  const results = await Promise.allSettled(
    Object.entries(datasetIds).map(async ([key, id]) => {
      const point = await fetchLatestDatapoint(id, apiKey);
      return { key, value: point?.value ?? 0, timestamp: point?.startTime ?? '' };
    })
  );

  const values: Record<string, number> = {};
  let latestTimestamp = '';

  for (const result of results) {
    if (result.status === 'fulfilled') {
      values[result.value.key] = result.value.value;
      if (result.value.timestamp > latestTimestamp) {
        latestTimestamp = result.value.timestamp;
      }
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
    timestamp: latestTimestamp,
    fetchedAt: new Date().toISOString(),
  };
}
