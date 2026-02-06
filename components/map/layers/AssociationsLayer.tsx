'use client';

import { useEffect, useState, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

interface AssociationsLayerProps {
  map: mapboxgl.Map | null;
}

// Sininen väriskaala (kvantiili)
const CATEGORY_COLORS: Record<string, string> = {
  low: '#dbeafe',
  medium: '#93c5fd',
  high: '#3b82f6',
  very_high: '#1e3a5f',
};

export function AssociationsLayer({ map }: AssociationsLayerProps) {
  const { associations } = useUnifiedFilters();
  const { layerVisible, displayMode } = associations;
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredStateId = useRef<string | null>(null);

  // Hae data kun displayMode muuttuu
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/associations?displayMode=${displayMode}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const geojson = await res.json();
        setData(geojson);
      } catch (err) {
        console.error('Failed to fetch associations data:', err);
      }
    };

    loadData();
  }, [displayMode]);

  // Lisää kerros kartalle
  useEffect(() => {
    if (!map || !data) return;

    const addLayer = () => {
      try {
        const existingSource = map.getSource('associations-municipalities') as mapboxgl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(data);
          return;
        }

        map.addSource('associations-municipalities', {
          type: 'geojson',
          data,
          generateId: true,
        });

        map.addLayer({
          id: 'associations-fill',
          type: 'fill',
          source: 'associations-municipalities',
          paint: {
            'fill-color': [
              'match',
              ['get', 'category'],
              'low', CATEGORY_COLORS.low,
              'medium', CATEGORY_COLORS.medium,
              'high', CATEGORY_COLORS.high,
              'very_high', CATEGORY_COLORS.very_high,
              '#808080',
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.9,
              0.7,
            ],
          },
        });

        map.addLayer({
          id: 'associations-outline',
          type: 'line',
          source: 'associations-municipalities',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#1f2937',
              '#d1d5db',
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              2.5,
              1,
            ],
          },
        });

        setLoaded(true);
      } catch (err) {
        console.error('Failed to add associations layer:', err);
      }
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('load', addLayer);
    }
  }, [map, data]);

  // Päivitä data
  useEffect(() => {
    if (!map || !data || !loaded) return;
    const source = map.getSource('associations-municipalities') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(data);
    }
  }, [map, data, loaded]);

  // Hover + tooltip
  useEffect(() => {
    if (!map || !loaded) return;

    const mapboxgl = require('mapbox-gl');
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'associations-tooltip',
    });
    popupRef.current = popup;

    const onMouseMove = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties;
      const featureId = feature.id;

      if (hoveredStateId.current !== null && hoveredStateId.current !== featureId) {
        map.setFeatureState(
          { source: 'associations-municipalities', id: hoveredStateId.current } as any,
          { hover: false }
        );
      }
      if (featureId !== undefined) {
        hoveredStateId.current = featureId;
        map.setFeatureState(
          { source: 'associations-municipalities', id: featureId } as any,
          { hover: true }
        );
      }

      const total = props.total?.toLocaleString('fi-FI') || '0';
      const perCapita = props.perCapita !== undefined && props.perCapita !== null
        ? `${props.perCapita} / 1000 as.`
        : '';

      const html = `
        <div class="backdrop-blur-md bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 min-w-[180px]">
          <div class="font-semibold text-sm">${props.nimi || 'Tuntematon'}</div>
          <div class="text-xs mt-1.5">
            <span class="font-medium">${total} yhdistystä</span>
          </div>
          ${perCapita ? `<div class="text-xs text-gray-500 mt-0.5">${perCapita}</div>` : ''}
          <div class="text-[10px] text-gray-400 mt-1">Lähde: PRH</div>
        </div>
      `;

      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      map.getCanvas().style.cursor = 'pointer';
    };

    const onMouseLeave = () => {
      if (hoveredStateId.current !== null) {
        map.setFeatureState(
          { source: 'associations-municipalities', id: hoveredStateId.current } as any,
          { hover: false }
        );
      }
      hoveredStateId.current = null;
      popup.remove();
      map.getCanvas().style.cursor = '';
    };

    map.on('mousemove', 'associations-fill', onMouseMove);
    map.on('mouseleave', 'associations-fill', onMouseLeave);

    return () => {
      map.off('mousemove', 'associations-fill', onMouseMove);
      map.off('mouseleave', 'associations-fill', onMouseLeave);
      popup.remove();
    };
  }, [map, loaded, displayMode]);

  // Näkyvyys
  useEffect(() => {
    if (!map || !loaded) return;
    const visibility = layerVisible ? 'visible' : 'none';
    for (const layerId of ['associations-fill', 'associations-outline']) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }
  }, [map, layerVisible, loaded]);

  return null;
}

export default AssociationsLayer;
