'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { POLLING_INTERVALS } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection, EventDetails } from '@/lib/types';
import { loadMapIcons } from '@/lib/map-icons';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface WeatherLayerProps {
  map: MapboxMap;
  onEventSelect?: (event: EventDetails | null) => void;
}

const SOURCE_ID = 'weather-stations';
const CLUSTER_LAYER = 'weather-clusters';
const CLUSTER_COUNT_LAYER = 'weather-cluster-count';
const ICONS_LAYER = 'weather-icons';

export default function WeatherLayer({ map, onEventSelect }: WeatherLayerProps) {
  const { weather } = useUnifiedFilters();
  const isPageVisible = usePageVisibility();
  const [data, setData] = useState<EventFeatureCollection | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/weather');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: EventFeatureCollection = await response.json();
      setData(result);
      console.log(`Weather: ${result.features.length} stations loaded`);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  // Init polling - only when layer is visible and page is active
  useEffect(() => {
    if (!weather.layerVisible || !isPageVisible) return;
    fetchData();
    intervalRef.current = setInterval(fetchData, POLLING_INTERVALS.weather);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [weather.layerVisible, isPageVisible]);

  // Setup source & layers + update data
  useEffect(() => {
    if (!map || !data) return;

    const setup = async () => {
      try {
        await loadMapIcons(map);
      } catch (error) {
        console.error('Failed to load weather icons:', error);
      }

      // Add or update source
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: data,
          cluster: true,
          clusterMaxZoom: 10,
          clusterRadius: 40,
        });
      } else {
        (map.getSource(SOURCE_ID) as any).setData(data);
      }

      // Add layers if not exist
      if (!map.getLayer(CLUSTER_LAYER)) {
        map.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#06b6d4',
            'circle-radius': [
              'step', ['get', 'point_count'],
              14, 10, 18, 50, 24,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.85,
          },
          layout: {
            'visibility': weather.layerVisible ? 'visible' : 'none',
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
            'visibility': weather.layerVisible ? 'visible' : 'none',
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
            'icon-image': 'event-weather',
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              4, 0.2,
              8, 0.35,
              12, 0.55,
              16, 0.75,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'visibility': weather.layerVisible ? 'visible' : 'none',
          },
        });

        // Click handler for clusters → zoom in
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

        // Click handler for icons → event details
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
            municipality: props.municipality,
            road: props.road,
            timestamp: props.timestamp,
            endTime: props.endTime,
            severity: props.severity,
            source: props.source || 'FMI',
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

    setup();
  }, [map, data, weather.layerVisible, onEventSelect]);

  // Visibility control
  useEffect(() => {
    if (!map) return;
    const vis = weather.layerVisible ? 'visible' : 'none';
    [CLUSTER_LAYER, CLUSTER_COUNT_LAYER, ICONS_LAYER].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', vis);
      }
    });
  }, [map, weather.layerVisible]);

  return null;
}
