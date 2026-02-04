'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import { fetchCrimeMapData } from '@/lib/data/crime';
import type { CrimeMapGeoJSON } from '@/lib/data/crime/api';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

interface CrimeLayerProps {
  map: mapboxgl.Map | null;
}

// Väriskaala kategorioittain (quantile-pohjainen)
const CATEGORY_COLORS: Record<string, string> = {
  low: '#c6efce',       // Vihreä - matala
  medium: '#ffeb9c',    // Keltainen - keskitaso
  high: '#ffc7ce',      // Oranssi - korkea
  very_high: '#ff6b6b', // Punainen - erittäin korkea
};

// Debounce-funktio API-kutsujen rajoittamiseen
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function CrimeLayer({ map }: CrimeLayerProps) {
  const { crime, setCrimeLoading } = useUnifiedFilters();
  const { year, categories: crimeCategories, layerVisible, isLoading } = crime;
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<CrimeMapGeoJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredStateId = useRef<string | null>(null);

  // Debounce filtterit 300ms viiveellä
  const debouncedYear = useDebounce(year, 300);
  const debouncedCategories = useDebounce(crimeCategories, 300);

  // Hae data kun filtterit muuttuvat
  useEffect(() => {
    // Jos ei yhtään kategoriaa valittuna, tyhjennä data
    if (debouncedCategories.length === 0) {
      setData(null);
      console.log('Ei kategorioita valittuna - tyhjennetään data');
      return;
    }

    const loadData = async () => {
      try {
        setCrimeLoading(true);
        console.log('Fetching crime map data:', { year: debouncedYear, categories: debouncedCategories });
        const crimeData = await fetchCrimeMapData(debouncedYear, debouncedCategories);
        console.log('Crime data loaded:', crimeData.metadata);
        setData(crimeData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch crime data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setCrimeLoading(false);
      }
    };

    loadData();
  }, [debouncedYear, debouncedCategories, setCrimeLoading]);

  // Lisää kerros kartalle
  useEffect(() => {
    if (!map || !data) return;

    const addLayer = () => {
      try {
        // Lisää tai päivitä lähde
        const existingSource = map.getSource('crime-municipalities') as mapboxgl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(data as GeoJSON.FeatureCollection);
          return;
        }

        // Luo uusi lähde
        map.addSource('crime-municipalities', {
          type: 'geojson',
          data: data as GeoJSON.FeatureCollection,
          generateId: true, // Tarvitaan hover-tilalle
        });

        // Lisää täyttökerros (choropleth)
        map.addLayer({
          id: 'crime-fill',
          type: 'fill',
          source: 'crime-municipalities',
          paint: {
            'fill-color': [
              'match',
              ['get', 'category'],
              'low', CATEGORY_COLORS.low,
              'medium', CATEGORY_COLORS.medium,
              'high', CATEGORY_COLORS.high,
              'very_high', CATEGORY_COLORS.very_high,
              '#808080' // Default (tuntematon)
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.9,
              0.7
            ],
          },
        });

        // Lisää reunaviivat - tema-agnostiikka
        // Käytä tummaa väriä hovernissa ja erittäin vaaleataa normaalissa tilassa
        map.addLayer({
          id: 'crime-outline',
          type: 'line',
          source: 'crime-municipalities',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#1f2937',  // Tumma hovernissa (näkyy myös vaalealla taustalla)
              '#d1d5db'   // Vaalea normaalissa (näkyy myös tummalla taustalla)
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              2.5,
              1
            ],
          },
        });

        setLoaded(true);
        console.log('Crime layer added to map');
      } catch (err) {
        console.error('Failed to add crime layer:', err);
      }
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('load', addLayer);
    }
  }, [map, data]);

  // Päivitä data kun se muuttuu (ja kerros on jo ladattu)
  useEffect(() => {
    if (!map || !data || !loaded) return;

    const source = map.getSource('crime-municipalities') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(data as GeoJSON.FeatureCollection);
    }
  }, [map, data, loaded]);

  // Hover-toiminnallisuus ja tooltip
  useEffect(() => {
    if (!map || !loaded) return;

    // Luo popup
    const mapboxgl = require('mapbox-gl');
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'crime-tooltip',
    });
    popupRef.current = popup;

    const onMouseMove = (e: any) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;
      const featureId = feature.id;

      // Päivitä hover-tila (Mapbox GL v3 API)
      if (hoveredStateId.current !== null && hoveredStateId.current !== featureId) {
        map.setFeatureState(
          { source: 'crime-municipalities', id: hoveredStateId.current } as any,
          { hover: false }
        );
      }
      if (featureId !== undefined) {
        hoveredStateId.current = featureId;
        map.setFeatureState(
          { source: 'crime-municipalities', id: featureId } as any,
          { hover: true }
        );
      }

      // Näytä tooltip
      const html = `
        <div class="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-lg shadow-lg border border-zinc-700">
          <div class="font-semibold">${props?.nimi || 'Tuntematon'}</div>
          <div class="text-sm text-zinc-300 mt-1">
            <span class="font-medium">${(props?.totalCrimes || 0).toLocaleString('fi-FI')}</span> rikosta
          </div>
          <div class="text-xs text-zinc-500 mt-0.5">Vuosi ${props?.year || year}</div>
        </div>
      `;

      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      map.getCanvas().style.cursor = 'pointer';
    };

    const onMouseLeave = () => {
      if (hoveredStateId.current !== null) {
        map.setFeatureState(
          { source: 'crime-municipalities', id: hoveredStateId.current } as any,
          { hover: false }
        );
      }
      hoveredStateId.current = null;
      popup.remove();
      map.getCanvas().style.cursor = '';
    };

    map.on('mousemove', 'crime-fill', onMouseMove);
    map.on('mouseleave', 'crime-fill', onMouseLeave);

    return () => {
      map.off('mousemove', 'crime-fill', onMouseMove);
      map.off('mouseleave', 'crime-fill', onMouseLeave);
      popup.remove();
    };
  }, [map, loaded, year]);

  // Näkyvyyden hallinta
  useEffect(() => {
    if (!map || !loaded) return;

    // Piilota jos: toggle OFF tai ei kategorioita valittuna
    const shouldShow = layerVisible && crimeCategories.length > 0;
    const visibility = shouldShow ? 'visible' : 'none';
    const layers = ['crime-fill', 'crime-outline'];

    for (const layerId of layers) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }
  }, [map, layerVisible, crimeCategories.length, loaded]);

  // Debug-info
  if (error) {
    console.error('CrimeLayer error:', error);
  }

  return null;
}

export default CrimeLayer;
