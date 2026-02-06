'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { POLLING_INTERVALS } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection, EventDetails } from '@/lib/types';
import { loadMapIcons } from '@/lib/map-icons';

interface TrainLayerProps {
  map: MapboxMap;
  onEventSelect?: (event: EventDetails | null) => void;
}

const SOURCE_ID = 'train-locations';
const CLUSTER_LAYER = 'train-clusters';
const CLUSTER_COUNT_LAYER = 'train-cluster-count';
const ICONS_LAYER = 'train-icons';

export default function TrainLayer({ map, onEventSelect }: TrainLayerProps) {
  const { train } = useUnifiedFilters();
  const [allData, setAllData] = useState<EventFeatureCollection | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/train');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: EventFeatureCollection = await response.json();
      setAllData(result);
    } catch (error) {
      console.error('Failed to fetch train data:', error);
    }
  };

  // Init polling - only when layer is visible
  useEffect(() => {
    if (!train.layerVisible) return;
    fetchData();
    intervalRef.current = setInterval(fetchData, POLLING_INTERVALS.trains);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [train.layerVisible]);

  // Setup source & layers
  useEffect(() => {
    if (!map) return;

    const setup = async () => {
      try {
        await loadMapIcons(map);
      } catch (error) {
        console.error('Failed to load train icons:', error);
      }

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 10,
          clusterRadius: 50,
        });
      }

      if (!map.getLayer(CLUSTER_LAYER)) {
        map.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#22c55e',
            'circle-radius': [
              'step', ['get', 'point_count'],
              14, 10, 18, 50, 24,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.85,
          },
          layout: {
            'visibility': train.layerVisible ? 'visible' : 'none',
          },
        });

        map.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'visibility': train.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        map.addLayer({
          id: ICONS_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'event-train',
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              4, 0.2,
              8, 0.35,
              12, 0.55,
              16, 0.75,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'visibility': train.layerVisible ? 'visible' : 'none',
          },
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

        // Click handler for icons -> event details
        map.on('click', ICONS_LAYER, (e: any) => {
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
            source: props.source || 'Fintraffic',
            metadata,
            screenPosition: { x: e.point.x, y: e.point.y },
          });
        });

        // Cursor styles
        map.on('mouseenter', ICONS_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', ICONS_LAYER, () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ''; });
      }
    };

    if (map.isStyleLoaded()) {
      setup();
    } else {
      map.on('load', setup);
    }
  }, [map, onEventSelect]);

  // Update data + filter by train type
  useEffect(() => {
    if (!map || !allData) return;

    const source = map.getSource(SOURCE_ID);
    if (!source || !('setData' in source)) return;

    // Filter by selected train types
    const filtered: EventFeatureCollection = {
      type: 'FeatureCollection',
      features: allData.features.filter(f => {
        if (!f.properties.metadata) return true;
        try {
          const meta = typeof f.properties.metadata === 'string'
            ? JSON.parse(f.properties.metadata)
            : f.properties.metadata;
          return train.trainTypes.includes(meta.trainType);
        } catch {
          return true;
        }
      }),
    };

    source.setData(filtered);
  }, [map, allData, train.trainTypes]);

  // Visibility control
  useEffect(() => {
    if (!map) return;
    const vis = train.layerVisible ? 'visible' : 'none';
    [CLUSTER_LAYER, CLUSTER_COUNT_LAYER, ICONS_LAYER].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', vis);
      }
    });
  }, [map, train.layerVisible]);

  return null;
}
