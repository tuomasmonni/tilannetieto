'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { RADAR_CONFIG } from '@/lib/weather-map/constants';
import type { RadarFrame } from '@/lib/weather-map/types';

interface RadarOverlayProps {
  map: mapboxgl.Map | null;
  frames: RadarFrame[];
  visible: boolean;
  opacity: number;
  playing: boolean;
  frameIndex: number;
  speed: number;
  onFrameChange: (index: number) => void;
}

const RADAR_SOURCE = 'radar-source';
const RADAR_LAYER = 'radar-layer';

export default function RadarOverlay({
  map,
  frames,
  visible,
  opacity,
  playing,
  frameIndex,
  speed,
  onFrameChange,
}: RadarOverlayProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const currentFrameRef = useRef(frameIndex);

  useEffect(() => {
    currentFrameRef.current = frameIndex;
  }, [frameIndex]);

  // Add/update radar image source
  useEffect(() => {
    if (!map || frames.length === 0) return;

    const { bounds } = RADAR_CONFIG;
    const currentUrl = frames[frameIndex]?.url;
    if (!currentUrl) return;

    const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
      [bounds.west, bounds.north], // top-left
      [bounds.east, bounds.north], // top-right
      [bounds.east, bounds.south], // bottom-right
      [bounds.west, bounds.south], // bottom-left
    ];

    const source = map.getSource(RADAR_SOURCE) as mapboxgl.ImageSource;

    if (source) {
      source.updateImage({ url: currentUrl, coordinates });
    } else {
      map.addSource(RADAR_SOURCE, {
        type: 'image',
        url: currentUrl,
        coordinates,
      });

      map.addLayer({
        id: RADAR_LAYER,
        type: 'raster',
        source: RADAR_SOURCE,
        paint: {
          'raster-opacity': opacity,
          'raster-fade-duration': 0,
        },
      });
    }

    // Update visibility
    if (map.getLayer(RADAR_LAYER)) {
      map.setLayoutProperty(RADAR_LAYER, 'visibility', visible ? 'visible' : 'none');
      map.setPaintProperty(RADAR_LAYER, 'raster-opacity', opacity);
    }
  }, [map, frames, frameIndex, visible, opacity]);

  // Animation loop
  useEffect(() => {
    if (!playing || frames.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const nextIndex = (currentFrameRef.current + 1) % frames.length;
      onFrameChange(nextIndex);
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, frames.length, speed, onFrameChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      if (map.getLayer(RADAR_LAYER)) map.removeLayer(RADAR_LAYER);
      if (map.getSource(RADAR_SOURCE)) map.removeSource(RADAR_SOURCE);
    };
  }, [map]);

  return null;
}
