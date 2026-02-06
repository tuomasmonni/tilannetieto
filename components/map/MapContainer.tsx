'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAP_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  MAP_STYLES,
  type MapTheme,
} from '@/lib/constants';

// Mapbox token from environment
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
console.log('Mapbox token loaded:', token ? 'Yes (length: ' + token.length + ')' : 'No');
mapboxgl.accessToken = token;

interface MapContainerProps {
  onMapReady?: (map: mapboxgl.Map) => void;
  children?: React.ReactNode;
  theme?: MapTheme;
}

export default function MapContainer({ onMapReady, children, theme = 'dark' }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Vaihda kartan tyyli kun theme muuttuu (säilytä layerit diff:llä)
  useEffect(() => {
    if (map.current && isLoaded) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map.current as any).setStyle(MAP_STYLES[theme], { diff: true });
    }
  }, [theme, isLoaded]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Luo kartta
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[theme],
      center: MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      // maxBounds poistettu - mahdollistaa vapaan zoomauksen
      attributionControl: false,
    });

    const mapInstance = map.current;

    // Lisää kontrollit
    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    mapInstance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    mapInstance.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    // Piilota tienumerot ja muut häiritsevät elementit
    const hideRoadLabels = () => {
      const layersToHide = [
        'road-number-shield',
        'road-exit-shield',
        'highway-shield',
        'highway-shield-text',
        'road-label-small',
        'road-label-medium',
        'road-label-large',
      ];

      layersToHide.forEach(layerId => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });
    };

    // Kun kartta on ladattu
    mapInstance.on('load', () => {
      console.log('Mapbox map loaded successfully');
      hideRoadLabels();
      setIsLoaded(true);
      onMapReady?.(mapInstance);
    });

    // Piilota tienumerot myös kun tyyli vaihtuu
    mapInstance.on('style.load', () => {
      hideRoadLabels();
    });

    // Virheiden kuuntelu
    mapInstance.on('error', (e) => {
      console.error('Mapbox error:', e);
    });

    // Cleanup
    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [onMapReady]);

  return (
    <>
      <div className="relative w-full h-full" style={{ minHeight: '100vh' }}>
        <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
      </div>
      {isLoaded && children}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-400 text-sm">Ladataan karttaa...</span>
          </div>
        </div>
      )}
    </>
  );
}
