/**
 * AI Data Analyst - Tool Executor
 * Executes Claude tool_use calls: Supabase queries, GeoJSON building
 */

import { createClient } from '@supabase/supabase-js';
import { fetchMunicipalityBoundaries } from './municipality-boundaries';
import type {
  QueryMunicipalDataInput,
  QueryMunicipalDataOutput,
  CreateMapLayerInput,
  MapLayerArtifact,
  CreateInsightInput,
  InsightArtifact,
  CreateTableInput,
  TableArtifact,
  Artifact,
} from './types';

// Server-side Supabase client for data queries
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

/**
 * Execute a tool call and return the result + optional artifact
 */
export async function executeTool(
  toolName: string,
  input: unknown
): Promise<{ result: string; artifact?: Artifact }> {
  switch (toolName) {
    case 'query_municipal_data':
      return executeQueryMunicipalData(input as QueryMunicipalDataInput);
    case 'create_map_layer':
      return executeCreateMapLayer(input as CreateMapLayerInput);
    case 'create_insight':
      return executeCreateInsight(input as CreateInsightInput);
    case 'create_table':
      return executeCreateTable(input as CreateTableInput);
    default:
      return { result: `Unknown tool: ${toolName}` };
  }
}

// ============================================
// query_municipal_data
// ============================================

async function executeQueryMunicipalData(
  input: QueryMunicipalDataInput
): Promise<{ result: string }> {
  const supabase = getSupabase();
  const output: QueryMunicipalDataOutput = {};
  const debugInfo: string[] = [];

  for (const slug of input.datasets) {
    // 1. Look up dataset by slug
    const { data: dataset, error: dsError } = await supabase
      .from('datasets')
      .select('id')
      .eq('slug', slug)
      .single();

    if (dsError || !dataset) {
      debugInfo.push(`${slug}: dataset lookup failed: ${dsError?.message || 'not found'}`);
      output[slug] = [];
      continue;
    }

    debugInfo.push(`${slug}: dataset_id=${dataset.id}`);

    // 2. Query data_records (without year filter in SQL — vuosi is stored as number in JSONB)
    let query = supabase
      .from('data_records')
      .select('data')
      .eq('dataset_id', dataset.id)
      .order('record_key')
      .limit(1000);

    // Filter by municipality codes if specified
    if (input.municipalities && input.municipalities.length > 0) {
      query = query.in('data->>kunta_koodi', input.municipalities);
    }

    const { data: records, error: recError } = await query;

    if (recError || !records) {
      debugInfo.push(`${slug}: query error: ${recError?.message || 'null result'}`);
      output[slug] = [];
      continue;
    }

    // Map to typed records
    let filtered = records.map((r: { data: Record<string, unknown> }) => r.data as {
      kunta_koodi: string;
      kunta_nimi: string;
      vuosi: number;
      [key: string]: unknown;
    });

    // Filter by year in JS (avoids JSONB text/number type mismatch)
    if (input.year) {
      const yearNum = parseInt(input.year);
      filtered = filtered.filter((r) => r.vuosi === yearNum || String(r.vuosi) === input.year);
      debugInfo.push(`${slug}: ${records.length} total, ${filtered.length} after year=${input.year}`);
    } else {
      debugInfo.push(`${slug}: ${filtered.length} records (no year filter)`);
    }

    output[slug] = filtered;
  }

  const summary = Object.entries(output).map(([slug, rows]) => {
    return `${slug}: ${rows.length} kuntaa`;
  });

  return {
    result: JSON.stringify({
      summary: summary.join(', '),
      debug: debugInfo,
      data: output,
    }),
  };
}

// ============================================
// create_map_layer
// ============================================

async function executeCreateMapLayer(
  input: CreateMapLayerInput
): Promise<{ result: string; artifact: MapLayerArtifact }> {
  // Fetch municipality boundaries
  const boundaries = await fetchMunicipalityBoundaries(2024);

  // Build lookup from computed_data
  const dataLookup = new Map(
    input.computed_data.map((d) => [d.kunta_koodi, d])
  );

  // Compute quantile breaks for 5 bins
  const values = input.computed_data.map((d) => d.value).sort((a, b) => a - b);
  const breaks = [0.2, 0.4, 0.6, 0.8].map(
    (q) => values[Math.floor(values.length * q)] ?? 0
  );

  const colors = input.color_scale.length === 5
    ? input.color_scale
    : ['#2dc653', '#a3d977', '#f5e642', '#f59e42', '#e63946'];

  function getColorBin(value: number): number {
    for (let i = 0; i < breaks.length; i++) {
      if (value <= breaks[i]) return i;
    }
    return 4;
  }

  // Build GeoJSON with computed values joined to boundaries
  const features = boundaries.features
    .map((feature) => {
      const code = feature.properties.kunta;
      const computed = dataLookup.get(code);
      if (!computed) return null;

      return {
        type: 'Feature' as const,
        geometry: feature.geometry,
        properties: {
          kunta: code,
          nimi: feature.properties.nimi,
          value: computed.value,
          label: computed.label,
          colorBin: getColorBin(computed.value),
        },
      };
    })
    .filter(Boolean);

  // Generate legend labels
  const legendLabels = [
    `< ${breaks[0]?.toFixed(1)}`,
    `${breaks[0]?.toFixed(1)} - ${breaks[1]?.toFixed(1)}`,
    `${breaks[1]?.toFixed(1)} - ${breaks[2]?.toFixed(1)}`,
    `${breaks[2]?.toFixed(1)} - ${breaks[3]?.toFixed(1)}`,
    `> ${breaks[3]?.toFixed(1)}`,
  ];

  const artifact: MapLayerArtifact = {
    type: 'map_layer',
    id: `map-${Date.now()}`,
    title: input.title,
    geojson: {
      type: 'FeatureCollection',
      features: features as GeoJSON.Feature[],
    },
    colorScale: colors,
    legendLabels,
    style: {
      fillOpacity: 0.7,
      outlineColor: '#374151',
      outlineWidth: 1,
    },
    labelFormat: input.label_format,
  };

  return {
    result: `Karttatasoa "${input.title}" varten luotu ${features.length} kunnan choropleth. Käyttäjä voi nyt näyttää sen kartalla.`,
    artifact,
  };
}

// ============================================
// create_insight
// ============================================

async function executeCreateInsight(
  input: CreateInsightInput
): Promise<{ result: string; artifact: InsightArtifact }> {
  const artifact: InsightArtifact = {
    type: 'insight',
    id: `insight-${Date.now()}`,
    findings: input.findings,
    dataSources: input.data_sources,
  };

  return {
    result: `Luotu ${input.findings.length} avainlöydöstä.`,
    artifact,
  };
}

// ============================================
// create_table
// ============================================

async function executeCreateTable(
  input: CreateTableInput
): Promise<{ result: string; artifact: TableArtifact }> {
  const artifact: TableArtifact = {
    type: 'table',
    id: `table-${Date.now()}`,
    title: input.title,
    columns: input.columns,
    rows: input.rows,
    sortBy: input.sort_by,
    sortDirection: input.sort_direction,
  };

  return {
    result: `Luotu taulukko "${input.title}" (${input.rows.length} riviä).`,
    artifact,
  };
}
