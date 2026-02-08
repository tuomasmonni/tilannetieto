'use client';

import { useEffect, useRef, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import { renderTemperatureIDW, observationsToPixelStations } from '@/lib/weather-map/idw';
import type { WeatherMapObservation, ForecastPoint } from '@/lib/weather-map/types';

interface TemperatureOverlayProps {
  map: mapboxgl.Map | null;
  observations: WeatherMapObservation[];
  forecast: ForecastPoint[];
  forecastMode: boolean;
  forecastHourIndex: number;
  visible: boolean;
  opacity: number;
}

export default function TemperatureOverlay({
  map,
  observations,
  forecast,
  forecastMode,
  forecastHourIndex,
  visible,
  opacity,
}: TemperatureOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const render = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !map) return;

      const container = map.getContainer();
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      // Resize canvas if needed
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const project = (lngLat: [number, number]) => map.project(lngLat);

      let dataToRender: WeatherMapObservation[];

      if (forecastMode && forecast.length > 0) {
        // Use forecast data: convert grid points to pseudo-observations
        dataToRender = forecast.map((point) => ({
          id: `fc_${point.lat}_${point.lon}`,
          lat: point.lat,
          lon: point.lon,
          temperature: point.hours[forecastHourIndex]?.temperature ?? null,
          windSpeed: point.hours[forecastHourIndex]?.windSpeed ?? null,
          windDirection: point.hours[forecastHourIndex]?.windDirection ?? null,
          humidity: null,
          precipitation: null,
          roadTemperature: null,
          visibility: null,
          stationName: '',
          source: 'fmi' as const,
          timestamp: point.hours[forecastHourIndex]?.time ?? '',
        }));
      } else {
        dataToRender = observations;
      }

      const stations = observationsToPixelStations(dataToRender, project, 'temperature');

      const alpha = Math.round(opacity * 255);
      renderTemperatureIDW(canvas, stations, alpha);
    } catch (err) {
      console.error('TemperatureOverlay render error:', err);
    }
  }, [map, observations, forecast, forecastMode, forecastHourIndex, opacity]);

  // Render on data change
  useEffect(() => {
    if (!visible) return;
    render();
  }, [visible, render]);

  // Re-render on map move (debounced)
  useEffect(() => {
    if (!map || !visible) return;

    const onMove = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(render, 100);
    };

    map.on('moveend', onMove);
    map.on('zoomend', onMove);
    map.on('resize', onMove);

    return () => {
      map.off('moveend', onMove);
      map.off('zoomend', onMove);
      map.off('resize', onMove);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, visible, render]);

  // Clear canvas when hidden
  useEffect(() => {
    if (!visible && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        display: visible ? 'block' : 'none',
        zIndex: 1,
        mixBlendMode: 'normal',
      }}
    />
  );
}
