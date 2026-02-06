'use client';

import { useEffect, useState, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { UnemploymentMapGeoJSON } from '@/lib/data/unemployment/api';

const CATEGORY_COLORS: Record<string, string> = {
  low: '#c6efce',
  medium: '#ffeb9c',
  high: '#ffc7ce',
  very_high: '#ff6b6b',
};

const SOURCE_ID = 'unemployment-municipalities';
const FILL_LAYER = 'unemployment-fill';
const OUTLINE_LAYER = 'unemployment-outline';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Props {
  map: mapboxgl.Map | null;
}

export function UnemploymentLayer({ map }: Props) {
  const { unemployment, setUnemploymentLoading } = useUnifiedFilters();
  const { year, layerVisible, displayMode } = unemployment;
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<UnemploymentMapGeoJSON | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredStateId = useRef<string | null>(null);

  const debouncedYear = useDebounce(year, 300);

  // Fetch data
  useEffect(() => {
    if (!layerVisible) return;

    const loadData = async () => {
      try {
        setUnemploymentLoading(true);
        const res = await fetch(`/api/unemployment?year=${debouncedYear}&mode=${displayMode}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch unemployment data:', err);
      } finally {
        setUnemploymentLoading(false);
      }
    };

    loadData();
  }, [debouncedYear, displayMode, layerVisible, setUnemploymentLoading]);

  // Add/update map layer
  useEffect(() => {
    if (!map || !data) return;

    const addLayer = () => {
      try {
        const existingSource = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(data as GeoJSON.FeatureCollection);
          return;
        }

        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: data as GeoJSON.FeatureCollection,
          generateId: true,
        });

        map.addLayer({
          id: FILL_LAYER,
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': [
              'match', ['get', 'category'],
              'low', CATEGORY_COLORS.low,
              'medium', CATEGORY_COLORS.medium,
              'high', CATEGORY_COLORS.high,
              'very_high', CATEGORY_COLORS.very_high,
              '#808080'
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.9, 0.7
            ],
          },
        });

        map.addLayer({
          id: OUTLINE_LAYER,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#1f2937', '#d1d5db'
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              2.5, 1
            ],
          },
        });

        setLoaded(true);
      } catch (err) {
        console.error('Failed to add unemployment layer:', err);
      }
    };

    if (map.isStyleLoaded()) addLayer();
    else map.once('load', addLayer);
  }, [map, data]);

  // Hover + tooltip
  useEffect(() => {
    if (!map || !loaded) return;

    const mapboxgl = require('mapbox-gl');
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'stat-tooltip' });
    popupRef.current = popup;

    const onMouseMove = (e: any) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
      const props = feature.properties;
      const featureId = feature.id;

      if (hoveredStateId.current !== null && hoveredStateId.current !== featureId) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredStateId.current } as any, { hover: false });
      }
      if (featureId !== undefined) {
        hoveredStateId.current = featureId;
        map.setFeatureState({ source: SOURCE_ID, id: featureId } as any, { hover: true });
      }

      const rate = props?.unemploymentRate;
      const displayValue = displayMode === 'perCapita' && rate != null
        ? `${rate.toFixed(1)} %`
        : `${(props?.unemployed || 0).toLocaleString('fi-FI')} työtöntä`;

      const html = `
        <div class="backdrop-blur-md bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 min-w-[180px]">
          <div class="font-semibold text-sm">${props?.nimi || 'Tuntematon'}</div>
          <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
            <span class="font-medium text-gray-900 dark:text-gray-100">${displayValue}</span>
          </div>
          <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Vuosi ${props?.year || year}</div>
        </div>
      `;

      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      map.getCanvas().style.cursor = 'pointer';
    };

    const onMouseLeave = () => {
      if (hoveredStateId.current !== null) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredStateId.current } as any, { hover: false });
      }
      hoveredStateId.current = null;
      popup.remove();
      map.getCanvas().style.cursor = '';
    };

    map.on('mousemove', FILL_LAYER, onMouseMove);
    map.on('mouseleave', FILL_LAYER, onMouseLeave);

    return () => {
      map.off('mousemove', FILL_LAYER, onMouseMove);
      map.off('mouseleave', FILL_LAYER, onMouseLeave);
      popup.remove();
    };
  }, [map, loaded, year, displayMode]);

  // Visibility
  useEffect(() => {
    if (!map || !loaded) return;
    const visibility = layerVisible ? 'visible' : 'none';
    for (const id of [FILL_LAYER, OUTLINE_LAYER]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility);
    }
  }, [map, layerVisible, loaded]);

  return null;
}

export default UnemploymentLayer;
