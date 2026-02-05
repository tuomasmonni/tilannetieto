'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { CRIME_CATEGORIES, AVAILABLE_YEARS, type MapTheme, type EventCategory } from '@/lib/constants';

// ============================================
// RE-EXPORT CONSTANTS
// ============================================

export { CRIME_CATEGORIES, AVAILABLE_YEARS };

// ============================================
// STATE INTERFACES
// ============================================

export type TransitVehicleType = 'bus' | 'tram' | 'metro' | 'train';
export type WeatherMetric = 'temperature' | 'wind' | 'precipitation';

interface UnifiedFilterState {
  // Rikostilastot
  crime: {
    year: string;
    categories: string[];
    layerVisible: boolean;
    isLoading: boolean;
    displayMode: 'absolute' | 'perCapita';
  };

  // Liikenne (Fintraffic)
  traffic: {
    timeRange: '2h' | '8h' | '24h' | '7d' | 'all';
    categories: EventCategory[];
    layerVisible: boolean;
  };

  // Sää (FMI)
  weather: {
    layerVisible: boolean;
    metric: WeatherMetric;
  };

  // Joukkoliikenne (HSL)
  transit: {
    layerVisible: boolean;
    vehicleTypes: TransitVehicleType[];
  };

  // Tiesää (Digitraffic)
  roadWeather: {
    layerVisible: boolean;
  };

  // Kelikamerat (Digitraffic)
  weatherCamera: {
    layerVisible: boolean;
    selectedStationId: string | null;
  };

  // Yleiset asetukset
  theme: MapTheme;
}

// ============================================
// ACTIONS INTERFACE
// ============================================

interface UnifiedFilterActions {
  // Crime actions
  setCrimeYear: (year: string) => void;
  setCrimeCategories: (categories: string[]) => void;
  toggleCrimeCategory: (code: string) => void;
  setCrimeLayerVisible: (visible: boolean) => void;
  setCrimeLoading: (loading: boolean) => void;
  setCrimeDisplayMode: (mode: 'absolute' | 'perCapita') => void;

  // Traffic actions
  setTrafficTimeRange: (timeRange: '2h' | '8h' | '24h' | '7d' | 'all') => void;
  toggleTrafficCategory: (category: EventCategory) => void;
  setTrafficLayerVisible: (visible: boolean) => void;

  // Weather actions
  setWeatherLayerVisible: (visible: boolean) => void;
  setWeatherMetric: (metric: WeatherMetric) => void;

  // Transit actions
  setTransitLayerVisible: (visible: boolean) => void;
  toggleTransitVehicleType: (type: TransitVehicleType) => void;

  // Road weather actions
  setRoadWeatherLayerVisible: (visible: boolean) => void;

  // Weather camera actions
  setWeatherCameraLayerVisible: (visible: boolean) => void;
  setSelectedWeatherCamera: (stationId: string | null) => void;

  // General actions
  setTheme: (theme: MapTheme) => void;
  resetFilters: () => void;
}

// ============================================
// DEFAULT STATE
// ============================================

const DEFAULT_STATE: UnifiedFilterState = {
  crime: {
    year: '2024',
    categories: ['SSS'],
    layerVisible: false,
    isLoading: false,
    displayMode: 'absolute',
  },
  traffic: {
    timeRange: 'all',
    categories: ['accident', 'disruption', 'roadwork', 'weather'],
    layerVisible: false,
  },
  weather: {
    layerVisible: false,
    metric: 'temperature',
  },
  transit: {
    layerVisible: false,
    vehicleTypes: ['bus', 'tram', 'metro', 'train'],
  },
  roadWeather: {
    layerVisible: false,
  },
  weatherCamera: {
    layerVisible: false,
    selectedStationId: null,
  },
  theme: 'dark',
};

// ============================================
// CONTEXT
// ============================================

const UnifiedFilterContext = createContext<
  (UnifiedFilterState & UnifiedFilterActions) | null
>(null);

// ============================================
// PROVIDER
// ============================================

interface UnifiedFilterProviderProps {
  children: ReactNode;
}

export function UnifiedFilterProvider({ children }: UnifiedFilterProviderProps) {
  const [state, setState] = useState<UnifiedFilterState>(DEFAULT_STATE);

  // ========== CRIME ACTIONS ==========

  const setCrimeYear = useCallback((year: string) => {
    setState(prev => ({
      ...prev,
      crime: { ...prev.crime, year },
    }));
  }, []);

  const setCrimeCategories = useCallback((categories: string[]) => {
    setState(prev => ({
      ...prev,
      crime: { ...prev.crime, categories },
    }));
  }, []);

  const toggleCrimeCategory = useCallback((code: string) => {
    setState(prev => {
      const currentCategories = prev.crime.categories;
      const isSelected = currentCategories.includes(code);

      // SSS logic: SSS is "all crimes", can't combine with others
      if (code === 'SSS') {
        return {
          ...prev,
          crime: {
            ...prev.crime,
            categories: isSelected ? [] : ['SSS'],
          },
        };
      }

      // Toggle other categories
      let newCategories: string[];
      if (isSelected) {
        newCategories = currentCategories.filter(c => c !== code);
      } else {
        // Remove SSS if selecting specific category
        newCategories = [
          ...currentCategories.filter(c => c !== 'SSS'),
          code,
        ];
      }

      return {
        ...prev,
        crime: { ...prev.crime, categories: newCategories },
      };
    });
  }, []);

  // Helper: sammuta kaikki muut layerit kun yksi aktivoidaan
  const turnOffOtherLayers = useCallback((activeLayer: string) => {
    return (prev: UnifiedFilterState): UnifiedFilterState => ({
      ...prev,
      crime: { ...prev.crime, layerVisible: activeLayer === 'crime' },
      traffic: { ...prev.traffic, layerVisible: activeLayer === 'traffic' },
      weather: { ...prev.weather, layerVisible: activeLayer === 'weather' },
      transit: { ...prev.transit, layerVisible: activeLayer === 'transit' },
      roadWeather: { ...prev.roadWeather, layerVisible: activeLayer === 'roadWeather' },
      weatherCamera: { ...prev.weatherCamera, layerVisible: activeLayer === 'weatherCamera' },
    });
  }, []);

  const setCrimeLayerVisible = useCallback((visible: boolean) => {
    setState(prev => visible ? turnOffOtherLayers('crime')(prev) : ({
      ...prev,
      crime: { ...prev.crime, layerVisible: false },
    }));
  }, [turnOffOtherLayers]);

  const setCrimeLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      crime: { ...prev.crime, isLoading: loading },
    }));
  }, []);

  const setCrimeDisplayMode = useCallback((mode: 'absolute' | 'perCapita') => {
    setState(prev => ({
      ...prev,
      crime: { ...prev.crime, displayMode: mode },
    }));
  }, []);

  // ========== TRAFFIC ACTIONS ==========

  const setTrafficTimeRange = useCallback((timeRange: '2h' | '8h' | '24h' | '7d' | 'all') => {
    setState(prev => ({
      ...prev,
      traffic: { ...prev.traffic, timeRange },
    }));
  }, []);

  const toggleTrafficCategory = useCallback((category: EventCategory) => {
    setState(prev => {
      const cats = prev.traffic.categories;
      const newCats = cats.includes(category)
        ? cats.filter(c => c !== category)
        : [...cats, category];
      return {
        ...prev,
        traffic: { ...prev.traffic, categories: newCats },
      };
    });
  }, []);

  const setTrafficLayerVisible = useCallback((visible: boolean) => {
    setState(prev => visible ? turnOffOtherLayers('traffic')(prev) : ({
      ...prev,
      traffic: { ...prev.traffic, layerVisible: false },
    }));
  }, [turnOffOtherLayers]);

  // ========== WEATHER ACTIONS ==========

  const setWeatherLayerVisible = useCallback((visible: boolean) => {
    setState(prev => visible ? turnOffOtherLayers('weather')(prev) : ({
      ...prev,
      weather: { ...prev.weather, layerVisible: false },
    }));
  }, [turnOffOtherLayers]);

  const setWeatherMetric = useCallback((metric: WeatherMetric) => {
    setState(prev => ({
      ...prev,
      weather: { ...prev.weather, metric },
    }));
  }, []);

  // ========== TRANSIT ACTIONS ==========

  const setTransitLayerVisible = useCallback((visible: boolean) => {
    setState(prev => visible ? turnOffOtherLayers('transit')(prev) : ({
      ...prev,
      transit: { ...prev.transit, layerVisible: false },
    }));
  }, [turnOffOtherLayers]);

  const toggleTransitVehicleType = useCallback((type: TransitVehicleType) => {
    setState(prev => {
      const types = prev.transit.vehicleTypes;
      const newTypes = types.includes(type)
        ? types.filter(t => t !== type)
        : [...types, type];
      return {
        ...prev,
        transit: { ...prev.transit, vehicleTypes: newTypes },
      };
    });
  }, []);

  // ========== ROAD WEATHER ACTIONS ==========

  const setRoadWeatherLayerVisible = useCallback((visible: boolean) => {
    setState(prev => visible ? turnOffOtherLayers('roadWeather')(prev) : ({
      ...prev,
      roadWeather: { ...prev.roadWeather, layerVisible: false },
    }));
  }, [turnOffOtherLayers]);

  // ========== WEATHER CAMERA ACTIONS ==========

  const setWeatherCameraLayerVisible = useCallback((visible: boolean) => {
    setState(prev => visible ? turnOffOtherLayers('weatherCamera')(prev) : ({
      ...prev,
      weatherCamera: { ...prev.weatherCamera, layerVisible: false },
    }));
  }, [turnOffOtherLayers]);

  const setSelectedWeatherCamera = useCallback((stationId: string | null) => {
    setState(prev => ({
      ...prev,
      weatherCamera: { ...prev.weatherCamera, selectedStationId: stationId },
    }));
  }, []);

  // ========== GENERAL ACTIONS ==========

  const setTheme = useCallback((theme: MapTheme) => {
    setState(prev => ({ ...prev, theme }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // ========== CONTEXT VALUE ==========

  const value = {
    ...state,
    setCrimeYear,
    setCrimeCategories,
    toggleCrimeCategory,
    setCrimeLayerVisible,
    setCrimeLoading,
    setCrimeDisplayMode,
    setTrafficTimeRange,
    toggleTrafficCategory,
    setTrafficLayerVisible,
    setWeatherLayerVisible,
    setWeatherMetric,
    setTransitLayerVisible,
    toggleTransitVehicleType,
    setRoadWeatherLayerVisible,
    setWeatherCameraLayerVisible,
    setSelectedWeatherCamera,
    setTheme,
    resetFilters,
  };

  return (
    <UnifiedFilterContext.Provider value={value}>
      {children}
    </UnifiedFilterContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useUnifiedFilters() {
  const context = useContext(UnifiedFilterContext);
  if (!context) {
    throw new Error(
      'useUnifiedFilters must be used within UnifiedFilterProvider'
    );
  }
  return context;
}
