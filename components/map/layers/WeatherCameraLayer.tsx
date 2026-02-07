'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { POLLING_INTERVALS } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { loadMapIcons } from '@/lib/map-icons';
import type { WeatherCameraStation } from '@/lib/data/weathercam/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface WeatherCameraLayerProps {
  map: MapboxMap;
}

export default function WeatherCameraLayer({ map }: WeatherCameraLayerProps) {
  const { weatherCamera, setSelectedWeatherCamera } = useUnifiedFilters();
  const isPageVisible = usePageVisibility();
  const [stations, setStations] = useState<WeatherCameraStation[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stationsCacheRef = useRef<Map<string, WeatherCameraStation>>(new Map());

  // Hae asemia API:sta
  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weathercam');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: WeatherCameraStation[] = await response.json();
      setStations(data);

      // Päivitä cache
      data.forEach((station) => {
        stationsCacheRef.current.set(station.id, station);
      });

      console.log(`Loaded ${data.length} weather camera stations`);
    } catch (error) {
      console.error('Failed to fetch weather cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  // Alusta polling - only when layer is visible and page active
  useEffect(() => {
    if (!weatherCamera.layerVisible || !isPageVisible) return;
    fetchStations();
    intervalRef.current = setInterval(
      fetchStations,
      POLLING_INTERVALS.cameras
    );

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [weatherCamera.layerVisible, isPageVisible]);

  // Päivitä kartan layer-tiedot
  useEffect(() => {
    if (!map || stations.length === 0) return;

    (async () => {
      try {
        await loadMapIcons(map);
      } catch (error) {
        console.error('Failed to load map icons:', error);
      }

      // Luo GeoJSON
      const geojson = {
        type: 'FeatureCollection' as const,
        features: stations.map((station) => ({
          type: 'Feature' as const,
          id: station.id,
          geometry: {
            type: 'Point' as const,
            coordinates: station.coordinates,
          },
          properties: {
            stationId: station.id,
            name: station.name,
            presetCount: station.presets.length,
          },
        })),
      };

      // Lisää source tai päivitä data
      if (!map.getSource('weather-cameras')) {
        map.addSource('weather-cameras', {
          type: 'geojson',
          data: geojson,
        });
      } else {
        (map.getSource('weather-cameras') as any).setData(geojson);
      }

      // Lisää layer
      if (!map.getLayer('weather-camera-icons')) {
        map.addLayer({
          id: 'weather-camera-icons',
          type: 'symbol',
          source: 'weather-cameras',
          layout: {
            'icon-image': 'event-camera',
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, 0.4,
              8, 0.6,
              12, 0.8,
              16, 1.0,
            ],
            'icon-allow-overlap': true,
            'visibility': weatherCamera.layerVisible ? 'visible' : 'none',
          },
        });

        // Click handler
        map.on('click', 'weather-camera-icons', (e) => {
          if (e.features && e.features[0]) {
            const stationId = e.features[0].properties?.stationId;
            if (stationId) {
              setSelectedWeatherCamera(stationId);
            }
          }
        });

        // Cursor style
        map.on('mouseenter', 'weather-camera-icons', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'weather-camera-icons', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    })();
  }, [map, stations, weatherCamera.layerVisible, setSelectedWeatherCamera]);

  // Aseta layer-näkyvyys
  useEffect(() => {
    if (!map || !map.getLayer('weather-camera-icons')) return;

    map.setLayoutProperty(
      'weather-camera-icons',
      'visibility',
      weatherCamera.layerVisible ? 'visible' : 'none'
    );
  }, [map, weatherCamera.layerVisible]);

  return null;
}
