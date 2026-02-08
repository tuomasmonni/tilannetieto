'use client';

import { useEffect, useRef, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import { WindParticleSystem } from '@/lib/weather-map/wind-particles';
import type { WeatherMapObservation, ForecastPoint } from '@/lib/weather-map/types';

interface WindOverlayProps {
  map: mapboxgl.Map | null;
  observations: WeatherMapObservation[];
  forecast: ForecastPoint[];
  forecastMode: boolean;
  forecastHourIndex: number;
  visible: boolean;
  opacity: number;
}

export default function WindOverlay({
  map,
  observations,
  forecast,
  forecastMode,
  forecastHourIndex,
  visible,
  opacity,
}: WindOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<WindParticleSystem | null>(null);
  const isMovingRef = useRef(false);

  const updateWindField = useCallback(() => {
    const system = systemRef.current;
    const canvas = canvasRef.current;
    if (!system || !canvas || !map) return;

    const container = map.getContainer();
    const w = container.clientWidth;
    const h = container.clientHeight;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const project = (lngLat: [number, number]) => map.project(lngLat);

    let dataToUse: WeatherMapObservation[];

    if (forecastMode && forecast.length > 0) {
      dataToUse = forecast.map((point) => ({
        id: `fc_${point.lat}_${point.lon}`,
        lat: point.lat,
        lon: point.lon,
        temperature: null,
        windSpeed: point.hours[forecastHourIndex]?.windSpeed ?? null,
        windDirection: point.hours[forecastHourIndex]?.windDirection ?? null,
        humidity: null,
        precipitation: null,
        roadTemperature: null,
        visibility: null,
        stationName: '',
        source: 'fmi' as const,
        timestamp: '',
      }));
    } else {
      dataToUse = observations;
    }

    system.updateWindField(dataToUse, project, w, h);
  }, [map, observations, forecast, forecastMode, forecastHourIndex]);

  // Initialize particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const system = new WindParticleSystem();
    const isMobile = window.innerWidth < 768;
    system.init(canvas, isMobile);
    systemRef.current = system;

    return () => {
      system.destroy();
      systemRef.current = null;
    };
  }, []);

  // Start/stop animation based on visibility
  useEffect(() => {
    const system = systemRef.current;
    if (!system) return;

    if (visible && !isMovingRef.current) {
      updateWindField();
      system.start();
    } else {
      system.stop();
      if (!visible) system.clear();
    }
  }, [visible, updateWindField]);

  // Pause during map movement
  useEffect(() => {
    if (!map || !visible) return;

    const onMoveStart = () => {
      isMovingRef.current = true;
      systemRef.current?.stop();
    };

    const onMoveEnd = () => {
      isMovingRef.current = false;
      updateWindField();
      if (visible) systemRef.current?.start();
    };

    map.on('movestart', onMoveStart);
    map.on('moveend', onMoveEnd);
    map.on('resize', onMoveEnd);

    return () => {
      map.off('movestart', onMoveStart);
      map.off('moveend', onMoveEnd);
      map.off('resize', onMoveEnd);
    };
  }, [map, visible, updateWindField]);

  // Pause when tab is hidden
  useEffect(() => {
    const onVisibilityChange = () => {
      const system = systemRef.current;
      if (!system || !visible) return;

      if (document.hidden) {
        system.stop();
      } else if (!isMovingRef.current) {
        system.start();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        display: visible ? 'block' : 'none',
        zIndex: 2,
        opacity,
      }}
    />
  );
}
