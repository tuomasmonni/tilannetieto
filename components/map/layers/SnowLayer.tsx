'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { POLLING_INTERVALS } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection, EventDetails } from '@/lib/types';
import { loadMapIcons } from '@/lib/map-icons';

interface SnowLayerProps {
  map: MapboxMap;
  onEventSelect?: (event: EventDetails | null) => void;
}

const SOURCE_ID = 'snow-stations';
const CLUSTER_LAYER = 'snow-clusters';
const CLUSTER_COUNT_LAYER = 'snow-cluster-count';
const CIRCLES_LAYER = 'snow-circles';
const LABELS_LAYER = 'snow-labels';

export default function SnowLayer({ map, onEventSelect }: SnowLayerProps) {
  const { snow } = useUnifiedFilters();
  const [data, setData] = useState<EventFeatureCollection | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/snow');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: EventFeatureCollection = await response.json();
      setData(result);
      console.log(`Snow: ${result.features.length} stations loaded`);
    } catch (error) {
      console.error('Failed to fetch snow data:', error);
    }
  };

  // Init polling - only when layer is visible
  useEffect(() => {
    if (!snow.layerVisible) return;
    fetchData();
    intervalRef.current = setInterval(fetchData, POLLING_INTERVALS.snow);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [snow.layerVisible]);

  // Setup source & layers + update data (combined to avoid race condition)
  useEffect(() => {
    if (!map || !data) return;

    const setup = async () => {
      try {
        await loadMapIcons(map);
      } catch (error) {
        console.error('Failed to load snow icons:', error);
      }

      // Enrich data: extract snowDepth to top-level property for Mapbox expressions
      const enriched: EventFeatureCollection = {
        type: 'FeatureCollection',
        features: data.features.map(f => {
          let snowDepth = 0;
          try {
            const meta = typeof f.properties.metadata === 'string'
              ? JSON.parse(f.properties.metadata)
              : f.properties.metadata;
            snowDepth = meta?.snowDepth ?? 0;
          } catch { /* ignore */ }

          return {
            ...f,
            properties: {
              ...f.properties,
              snowDepth,
            },
          };
        }),
      };

      // Add or update source
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: enriched,
          cluster: true,
          clusterMaxZoom: 9,
          clusterRadius: 40,
        });
      } else {
        (map.getSource(SOURCE_ID) as any).setData(enriched);
      }

      // Add layers if not exist
      if (!map.getLayer(CLUSTER_LAYER)) {
        // Cluster circles
        map.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#a5f3fc',
            'circle-radius': [
              'step', ['get', 'point_count'],
              14, 10, 18, 50, 24,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.85,
          },
          layout: {
            'visibility': snow.layerVisible ? 'visible' : 'none',
          },
        });

        // Cluster count labels
        map.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'visibility': snow.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#0e7490',
          },
        });

        // Individual snow depth circles with color scale
        map.addLayer({
          id: CIRCLES_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              4, 4,
              8, 7,
              12, 10,
              16, 14,
            ],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['to-number', ['get', 'snowDepth'], 0],
              0, '#8B4513',    // ruskea
              10, '#D2B48C',   // beige
              30, '#E8E8E8',   // vaaleanharmaa
              50, '#FFFFFF',   // valkoinen
              80, '#87CEEB',   // vaaleansininen
              100, '#4169E1',  // kuninkaansininen
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.9,
          },
          layout: {
            'visibility': snow.layerVisible ? 'visible' : 'none',
          },
        });

        // Snow depth text labels (visible at zoom > 9)
        map.addLayer({
          id: LABELS_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['concat', ['to-string', ['get', 'snowDepth']], ' cm'],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 10,
            'text-offset': [0, 0],
            'text-allow-overlap': true,
            'visibility': snow.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#0e7490',
            'text-halo-color': '#fff',
            'text-halo-width': 1.5,
          },
          minzoom: 9,
        });

        // Click handler for clusters -> zoom in
        map.on('click', CLUSTER_LAYER, (e: any) => {
          const features = e.features;
          if (!features?.length) return;
          const clusterId = features[0].properties.cluster_id;
          const source = map.getSource(SOURCE_ID) as any;
          source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom + 0.5,
              duration: 500,
            });
          });
        });

        // Click handler for circles -> event details
        map.on('click', CIRCLES_LAYER, (e: any) => {
          const features = e.features;
          if (!features?.length) return;
          const props = features[0].properties;

          let metadata = props.metadata;
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch { metadata = undefined; }
          }

          onEventSelect?.({
            id: props.id,
            type: props.type,
            category: props.category,
            title: props.title,
            description: props.description || '',
            locationName: props.locationName || '',
            timestamp: props.timestamp,
            severity: props.severity,
            source: props.source || 'FMI',
            metadata,
            screenPosition: { x: e.point.x, y: e.point.y },
          });
        });

        // Cursor styles
        map.on('mouseenter', CIRCLES_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', CIRCLES_LAYER, () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ''; });
      }
    };

    setup();
  }, [map, data, snow.layerVisible, onEventSelect]);

  // Visibility control
  useEffect(() => {
    if (!map) return;
    const vis = snow.layerVisible ? 'visible' : 'none';
    [CLUSTER_LAYER, CLUSTER_COUNT_LAYER, CIRCLES_LAYER, LABELS_LAYER].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', vis);
      }
    });
  }, [map, snow.layerVisible]);

  return null;
}
