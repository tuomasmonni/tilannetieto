'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EnergyOverview, CrossBorderTransfer } from '@/lib/data/fingrid/client';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface EnergyTransferLayerProps {
  map: MapboxMap;
}

const REFRESH_INTERVAL = 300_000; // 5 min

// Rajayhteyksien koordinaatit [lng, lat]: Suomen pää → toisen maan pää
const CONNECTIONS: Record<string, { fi: [number, number]; foreign: [number, number]; label: string }> = {
  'FI-SE1': { fi: [24.6, 65.9], foreign: [23.7, 65.8], label: 'SE1' },
  'FI-SE3': { fi: [21.51, 61.13], foreign: [18.13, 60.41], label: 'SE3' },
  'FI-EE':  { fi: [24.95, 60.3], foreign: [24.55, 59.4], label: 'EE' },
  'FI-NO':  { fi: [27.02, 69.07], foreign: [28.05, 70.07], label: 'NO' },
};

const SOURCE_PREFIX = 'energy-transfer';
const LAYER_LINE_PREFIX = 'energy-transfer-line';
const LAYER_LABEL_PREFIX = 'energy-transfer-label';

function buildLineGeoJSON(
  transfer: CrossBorderTransfer,
  conn: { fi: [number, number]; foreign: [number, number] }
): GeoJSON.FeatureCollection {
  const isExport = transfer.value >= 0;
  const from = isExport ? conn.fi : conn.foreign;
  const to = isExport ? conn.foreign : conn.fi;

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [from, to] },
    }],
  };
}

function buildLabelGeoJSON(
  transfer: CrossBorderTransfer,
  conn: { fi: [number, number]; foreign: [number, number]; label: string }
): GeoJSON.FeatureCollection {
  const mid: [number, number] = [
    (conn.fi[0] + conn.foreign[0]) / 2,
    (conn.fi[1] + conn.foreign[1]) / 2,
  ];
  const isExport = transfer.value >= 0;
  const arrow = isExport ? '→' : '←';

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        label: `${conn.label} ${arrow} ${Math.abs(Math.round(transfer.value))} MW`,
      },
      geometry: { type: 'Point', coordinates: mid },
    }],
  };
}

export default function EnergyTransferLayer({ map }: EnergyTransferLayerProps) {
  const { energy } = useUnifiedFilters();
  const isPageVisible = usePageVisibility();
  const [transfers, setTransfers] = useState<CrossBorderTransfer[]>([]);
  const layersAdded = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/fingrid');
      if (!res.ok) return;
      const data: EnergyOverview = await res.json();
      if (data.transfers && data.transfers.length > 0) {
        setTransfers(data.transfers);
      }
    } catch {
      // silent — EnergyWidget shows errors
    }
  }, []);

  // Polling - only when visible and page active
  useEffect(() => {
    if (!energy.layerVisible || !isPageVisible) return;
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [energy.layerVisible, isPageVisible, fetchData]);

  // Map sources & layers
  useEffect(() => {
    if (!map) return;

    // Cleanup when hidden or no data
    if (!energy.layerVisible || transfers.length === 0) {
      if (layersAdded.current) {
        removeLayers(map);
        layersAdded.current = false;
      }
      return;
    }

    const addLayers = () => {
      try {
        for (const transfer of transfers) {
          const conn = CONNECTIONS[transfer.connection];
          if (!conn) continue;

          const srcLine = `${SOURCE_PREFIX}-line-${transfer.connection}`;
          const srcLabel = `${SOURCE_PREFIX}-label-${transfer.connection}`;
          const layLine = `${LAYER_LINE_PREFIX}-${transfer.connection}`;
          const layLabel = `${LAYER_LABEL_PREFIX}-${transfer.connection}`;

          const absVal = Math.abs(transfer.value);
          const lineWidth = Math.max(3, Math.min(10, 3 + (absVal / 1500) * 7));
          const isExport = transfer.value >= 0;
          const lineColor = isExport ? '#22c55e' : '#ef4444';

          const lineData = buildLineGeoJSON(transfer, conn);
          const labelData = buildLabelGeoJSON(transfer, conn);

          if (map.getSource(srcLine)) {
            (map.getSource(srcLine) as GeoJSONSource).setData(lineData);
            (map.getSource(srcLabel) as GeoJSONSource).setData(labelData);
            map.setPaintProperty(layLine, 'line-color', lineColor);
            map.setPaintProperty(layLine, 'line-width', lineWidth);
          } else {
            map.addSource(srcLine, { type: 'geojson', data: lineData });
            map.addSource(srcLabel, { type: 'geojson', data: labelData });

            map.addLayer({
              id: layLine,
              type: 'line',
              source: srcLine,
              paint: {
                'line-color': lineColor,
                'line-width': lineWidth,
                'line-opacity': 0.9,
                'line-dasharray': [0, 2, 1],
              },
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
            });

            map.addLayer({
              id: layLabel,
              type: 'symbol',
              source: srcLabel,
              layout: {
                'text-field': ['get', 'label'],
                'text-size': 13,
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-allow-overlap': true,
                'text-ignore-placement': true,
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': 'rgba(0,0,0,0.85)',
                'text-halo-width': 2,
              },
            });
          }
        }
        layersAdded.current = true;
      } catch (err) {
        console.error('EnergyTransferLayer: failed to add layers', err);
      }
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('style.load', addLayers);
    }

    return () => {
      removeLayers(map);
      layersAdded.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, energy.layerVisible, transfers]);

  return null;
}

function removeLayers(map: MapboxMap) {
  if (!map) return;
  for (const connKey of Object.keys(CONNECTIONS)) {
    const layLine = `${LAYER_LINE_PREFIX}-${connKey}`;
    const layLabel = `${LAYER_LABEL_PREFIX}-${connKey}`;
    const srcLine = `${SOURCE_PREFIX}-line-${connKey}`;
    const srcLabel = `${SOURCE_PREFIX}-label-${connKey}`;
    try {
      if (map.getLayer(layLabel)) map.removeLayer(layLabel);
      if (map.getLayer(layLine)) map.removeLayer(layLine);
      if (map.getSource(srcLine)) map.removeSource(srcLine);
      if (map.getSource(srcLabel)) map.removeSource(srcLabel);
    } catch {
      // Map might be destroyed
    }
  }
}
