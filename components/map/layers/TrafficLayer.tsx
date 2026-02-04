'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { EVENT_CATEGORIES, POLLING_INTERVALS, type EventCategory } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection, EventDetails } from '@/lib/types';
import { loadMapIcons } from '@/lib/map-icons';

interface TrafficLayerProps {
  map: MapboxMap;
  onEventSelect?: (event: EventDetails | null) => void;
}

// Aikasuodatin tunteina (history API käyttää tätä)
const TIME_RANGE_HOURS: Record<string, number> = {
  '2h': 2,
  '8h': 8,
  '24h': 24,
  '7d': 7 * 24,
  'all': 0, // 0 = käytä live-dataa
};

// Suodata data kategorian mukaan (aikaa ei suodateta täällä - se tehdään API:ssa)
const filterByCategory = (data: EventFeatureCollection, categories: EventCategory[]): EventFeatureCollection => {
  const filteredFeatures = data.features.filter(feature => {
    return categories.includes(feature.properties.category as EventCategory);
  });

  return {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };
};

// Suodata data kategorian ja ajan mukaan (kokonaisfiltterointi)
const filterData = (data: EventFeatureCollection, categories: EventCategory[]): EventFeatureCollection => {
  // Aika suodatetaan jo API:ssa, joten täällä vain kategoriat
  return filterByCategory(data, categories);
};

// Laske tapahtumien määrä kategorioittain
const calculateEventCounts = (data: EventFeatureCollection): Record<EventCategory, number> => {
  const counts: Record<string, number> = {};

  data.features.forEach(feature => {
    const category = feature.properties.category;
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts as Record<EventCategory, number>;
};

export default function TrafficLayer({ map, onEventSelect }: TrafficLayerProps) {
  const { traffic } = useUnifiedFilters();
  const [allData, setAllData] = useState<EventFeatureCollection | null>(null);
  const filtersRef = useRef(traffic);

  // Pidä ref ajan tasalla
  useEffect(() => {
    filtersRef.current = traffic;
  }, [traffic]);

  // Ref fetchData-funktiolle, jotta voimme kutsua sitä toisesta effectistä
  const fetchDataRef = useRef<((timeRange?: string) => Promise<void>) | null>(null);

  // Kartan alustus
  useEffect(() => {
    if (!map) return;

    const addSourceAndLayers = async () => {
      console.log('addSourceAndLayers called');

      try {
        await loadMapIcons(map);
        console.log('Icons loaded successfully');
      } catch (error) {
        console.error('Failed to load icons:', error);
      }

      if (!map.getSource('traffic-events')) {
        console.log('Adding traffic-events source and layers');

        map.addSource('traffic-events', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 12, // Clusterit hajoavat zoom 12:ssa
          clusterRadius: 50, // Pisteet yhdistetään jos < 50px toisistaan
        });

        // Cluster-ympyrät
        map.addLayer({
          id: 'traffic-events-clusters',
          type: 'circle',
          source: 'traffic-events',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#f97316', // Orange < 10
              10,
              '#ef4444', // Red >= 10
              50,
              '#dc2626', // Dark red >= 50
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15, // < 10 pistettä
              10,
              20, // 10-50 pistettä
              50,
              25, // >= 50 pistettä
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        // Cluster-numerointi
        map.addLayer({
          id: 'traffic-events-cluster-count',
          type: 'symbol',
          source: 'traffic-events',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Yksittäiset ikonit (PIENEMMÄT)
        map.addLayer({
          id: 'traffic-events-icons',
          type: 'symbol',
          source: 'traffic-events',
          filter: ['!', ['has', 'point_count']], // Näytä vain yksittäiset pisteet
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
              4, 0.25,  // Pienempi (oli 0.4)
              8, 0.4,   // Pienempi (oli 0.6)
              12, 0.6,  // Pienempi (oli 0.8)
              16, 0.8   // Pienempi (oli 1.0)
            ],
            'icon-allow-overlap': false, // EI päällekkäin (oli true)
            'icon-ignore-placement': false, // Huomioi muut symbolit
            'visibility': traffic?.layerVisible ? 'visible' : 'none',
          },
        });

        console.log('Layers added');

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
              5, 20,
              10, 28,
              15, 36
            ],
            'circle-color': 'transparent',
            'circle-stroke-color': EVENT_CATEGORIES.accident.color,
            'circle-stroke-width': 3,
            'circle-opacity': 0.6,
          },
        }, 'traffic-events-icons');
      }
    };

    const fetchData = async (timeRange: string = 'all') => {
      try {
        const hours = TIME_RANGE_HOURS[timeRange] || 0;

        // Käytä history API:a jos aikasuodatin on käytössä
        const url = hours > 0
          ? `/api/history?hours=${hours}&includeInactive=true`
          : '/api/traffic';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');

        const data: EventFeatureCollection = await response.json();
        console.log(`Fetched ${data.features.length} events from ${hours > 0 ? 'history' : 'live'} API`);
        setAllData(data);
      } catch (error) {
        console.error('Failed to fetch traffic data:', error);
      }
    };

    // Tallenna fetchData refiin jotta sitä voi kutsua toisesta effectistä
    fetchDataRef.current = fetchData;

    const initMap = async () => {
      await addSourceAndLayers();
      fetchData();
    };

    if (map.isStyleLoaded()) {
      initMap();
    } else {
      map.on('load', initMap);
    }

    const handleStyleLoad = async () => {
      console.log('Style changed, reloading icons and layers');
      await new Promise(resolve => setTimeout(resolve, 100));
      await addSourceAndLayers();
    };
    map.on('style.load', handleStyleLoad);

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    // Click cluster -> zoom in
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

      const feature = features[0];
      const props = feature.properties;

      let metadata = props.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = undefined;
        }
      }

      const eventDetails: EventDetails = {
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
        screenPosition: {
          x: e.point.x,
          y: e.point.y,
        },
      };

      onEventSelect?.(eventDetails);
    };

    map.on('click', 'traffic-events-icons', handleClick);

    // Polling käyttää aina nykyistä aikasuodatinta
    const interval = setInterval(() => {
      const currentTimeRange = filtersRef.current?.timeRange || 'all';
      fetchData(currentTimeRange);
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

  // Initial load + time range change
  useEffect(() => {
    if (!map || !fetchDataRef.current) return;

    const timeRange = traffic?.timeRange || 'all';
    console.log(`Time range changed to: ${timeRange}, refetching data...`);
    fetchDataRef.current(timeRange);
  }, [map, traffic?.timeRange, traffic?.layerVisible]);

  // Force reload when categories change dramatically (e.g., from default to user selection)
  useEffect(() => {
    if (!map || !fetchDataRef.current || !allData) return;

    // If we have no data yet, trigger initial fetch
    if (allData.features.length === 0 && traffic?.layerVisible) {
      console.log('No data yet, triggering initial fetch...');
      fetchDataRef.current(traffic?.timeRange || 'all');
    }
  }, [map, traffic?.categories, traffic?.layerVisible, allData]);

  // Päivitä kartta kun data tai filterit muuttuvat
  useEffect(() => {
    if (!map || !allData) return;

    // Suodata kategorioiden mukaan karttaa varten
    const filtered = filterData(allData, traffic?.categories || []);

    const source = map.getSource('traffic-events');
    if (source && 'setData' in source) {
      source.setData(filtered);
      console.log(`Map: ${filtered.features.length} events (filtered from ${allData.features.length})`);
    }
  }, [map, allData, traffic?.categories]);

  // Aseta layer-näkyvyys
  useEffect(() => {
    if (!map || !map.getLayer('traffic-events-icons')) return;

    map.setLayoutProperty(
      'traffic-events-icons',
      'visibility',
      traffic?.layerVisible ? 'visible' : 'none'
    );
    map.setLayoutProperty(
      'traffic-events-pulse',
      'visibility',
      traffic?.layerVisible ? 'visible' : 'none'
    );
  }, [map, traffic?.layerVisible]);

  return null;
}
