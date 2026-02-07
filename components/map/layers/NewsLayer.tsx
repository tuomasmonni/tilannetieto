'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { NEWS_CATEGORIES, POLLING_INTERVALS, type NewsCategoryKey } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventDetails } from '@/lib/types';

interface NewsLayerProps {
  map: MapboxMap;
  onEventSelect?: (event: EventDetails | null) => void;
}

interface NewsGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: {
      id: string;
      type: string;
      category: string;
      allCategories: string[];
      title: string;
      description: string;
      source: string;
      sourceUrl: string;
      municipality: string;
      timestamp: string;
      severity: string;
      confidence: number;
      locationName: string;
      isCluster?: boolean;
      sourceCount?: number;
      allSources?: string;
      mergedSummary?: string;
      articleCount?: number;
      articleUrls?: string;
    };
  }>;
  metadata?: {
    totalArticles: number;
    geolocated: number;
    fetchedAt: string;
  };
}

// Category to color mapping for map display
const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(NEWS_CATEGORIES).map(([key, val]) => [key, val.color])
);

export default function NewsLayer({ map, onEventSelect }: NewsLayerProps) {
  const { news } = useUnifiedFilters();
  const [allData, setAllData] = useState<NewsGeoJSON | null>(null);
  const [layersReady, setLayersReady] = useState(false);
  const filtersRef = useRef(news);

  useEffect(() => {
    filtersRef.current = news;
  }, [news]);

  const layerVisibleRef = useRef(news?.layerVisible);
  useEffect(() => {
    layerVisibleRef.current = news?.layerVisible;
  }, [news?.layerVisible]);

  // Build query params from filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('timeRange', filtersRef.current?.timeRange || '24h');
    if (filtersRef.current?.sources?.length) {
      params.set('sources', filtersRef.current.sources.join(','));
    }
    if (filtersRef.current?.categories?.length) {
      params.set('categories', filtersRef.current.categories.join(','));
    }
    if (filtersRef.current?.searchQuery) {
      params.set('search', filtersRef.current.searchQuery);
    }
    return params.toString();
  };

  // Map setup
  useEffect(() => {
    if (!map) return;

    const addSourceAndLayers = () => {
      if (!map.getSource('news-events')) {
        map.addSource('news-events', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 40,
        });

        // Cluster circles
        map.addLayer({
          id: 'news-clusters',
          type: 'circle',
          source: 'news-events',
          filter: ['has', 'point_count'],
          layout: {
            visibility: news?.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'circle-color': [
              'step', ['get', 'point_count'],
              '#f59e0b', 10, '#d97706', 30, '#b45309',
            ],
            'circle-radius': [
              'step', ['get', 'point_count'],
              14, 10, 18, 30, 24,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        // Cluster count
        map.addLayer({
          id: 'news-cluster-count',
          type: 'symbol',
          source: 'news-events',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 11,
            visibility: news?.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Individual points - colored by category
        map.addLayer({
          id: 'news-points',
          type: 'circle',
          source: 'news-events',
          filter: ['!', ['has', 'point_count']],
          layout: {
            visibility: news?.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              4, 6, 8, 8, 12, 10, 16, 14,
            ],
            'circle-color': [
              'match', ['get', 'category'],
              ...Object.entries(CATEGORY_COLORS).flatMap(([k, v]) => [k, v]),
              '#6b7280', // default
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });

        // Pulse effect for high severity
        map.addLayer({
          id: 'news-pulse',
          type: 'circle',
          source: 'news-events',
          filter: ['all',
            ['!', ['has', 'point_count']],
            ['==', ['get', 'severity'], 'high'],
          ],
          layout: {
            visibility: news?.layerVisible ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              5, 18, 10, 24, 14, 32, 18, 40,
            ],
            'circle-color': 'transparent',
            'circle-stroke-color': '#ef4444',
            'circle-stroke-width': 2.5,
            'circle-opacity': 0.5,
          },
        }, 'news-points');
      }
    };

    const fetchData = async () => {
      try {
        const queryStr = buildQueryParams();
        const url = `/api/news?${queryStr}`;
        console.log('[NewsLayer] Fetching:', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data: NewsGeoJSON = await response.json();
        console.log(`[NewsLayer] Fetched ${data.features?.length || 0} geolocated articles (total: ${data.metadata?.totalArticles || '?'})`);
        setAllData(data);

        const source = map.getSource('news-events');
        if (source && 'setData' in source) {
          source.setData(data);
        }
      } catch (error) {
        console.error('[NewsLayer] Failed to fetch news data:', error);
      }
    };

    const initMap = () => {
      addSourceAndLayers();
      setLayersReady(true);
      fetchData();
    };

    initMap();

    const handleStyleLoad = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setLayersReady(false);
      addSourceAndLayers();
      setLayersReady(true);
    };
    map.on('style.load', handleStyleLoad);

    // Interactions
    const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ''; };

    const handleClusterClick = (e: any) => {
      const features = e.features;
      if (!features?.length) return;
      const clusterId = features[0].properties.cluster_id;
      const source = map.getSource('news-events') as any;
      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom + 0.5,
          duration: 500,
        });
      });
    };

    const handleClick = (e: any) => {
      const features = e.features;
      if (!features?.length) return;
      const props = features[0].properties;

      // Map news source labels
      const sourceLabels: Record<string, string> = {
        yle: 'YLE Uutiset',
        iltalehti: 'Iltalehti',
        mtv: 'MTV Uutiset',
        hs: 'Helsingin Sanomat',
        is: 'Ilta-Sanomat',
        kauppalehti: 'Kauppalehti',
        maaseuduntulevaisuus: 'Maaseudun Tulevaisuus',
        suomenkuvalehti: 'Suomen Kuvalehti',
      };

      const isNewsCluster = props.isCluster && props.sourceCount > 1;
      const sourceDisplay = isNewsCluster
        ? `Raportoitu ${props.sourceCount} lähteessä`
        : sourceLabels[props.source] || props.source;

      onEventSelect?.({
        id: props.id,
        type: 'news',
        category: props.category as any,
        title: props.title,
        description: props.mergedSummary || props.description || '',
        locationName: props.locationName || props.municipality || 'Suomi',
        municipality: props.municipality,
        timestamp: props.timestamp,
        severity: props.severity as 'low' | 'medium' | 'high',
        source: sourceDisplay,
        metadata: {
          sourceUrl: props.sourceUrl,
          isCluster: props.isCluster,
          sourceCount: props.sourceCount,
          allSources: props.allSources,
          articleCount: props.articleCount,
          articleUrls: props.articleUrls,
        },
        screenPosition: { x: e.point.x, y: e.point.y },
      });
    };

    map.on('mouseenter', 'news-points', handleMouseEnter);
    map.on('mouseleave', 'news-points', handleMouseLeave);
    map.on('mouseenter', 'news-clusters', handleMouseEnter);
    map.on('mouseleave', 'news-clusters', handleMouseLeave);
    map.on('click', 'news-clusters', handleClusterClick);
    map.on('click', 'news-points', handleClick);

    // Polling
    const interval = setInterval(() => {
      if (!layerVisibleRef.current) return;
      fetchData();
    }, POLLING_INTERVALS.news);

    return () => {
      clearInterval(interval);
      map.off('mouseenter', 'news-points', handleMouseEnter);
      map.off('mouseleave', 'news-points', handleMouseLeave);
      map.off('mouseenter', 'news-clusters', handleMouseEnter);
      map.off('mouseleave', 'news-clusters', handleMouseLeave);
      map.off('click', 'news-clusters', handleClusterClick);
      map.off('click', 'news-points', handleClick);
      map.off('style.load', handleStyleLoad);
    };
  }, [map, onEventSelect]);

  // Refetch when filters change
  useEffect(() => {
    if (!map || !layersReady) return;
    const fetchData = async () => {
      try {
        const queryStr = buildQueryParams();
        const response = await fetch(`/api/news?${queryStr}`);
        if (!response.ok) return;
        const data: NewsGeoJSON = await response.json();
        setAllData(data);
        const source = map.getSource('news-events');
        if (source && 'setData' in source) {
          source.setData(data);
        }
      } catch (error) {
        console.error('[NewsLayer] Filter fetch error:', error);
      }
    };
    fetchData();
  }, [map, layersReady, news?.timeRange, news?.sources, news?.categories, news?.searchQuery]);

  // Visibility toggle
  useEffect(() => {
    if (!map || !layersReady) return;
    const layers = ['news-points', 'news-pulse', 'news-clusters', 'news-cluster-count'];
    const vis = news?.layerVisible ? 'visible' : 'none';
    for (const layerId of layers) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', vis);
      }
    }
  }, [map, news?.layerVisible, layersReady]);

  return null;
}
