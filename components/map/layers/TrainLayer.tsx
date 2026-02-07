'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { POLLING_INTERVALS } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection, EventDetails } from '@/lib/types';
import { loadMapIcons } from '@/lib/map-icons';
import { usePageVisibility } from '@/hooks/usePageVisibility';

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
  const isPageVisible = usePageVisibility();
  const [allData, setAllData] = useState<EventFeatureCollection | null>(null);
  const [layersReady, setLayersReady] = useState(false);
  const fetchDataRef = useRef<(() => Promise<void>) | null>(null);

  const layerVisibleRef = useRef(train.layerVisible);
  useEffect(() => {
    layerVisibleRef.current = train.layerVisible;
  }, [train.layerVisible]);

  const isPageVisibleRef = useRef(isPageVisible);
  useEffect(() => {
    isPageVisibleRef.current = isPageVisible;
  }, [isPageVisible]);

  // Map setup
  useEffect(() => {
    if (!map) return;

    const addSourceAndLayers = async () => {
      console.log('[TrainLayer] addSourceAndLayers: start');

      try {
        await loadMapIcons(map);
      } catch (error) {
        console.error('[TrainLayer] icon load error:', error);
      }
      console.log('[TrainLayer] icons done');

      try {
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: true,
            clusterMaxZoom: 10,
            clusterRadius: 50,
          });
          console.log('[TrainLayer] source added');
        } else {
          console.log('[TrainLayer] source exists');
        }
      } catch (error) {
        console.error('[TrainLayer] source error:', error);
        return; // Can't continue without source
      }

      try {
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

          console.log('[TrainLayer] layers added');

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
        } else {
          console.log('[TrainLayer] layers exist');
        }
      } catch (error) {
        console.error('[TrainLayer] layer error:', error);
      }

      console.log('[TrainLayer] addSourceAndLayers: done');
    };

    const fetchData = async () => {
      try {
        const response = await fetch('/api/train');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: EventFeatureCollection = await response.json();
        console.log(`[TrainLayer] Fetched ${result.features.length} trains`);
        setAllData(result);
      } catch (error) {
        console.error('[TrainLayer] Fetch failed:', error);
      }
    };

    fetchDataRef.current = fetchData;

    const initMap = async () => {
      try {
        await addSourceAndLayers();
        if (map.getSource(SOURCE_ID)) {
          console.log('[TrainLayer] Layers ready');
          setLayersReady(true);
          if (layerVisibleRef.current) {
            await fetchData();
          }
        }
      } catch (error) {
        console.error('[TrainLayer] initMap FAILED:', error);
      }
    };

    // Always call initMap — isStyleLoaded() returns false when other
    // layers load icons concurrently, and 'load' already fired
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
    map.on('mouseenter', ICONS_LAYER, handleMouseEnter);
    map.on('mouseleave', ICONS_LAYER, handleMouseLeave);
    map.on('mouseenter', CLUSTER_LAYER, handleMouseEnter);
    map.on('mouseleave', CLUSTER_LAYER, handleMouseLeave);

    const interval = setInterval(() => {
      if (!layerVisibleRef.current || !isPageVisibleRef.current) return;
      fetchData();
    }, POLLING_INTERVALS.trains);

    return () => {
      clearInterval(interval);
      map.off('mouseenter', ICONS_LAYER, handleMouseEnter);
      map.off('mouseleave', ICONS_LAYER, handleMouseLeave);
      map.off('mouseenter', CLUSTER_LAYER, handleMouseEnter);
      map.off('mouseleave', CLUSTER_LAYER, handleMouseLeave);
      map.off('style.load', handleStyleLoad);
    };
  }, [map, onEventSelect]);

  // Fetch data when toggled visible with no data
  useEffect(() => {
    if (!map || !fetchDataRef.current || !train.layerVisible) return;
    if (!allData) fetchDataRef.current();
  }, [map, train.layerVisible, allData]);

  // Combined visibility + data filter effect
  useEffect(() => {
    if (!map || !layersReady) return;

    const vis = train.layerVisible ? 'visible' : 'none';
    [CLUSTER_LAYER, CLUSTER_COUNT_LAYER, ICONS_LAYER].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', vis);
      }
    });

    const source = map.getSource(SOURCE_ID);
    if (source && 'setData' in source) {
      if (!train.layerVisible || !allData) {
        source.setData({ type: 'FeatureCollection', features: [] });
      } else {
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
        console.log(`[TrainLayer] Update: ${filtered.features.length}/${allData.features.length} trains (visible=${train.layerVisible})`);
        source.setData(filtered);
      }
    }
  }, [map, layersReady, allData, train.layerVisible, train.trainTypes]);

  return null;
}
