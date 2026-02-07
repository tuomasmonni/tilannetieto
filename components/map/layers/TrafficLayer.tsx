'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { EVENT_CATEGORIES, POLLING_INTERVALS, type EventCategory } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection, EventDetails } from '@/lib/types';
import { loadMapIcons } from '@/lib/map-icons';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface TrafficLayerProps {
  map: MapboxMap;
  onEventSelect?: (event: EventDetails | null) => void;
}

const TIME_RANGE_HOURS: Record<string, number> = {
  '2h': 2,
  '8h': 8,
  '24h': 24,
  '7d': 7 * 24,
  'all': 0,
};

const filterByTimeRange = (
  data: EventFeatureCollection,
  timeRange: string
): EventFeatureCollection => {
  const hours = TIME_RANGE_HOURS[timeRange] || 0;
  if (hours === 0) return data; // 'all' = no filtering

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return {
    type: 'FeatureCollection',
    features: data.features.filter(f => f.properties.timestamp >= cutoff),
  };
};

const filterByCategory = (data: EventFeatureCollection, categories: EventCategory[]): EventFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: data.features.filter(feature =>
      categories.includes(feature.properties.category as EventCategory)
    ),
  };
};

export default function TrafficLayer({ map, onEventSelect }: TrafficLayerProps) {
  const { traffic } = useUnifiedFilters();
  const isPageVisible = usePageVisibility();
  const [allData, setAllData] = useState<EventFeatureCollection | null>(null);
  const [layersReady, setLayersReady] = useState(false);
  const filtersRef = useRef(traffic);

  useEffect(() => {
    filtersRef.current = traffic;
  }, [traffic]);

  const layerVisibleRef = useRef(traffic?.layerVisible);
  useEffect(() => {
    layerVisibleRef.current = traffic?.layerVisible;
  }, [traffic?.layerVisible]);

  const isPageVisibleRef = useRef(isPageVisible);
  useEffect(() => {
    isPageVisibleRef.current = isPageVisible;
  }, [isPageVisible]);

  const fetchDataRef = useRef<(() => Promise<void>) | null>(null);

  // Map setup
  useEffect(() => {
    if (!map) return;

    const addSourceAndLayers = async () => {
      try {
        await loadMapIcons(map);
      } catch (error) {
        console.error('Failed to load icons:', error);
      }

      if (!map.getSource('traffic-events')) {
        map.addSource('traffic-events', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 50,
        });

        map.addLayer({
          id: 'traffic-events-clusters',
          type: 'circle',
          source: 'traffic-events',
          filter: ['has', 'point_count'],
          layout: {
            'visibility': traffic?.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'circle-color': [
              'step', ['get', 'point_count'],
              '#f97316', 10, '#ef4444', 50, '#dc2626',
            ],
            'circle-radius': [
              'step', ['get', 'point_count'],
              15, 10, 20, 50, 25,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        map.addLayer({
          id: 'traffic-events-cluster-count',
          type: 'symbol',
          source: 'traffic-events',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'visibility': traffic?.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        map.addLayer({
          id: 'traffic-events-icons',
          type: 'symbol',
          source: 'traffic-events',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': [
              'match', ['get', 'category'],
              'accident', 'event-accident',
              'disruption', 'event-disruption',
              'roadwork', 'event-roadwork',
              'weather', 'event-weather',
              'train', 'event-train',
              'camera', 'event-camera',
              'police', 'event-police',
              'fire', 'event-fire',
              'event-default'
            ],
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              4, 0.25, 8, 0.4, 12, 0.6, 16, 0.8,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'visibility': traffic?.layerVisible ? 'visible' : 'none',
          },
        });

        map.addLayer({
          id: 'traffic-events-pulse',
          type: 'circle',
          source: 'traffic-events',
          filter: ['==', ['get', 'severity'], 'high'],
          layout: {
            'visibility': traffic?.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              5, 20, 10, 28, 15, 36,
            ],
            'circle-color': 'transparent',
            'circle-stroke-color': EVENT_CATEGORIES.accident.color,
            'circle-stroke-width': 3,
            'circle-opacity': 0.6,
          },
        }, 'traffic-events-icons');
      }
    };

    const fetchData = async () => {
      try {
        const response = await fetch('/api/traffic');
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data: EventFeatureCollection = await response.json();
        console.log(`[TrafficLayer] Fetched ${data.features.length} events`);
        setAllData(data);
      } catch (error) {
        console.error('[TrafficLayer] Fetch failed:', error);
      }
    };

    fetchDataRef.current = fetchData;

    const initMap = async () => {
      await addSourceAndLayers();
      console.log('[TrafficLayer] Layers ready, fetching data...');
      setLayersReady(true);
      await fetchData();
    };

    initMap();

    const handleStyleLoad = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setLayersReady(false);
      await addSourceAndLayers();
      setLayersReady(true);
    };
    map.on('style.load', handleStyleLoad);

    const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ''; };

    const handleClusterClick = (e: any) => {
      const features = e.features;
      if (!features?.length) return;
      const clusterId = features[0].properties.cluster_id;
      const source = map.getSource('traffic-events') as any;
      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom + 0.5,
          duration: 500,
        });
      });
    };

    map.on('mouseenter', 'traffic-events-icons', handleMouseEnter);
    map.on('mouseleave', 'traffic-events-icons', handleMouseLeave);
    map.on('mouseenter', 'traffic-events-clusters', handleMouseEnter);
    map.on('mouseleave', 'traffic-events-clusters', handleMouseLeave);
    map.on('click', 'traffic-events-clusters', handleClusterClick);

    const handleClick = (e: any) => {
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
        source: props.source || 'Fintraffic',
        metadata,
        screenPosition: { x: e.point.x, y: e.point.y },
      });
    };

    map.on('click', 'traffic-events-icons', handleClick);

    const interval = setInterval(() => {
      if (!layerVisibleRef.current || !isPageVisibleRef.current) return;
      fetchData();
    }, POLLING_INTERVALS.traffic);

    return () => {
      clearInterval(interval);
      map.off('mouseenter', 'traffic-events-icons', handleMouseEnter);
      map.off('mouseleave', 'traffic-events-icons', handleMouseLeave);
      map.off('mouseenter', 'traffic-events-clusters', handleMouseEnter);
      map.off('mouseleave', 'traffic-events-clusters', handleMouseLeave);
      map.off('click', 'traffic-events-icons', handleClick);
      map.off('click', 'traffic-events-clusters', handleClusterClick);
      map.off('style.load', handleStyleLoad);
    };
  }, [map, onEventSelect]);

  // Fetch data when toggled visible with no data
  useEffect(() => {
    if (!map || !fetchDataRef.current || !traffic?.layerVisible) return;
    if (!allData) fetchDataRef.current();
  }, [map, traffic?.layerVisible, allData]);

  // Combined visibility + data filter effect
  // Single effect ensures clusters always update atomically
  useEffect(() => {
    if (!map || !layersReady) return;

    const vis = traffic?.layerVisible ? 'visible' : 'none';
    const layerIds = [
      'traffic-events-clusters',
      'traffic-events-cluster-count',
      'traffic-events-icons',
      'traffic-events-pulse',
    ];

    for (const id of layerIds) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', vis);
      }
    }

    const source = map.getSource('traffic-events');
    if (source && 'setData' in source) {
      if (!traffic?.layerVisible || !allData) {
        // Layer hidden or no data → empty source so clusters disappear
        source.setData({ type: 'FeatureCollection', features: [] });
      } else {
        // Layer visible → apply time range + category filters
        const timeFiltered = filterByTimeRange(allData, traffic?.timeRange || 'all');
        const filtered = filterByCategory(timeFiltered, traffic?.categories || []);
        console.log(`[TrafficLayer] Update: ${filtered.features.length}/${allData.features.length} events (timeRange=${traffic?.timeRange}, visible=${traffic?.layerVisible})`);
        source.setData(filtered);
      }
    }
  }, [map, layersReady, allData, traffic?.layerVisible, traffic?.categories, traffic?.timeRange]);

  return null;
}
