'use client';

import { useEffect, useState, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

interface ElectionLayerProps {
  map: mapboxgl.Map | null;
}

// Puolueiden värit
const PARTY_COLORS: Record<string, string> = {
  KOK: '#006288',
  PS: '#FFD700',
  SDP: '#E11931',
  KESK: '#00A651',
  VIHR: '#61BF1A',
  VAS: '#F00A64',
  RKP: '#FFDD00',
  KD: '#1B3E94',
  OTHER: '#6b7280',
};

export function ElectionLayer({ map }: ElectionLayerProps) {
  const { election } = useUnifiedFilters();
  const { year, layerVisible } = election;
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredStateId = useRef<string | null>(null);

  // Hae data kun vuosi muuttuu
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/election?year=${year}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const geojson = await res.json();
        setData(geojson);
      } catch (err) {
        console.error('Failed to fetch election data:', err);
      }
    };

    loadData();
  }, [year]);

  // Lisää kerros kartalle
  useEffect(() => {
    if (!map || !data) return;

    const addLayer = () => {
      try {
        const existingSource = map.getSource('election-municipalities') as mapboxgl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(data);
          return;
        }

        map.addSource('election-municipalities', {
          type: 'geojson',
          data,
          generateId: true,
        });

        // Match-expression puolueväreille
        const colorExpression: any[] = ['match', ['get', 'category']];
        for (const [code, color] of Object.entries(PARTY_COLORS)) {
          colorExpression.push(code, color);
        }
        colorExpression.push('#808080'); // default

        map.addLayer({
          id: 'election-fill',
          type: 'fill',
          source: 'election-municipalities',
          paint: {
            'fill-color': colorExpression as any,
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.9,
              0.7,
            ],
          },
        });

        map.addLayer({
          id: 'election-outline',
          type: 'line',
          source: 'election-municipalities',
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
        console.error('Failed to add election layer:', err);
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
    const source = map.getSource('election-municipalities') as mapboxgl.GeoJSONSource;
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
      className: 'election-tooltip',
    });
    popupRef.current = popup;

    const onMouseMove = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties;
      const featureId = feature.id;

      if (hoveredStateId.current !== null && hoveredStateId.current !== featureId) {
        map.setFeatureState(
          { source: 'election-municipalities', id: hoveredStateId.current } as any,
          { hover: false }
        );
      }
      if (featureId !== undefined) {
        hoveredStateId.current = featureId;
        map.setFeatureState(
          { source: 'election-municipalities', id: featureId } as any,
          { hover: true }
        );
      }

      // Parsii puoluetulokset
      let partyRows = '';
      try {
        const results = JSON.parse(props.partyResults || '[]');
        partyRows = results.slice(0, 4).map((r: any) => {
          const color = PARTY_COLORS[r.code] || '#808080';
          return `<div class="flex items-center gap-1.5">
            <span style="background:${color}" class="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"></span>
            <span class="flex-1">${r.name}</span>
            <span class="font-medium">${r.share.toFixed(1)}%</span>
          </div>`;
        }).join('');
      } catch { /* ignore */ }

      const html = `
        <div class="backdrop-blur-md bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 min-w-[200px]">
          <div class="font-semibold text-sm">${props.nimi || 'Tuntematon'}</div>
          <div class="text-xs text-gray-500 mt-0.5">Vaalit ${props.year}</div>
          <div class="mt-2 space-y-1 text-xs">${partyRows}</div>
          <div class="text-[10px] text-gray-400 mt-1.5">Äänestysaktiivisuus ${props.turnout}%</div>
        </div>
      `;

      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      map.getCanvas().style.cursor = 'pointer';
    };

    const onMouseLeave = () => {
      if (hoveredStateId.current !== null) {
        map.setFeatureState(
          { source: 'election-municipalities', id: hoveredStateId.current } as any,
          { hover: false }
        );
      }
      hoveredStateId.current = null;
      popup.remove();
      map.getCanvas().style.cursor = '';
    };

    map.on('mousemove', 'election-fill', onMouseMove);
    map.on('mouseleave', 'election-fill', onMouseLeave);

    return () => {
      map.off('mousemove', 'election-fill', onMouseMove);
      map.off('mouseleave', 'election-fill', onMouseLeave);
      popup.remove();
    };
  }, [map, loaded, year]);

  // Näkyvyys
  useEffect(() => {
    if (!map || !loaded) return;
    const visibility = layerVisible ? 'visible' : 'none';
    for (const layerId of ['election-fill', 'election-outline']) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }
  }, [map, layerVisible, loaded]);

  return null;
}

export default ElectionLayer;
