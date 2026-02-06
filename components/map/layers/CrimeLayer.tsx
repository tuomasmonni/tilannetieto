'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import { fetchCrimeMapData } from '@/lib/data/crime';
import type { CrimeMapGeoJSON } from '@/lib/data/crime/api';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import CrimeMunicipalityDetail from '@/components/ui/CrimeMunicipalityDetail';

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
  const { year, categories: crimeCategories, layerVisible, isLoading, displayMode } = crime;
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<CrimeMapGeoJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredStateId = useRef<string | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<{
    name: string;
    year: number;
    breakdown: Record<string, number>;
    population?: number;
    screenPosition?: { x: number; y: number };
  } | null>(null);

  // Debounce filtterit 300ms viiveellä (displayMode EI debouncea - instant feedback)
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
        const usePerCapita = displayMode === 'perCapita';
        console.log('Fetching crime map data:', {
          year: debouncedYear,
          categories: debouncedCategories,
          usePerCapita
        });
        const crimeData = await fetchCrimeMapData(
          debouncedYear,
          debouncedCategories,
          true, // useStaticData
          usePerCapita
        );
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
  }, [debouncedYear, debouncedCategories, displayMode, setCrimeLoading]);

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

      // Määritä näytettävä arvo riippuen moodista
      let displayValue: string;
      if (displayMode === 'perCapita') {
        const perCapita = props?.crimesPerCapita;
        displayValue = perCapita !== undefined && perCapita !== null
          ? `${perCapita.toFixed(1)} / 100k as.`
          : 'Ei väestödataa';
      } else {
        displayValue = `${(props?.totalCrimes || 0).toLocaleString('fi-FI')} rikosta`;
      }

      // Näytä tooltip - Glassmorphism-tyyli (toimii kaikilla taustoilla)
      const html = `
        <div class="
          backdrop-blur-md bg-white/95 dark:bg-gray-900/95
          text-gray-900 dark:text-gray-100
          px-3 py-2 sm:px-4 sm:py-2.5
          rounded-xl shadow-2xl
          border border-gray-200/50 dark:border-gray-700/50
          min-w-[180px] sm:min-w-[200px]
        ">
          <div class="font-semibold text-sm sm:text-base">${props?.nimi || 'Tuntematon'}</div>
          <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span class="font-medium text-gray-900 dark:text-gray-100">${displayValue}</span>
          </div>
          <div class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vuosi ${props?.year || year}</div>
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

    const onClick = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const props = e.features[0].properties;

      let breakdown: Record<string, number> = {};
      if (props.crimeBreakdown) {
        try {
          breakdown = typeof props.crimeBreakdown === 'string'
            ? JSON.parse(props.crimeBreakdown)
            : props.crimeBreakdown;
        } catch { /* ignore */ }
      }

      // Fallback: if no breakdown data, show at least the total
      if (Object.keys(breakdown).length === 0) {
        breakdown = { SSS: props.totalCrimes || 0 };
      }

      setSelectedMunicipality({
        name: props.nimi || 'Tuntematon',
        year: props.year || parseInt(year),
        breakdown,
        population: props.population,
        screenPosition: { x: e.point.x, y: e.point.y },
      });

      // Remove hover tooltip when clicking
      popup.remove();
    };

    map.on('mousemove', 'crime-fill', onMouseMove);
    map.on('mouseleave', 'crime-fill', onMouseLeave);
    map.on('click', 'crime-fill', onClick);

    return () => {
      map.off('mousemove', 'crime-fill', onMouseMove);
      map.off('mouseleave', 'crime-fill', onMouseLeave);
      map.off('click', 'crime-fill', onClick);
      popup.remove();
    };
  }, [map, loaded, year, displayMode]);

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

  if (!selectedMunicipality) return null;

  return (
    <CrimeMunicipalityDetail
      municipalityName={selectedMunicipality.name}
      year={selectedMunicipality.year}
      breakdown={selectedMunicipality.breakdown}
      population={selectedMunicipality.population}
      screenPosition={selectedMunicipality.screenPosition}
      onClose={() => setSelectedMunicipality(null)}
    />
  );
}

export default CrimeLayer;
