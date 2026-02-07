'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { POLLING_INTERVALS } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection, EventDetails } from '@/lib/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface IceLayerProps {
  map: MapboxMap;
  onEventSelect?: (event: EventDetails | null) => void;
}

// Lake ice sources & layers
const LAKE_SOURCE = 'ice-lake-stations';
const LAKE_CLUSTER_LAYER = 'ice-lake-clusters';
const LAKE_CLUSTER_COUNT_LAYER = 'ice-lake-cluster-count';
const LAKE_CIRCLES_LAYER = 'ice-lake-circles';
const LAKE_LABELS_LAYER = 'ice-lake-labels';

// Sea ice WMS
const SEA_SOURCE = 'ice-sea-wms';
const SEA_LAYER = 'ice-sea-raster';

// Icebreaker routes
const BREAKER_SOURCE = 'ice-icebreaker-routes';
const BREAKER_LAYER = 'ice-icebreaker-lines';

const WMS_URL =
  'https://data.nsdc.fmi.fi/geoserver/BALFI/wms?service=WMS&version=1.1.1&request=GetMap' +
  '&layers=balfi_seaicethickness&bbox={bbox-epsg-3857}&width=256&height=256' +
  '&srs=EPSG:3857&format=image/png&transparent=true';

export default function IceLayer({ map, onEventSelect }: IceLayerProps) {
  const { ice } = useUnifiedFilters();
  const isPageVisible = usePageVisibility();
  const [lakeData, setLakeData] = useState<EventFeatureCollection | null>(null);
  const [breakerData, setBreakerData] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch lake ice data
  const fetchLakeData = async () => {
    try {
      const response = await fetch('/api/ice');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: EventFeatureCollection = await response.json();
      setLakeData(result);
      console.log(`Ice: ${result.features.length} lake stations loaded`);
    } catch (error) {
      console.error('Failed to fetch ice data:', error);
    }
  };

  // Fetch icebreaker routes
  const fetchBreakerData = async () => {
    try {
      const response = await fetch('/api/ice/icebreakers');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setBreakerData(result);
      console.log(`Ice: ${result.features?.length ?? 0} icebreaker routes loaded`);
    } catch (error) {
      console.error('Failed to fetch icebreaker data:', error);
    }
  };

  // Polling - only when visible and page active
  useEffect(() => {
    if (!ice.layerVisible || !isPageVisible) return;
    fetchLakeData();
    fetchBreakerData();
    intervalRef.current = setInterval(() => {
      fetchLakeData();
      fetchBreakerData();
    }, POLLING_INTERVALS.ice);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ice.layerVisible, isPageVisible]);

  // ─── Lake ice: source + layers ───
  useEffect(() => {
    if (!map || !lakeData) return;

    // Enrich: extract iceThickness for Mapbox expressions
    const enriched: EventFeatureCollection = {
      type: 'FeatureCollection',
      features: lakeData.features.map(f => {
        let iceThickness = 0;
        try {
          const meta = typeof f.properties.metadata === 'string'
            ? JSON.parse(f.properties.metadata)
            : f.properties.metadata;
          iceThickness = meta?.iceThickness ?? 0;
        } catch { /* ignore */ }
        return {
          ...f,
          properties: { ...f.properties, iceThickness },
        };
      }),
    };

    if (!map.getSource(LAKE_SOURCE)) {
      map.addSource(LAKE_SOURCE, {
        type: 'geojson',
        data: enriched,
        cluster: true,
        clusterMaxZoom: 9,
        clusterRadius: 40,
      });
    } else {
      (map.getSource(LAKE_SOURCE) as any).setData(enriched);
    }

    if (!map.getLayer(LAKE_CLUSTER_LAYER)) {
      const vis = (ice.layerVisible && ice.showLakes) ? 'visible' as const : 'none' as const;

      map.addLayer({
        id: LAKE_CLUSTER_LAYER,
        type: 'circle',
        source: LAKE_SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#38bdf8',
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 30, 24],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.85,
        },
        layout: { visibility: vis },
      });

      map.addLayer({
        id: LAKE_CLUSTER_COUNT_LAYER,
        type: 'symbol',
        source: LAKE_SOURCE,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 11,
          visibility: vis,
        },
        paint: { 'text-color': '#0369a1' },
      });

      map.addLayer({
        id: LAKE_CIRCLES_LAYER,
        type: 'circle',
        source: LAKE_SOURCE,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 5, 8, 8, 12, 11, 16, 15,
          ],
          'circle-color': [
            'interpolate', ['linear'],
            ['to-number', ['get', 'iceThickness'], 0],
            0, '#ef4444',
            10, '#f97316',
            20, '#eab308',
            35, '#22c55e',
            50, '#38bdf8',
            80, '#1e3a5f',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
        layout: { visibility: vis },
      });

      map.addLayer({
        id: LAKE_LABELS_LAYER,
        type: 'symbol',
        source: LAKE_SOURCE,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['concat', ['to-string', ['get', 'iceThickness']], ' cm'],
          'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 0],
          'text-allow-overlap': true,
          visibility: vis,
        },
        paint: {
          'text-color': '#0369a1',
          'text-halo-color': '#fff',
          'text-halo-width': 1.5,
        },
        minzoom: 8,
      });

      map.on('click', LAKE_CLUSTER_LAYER, (e: any) => {
        const features = e.features;
        if (!features?.length) return;
        const clusterId = features[0].properties.cluster_id;
        (map.getSource(LAKE_SOURCE) as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 0.5, duration: 500 });
        });
      });

      map.on('click', LAKE_CIRCLES_LAYER, (e: any) => {
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
          source: props.source || 'SYKE',
          metadata,
          screenPosition: { x: e.point.x, y: e.point.y },
        });
      });

      map.on('mouseenter', LAKE_CIRCLES_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAKE_CIRCLES_LAYER, () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', LAKE_CLUSTER_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAKE_CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ''; });
    }
  }, [map, lakeData, ice.layerVisible, ice.showLakes, onEventSelect]);

  // ─── Sea ice WMS raster ───
  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SEA_SOURCE)) {
      map.addSource(SEA_SOURCE, {
        type: 'raster',
        tiles: [WMS_URL],
        tileSize: 256,
      });
    }

    if (!map.getLayer(SEA_LAYER)) {
      map.addLayer({
        id: SEA_LAYER,
        type: 'raster',
        source: SEA_SOURCE,
        paint: { 'raster-opacity': 0.6 },
        layout: {
          visibility: (ice.layerVisible && ice.showSeaIce) ? 'visible' : 'none',
        },
      });
    }
  }, [map, ice.layerVisible, ice.showSeaIce]);

  // ─── Icebreaker routes ───
  useEffect(() => {
    if (!map || !breakerData) return;

    if (!map.getSource(BREAKER_SOURCE)) {
      map.addSource(BREAKER_SOURCE, {
        type: 'geojson',
        data: breakerData,
      });
    } else {
      (map.getSource(BREAKER_SOURCE) as any).setData(breakerData);
    }

    if (!map.getLayer(BREAKER_LAYER)) {
      map.addLayer({
        id: BREAKER_LAYER,
        type: 'line',
        source: BREAKER_SOURCE,
        paint: {
          'line-color': '#f97316',
          'line-width': 2.5,
          'line-dasharray': [4, 3],
          'line-opacity': 0.8,
        },
        layout: {
          visibility: (ice.layerVisible && ice.showIcebreakers) ? 'visible' : 'none',
        },
      });
    }
  }, [map, breakerData, ice.layerVisible, ice.showIcebreakers]);

  // ─── Visibility control ───
  useEffect(() => {
    if (!map) return;

    const lakeVis = (ice.layerVisible && ice.showLakes) ? 'visible' as const : 'none' as const;
    [LAKE_CLUSTER_LAYER, LAKE_CLUSTER_COUNT_LAYER, LAKE_CIRCLES_LAYER, LAKE_LABELS_LAYER].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', lakeVis);
    });

    const seaVis = (ice.layerVisible && ice.showSeaIce) ? 'visible' as const : 'none' as const;
    if (map.getLayer(SEA_LAYER)) map.setLayoutProperty(SEA_LAYER, 'visibility', seaVis);

    const breakerVis = (ice.layerVisible && ice.showIcebreakers) ? 'visible' as const : 'none' as const;
    if (map.getLayer(BREAKER_LAYER)) map.setLayoutProperty(BREAKER_LAYER, 'visibility', breakerVis);
  }, [map, ice.layerVisible, ice.showLakes, ice.showSeaIce, ice.showIcebreakers]);

  return null;
}
