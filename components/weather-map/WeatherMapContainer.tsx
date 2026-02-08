'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, MAP_STYLES } from '@/lib/constants';
import { WEATHER_MAP_POLLING } from '@/lib/weather-map/constants';
import { useWeatherMapState } from '@/hooks/useWeatherMapState';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import WeatherMapHeader from './WeatherMapHeader';
import TemperatureOverlay from './TemperatureOverlay';
import WindOverlay from './WindOverlay';
import RadarOverlay from './RadarOverlay';
import TemperatureLegend from './TemperatureLegend';
import WindLegend from './WindLegend';
import WeatherMapControls from './WeatherMapControls';
import CurrentConditions from './CurrentConditions';
import StationPopup from './StationPopup';
import TimeSlider from './TimeSlider';
import type { WeatherMapObservation } from '@/lib/weather-map/types';

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
mapboxgl.accessToken = token;

const STATION_SOURCE = 'weather-stations';
const STATION_LAYER = 'weather-station-circles';

export default function WeatherMapContainer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const isVisible = usePageVisibility();

  const {
    state,
    setLayerVisible,
    setLayerOpacity,
    setObservations,
    setForecast,
    setRadarFrames,
    setForecastMode,
    setForecastHour,
    setForecastPlaying,
    setRadarPlaying,
    setRadarFrame,
    setSelectedStation,
  } = useWeatherMapState();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES.dark,
      center: MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      // Hide road labels
      [
        'road-number-shield',
        'road-exit-shield',
        'highway-shield',
        'highway-shield-text',
        'road-label-small',
        'road-label-medium',
        'road-label-large',
      ].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
      });

      setMapInstance(map);
      setMapReady(true);
    });

    map.on('error', (e) => {
      console.error('Mapbox error:', e.error);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch observations
  const fetchObservations = useCallback(async () => {
    try {
      const res = await fetch('/api/saakartta/observations');
      const data = await res.json();
      if (data.observations) {
        setObservations(data.observations);
      }
    } catch (e) {
      console.error('Failed to fetch observations:', e);
    }
  }, [setObservations]);

  // Fetch forecast
  const fetchForecast = useCallback(async () => {
    try {
      const res = await fetch('/api/saakartta/forecast');
      const data = await res.json();
      if (data.points) {
        setForecast(data.points, data.hours);
      }
    } catch (e) {
      console.error('Failed to fetch forecast:', e);
    }
  }, [setForecast]);

  // Fetch radar frames
  const fetchRadar = useCallback(async () => {
    try {
      const res = await fetch('/api/saakartta/radar');
      const data = await res.json();
      if (data.frames) {
        setRadarFrames(data.frames);
      }
    } catch (e) {
      console.error('Failed to fetch radar:', e);
    }
  }, [setRadarFrames]);

  // Initial data fetch
  useEffect(() => {
    if (!mapReady) return;
    fetchObservations();
    fetchForecast();
    fetchRadar();
  }, [mapReady, fetchObservations, fetchForecast, fetchRadar]);

  // Polling
  useEffect(() => {
    if (!mapReady || !isVisible) return;

    const obsInterval = setInterval(fetchObservations, WEATHER_MAP_POLLING.observations);
    const fcInterval = setInterval(fetchForecast, WEATHER_MAP_POLLING.forecast);
    const radarInterval = setInterval(fetchRadar, WEATHER_MAP_POLLING.radar);

    return () => {
      clearInterval(obsInterval);
      clearInterval(fcInterval);
      clearInterval(radarInterval);
    };
  }, [mapReady, isVisible, fetchObservations, fetchForecast, fetchRadar]);

  // Add station dots to map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || state.observations.length === 0) return;

    try {
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: state.observations
          .filter((obs) => obs.temperature !== null)
          .map((obs) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [obs.lon, obs.lat],
            },
            properties: {
              id: obs.id,
              name: obs.stationName,
              temperature: obs.temperature,
              windSpeed: obs.windSpeed,
              source: obs.source,
            },
          })),
      };

      const source = map.getSource(STATION_SOURCE) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(STATION_SOURCE, { type: 'geojson', data: geojson });
        map.addLayer({
          id: STATION_LAYER,
          type: 'circle',
          source: STATION_SOURCE,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2, 8, 3, 12, 5],
            'circle-color': '#ffffff',
            'circle-stroke-color': '#000000',
            'circle-stroke-width': 0.5,
            'circle-opacity': 0.7,
          },
        });

        // Click handler
        map.on('click', STATION_LAYER, (e) => {
          const feature = e.features?.[0];
          if (!feature || !feature.properties) return;

          const obs = state.observations.find((o) => o.id === feature.properties!.id);
          if (obs) setSelectedStation(obs);
        });

        map.on('mouseenter', STATION_LAYER, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', STATION_LAYER, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      // Update visibility
      if (map.getLayer(STATION_LAYER)) {
        map.setLayoutProperty(
          STATION_LAYER,
          'visibility',
          state.stationsVisible ? 'visible' : 'none'
        );
      }
    } catch (err) {
      console.error('Station dots error:', err);
    }
  }, [mapReady, state.observations, state.stationsVisible, setSelectedStation]);

  // Forecast playback
  useEffect(() => {
    if (!state.forecastPlaying || state.forecastHours.length === 0) return;

    const interval = setInterval(() => {
      setForecastHour((state.forecastHourIndex + 1) % state.forecastHours.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.forecastPlaying, state.forecastHourIndex, state.forecastHours.length, setForecastHour]);

  // Layer toggle config
  const layerToggles = [
    {
      key: 'temperature',
      label: 'Lampotila',
      icon: '🌡️',
      visible: state.temperatureVisible,
      opacity: state.temperatureOpacity,
      hasOpacity: true,
    },
    {
      key: 'wind',
      label: 'Tuuli',
      icon: '💨',
      visible: state.windVisible,
      opacity: state.windOpacity,
      hasOpacity: true,
    },
    {
      key: 'radar',
      label: 'Tutka',
      icon: '📡',
      visible: state.radarVisible,
      opacity: state.radarOpacity,
      hasOpacity: true,
    },
    {
      key: 'stations',
      label: 'Asemat',
      icon: '📍',
      visible: state.stationsVisible,
      opacity: 1,
      hasOpacity: false,
    },
  ];

  const handleToggle = useCallback(
    (key: string) => {
      const layer = key as 'temperature' | 'wind' | 'radar' | 'stations';
      setLayerVisible(layer, !state[`${layer}Visible`]);
    },
    [state, setLayerVisible]
  );

  const handleOpacityChange = useCallback(
    (key: string, opacity: number) => {
      const layer = key as 'temperature' | 'wind' | 'radar';
      setLayerOpacity(layer, opacity);
    },
    [setLayerOpacity]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950">
      {/* Map */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Loading */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-400 text-sm">Ladataan saakarttaa...</span>
          </div>
        </div>
      )}

      {mapReady && (
        <>
          {/* Canvas overlays */}
          <TemperatureOverlay
            map={mapInstance}
            observations={state.observations}
            forecast={state.forecast}
            forecastMode={state.forecastMode}
            forecastHourIndex={state.forecastHourIndex}
            visible={state.temperatureVisible}
            opacity={state.temperatureOpacity}
          />

          <WindOverlay
            map={mapInstance}
            observations={state.observations}
            forecast={state.forecast}
            forecastMode={state.forecastMode}
            forecastHourIndex={state.forecastHourIndex}
            visible={state.windVisible}
            opacity={state.windOpacity}
          />

          <RadarOverlay
            map={mapInstance}
            frames={state.radarFrames}
            visible={state.radarVisible}
            opacity={state.radarOpacity}
            playing={state.radarPlaying}
            frameIndex={state.radarFrameIndex}
            speed={state.radarSpeed}
            onFrameChange={setRadarFrame}
          />

          {/* Header */}
          <WeatherMapHeader lastUpdated={state.lastUpdated} />

          {/* Controls */}
          <WeatherMapControls
            layers={layerToggles}
            onToggle={handleToggle}
            onOpacityChange={handleOpacityChange}
            radarPlaying={state.radarPlaying}
            radarFrameIndex={state.radarFrameIndex}
            radarFrameCount={state.radarFrames.length}
            radarTimestamp={state.radarFrames[state.radarFrameIndex]?.timestamp || null}
            onRadarPlayToggle={() => setRadarPlaying(!state.radarPlaying)}
          />

          {/* Legends */}
          <div className="fixed left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4 sm:left-4">
            {state.temperatureVisible && <TemperatureLegend />}
            {state.windVisible && <WindLegend />}
          </div>

          {/* Summary */}
          {!state.forecastMode && <CurrentConditions observations={state.observations} />}

          {/* Time slider / forecast toggle */}
          <TimeSlider
            hours={state.forecastHours}
            currentIndex={state.forecastHourIndex}
            playing={state.forecastPlaying}
            forecastMode={state.forecastMode}
            onHourChange={setForecastHour}
            onPlayToggle={() => setForecastPlaying(!state.forecastPlaying)}
            onModeToggle={() => setForecastMode(!state.forecastMode)}
          />

          {/* Station popup */}
          {state.selectedStation && (
            <StationPopup
              station={state.selectedStation}
              onClose={() => setSelectedStation(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
