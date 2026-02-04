'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { CRIME_CATEGORIES, AVAILABLE_YEARS, type MapTheme } from '@/lib/constants';
import type { EventCategory } from '@/lib/constants';

// ============================================
// RE-EXPORT CONSTANTS
// ============================================

export { CRIME_CATEGORIES, AVAILABLE_YEARS };

// ============================================
// STATE INTERFACES
// ============================================

interface UnifiedFilterState {
  // Rikostilastot
  crime: {
    year: string;
    categories: string[];
    layerVisible: boolean;
    isLoading: boolean;
  };

  // Liikenne
  traffic: {
    timeRange: '2h' | '8h' | '24h' | '7d' | 'all';
    categories: EventCategory[];
    layerVisible: boolean;
  };

  // Sää (FMI)
  weather: {
    layerVisible: boolean;
    metric: 'temperature' | 'wind' | 'precipitation';
  };

  // Joukkoliikenne (HSL)
  transit: {
    layerVisible: boolean;
    vehicleTypes: ('bus' | 'tram' | 'metro' | 'train')[];
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

  // Traffic actions
  setTrafficTimeRange: (range: '2h' | '8h' | '24h' | '7d' | 'all') => void;
  setTrafficCategories: (categories: EventCategory[]) => void;
  toggleTrafficCategory: (category: EventCategory) => void;
  setTrafficLayerVisible: (visible: boolean) => void;

  // Weather actions
  setWeatherLayerVisible: (visible: boolean) => void;
  setWeatherMetric: (metric: 'temperature' | 'wind' | 'precipitation') => void;

  // Transit actions
  setTransitLayerVisible: (visible: boolean) => void;
  setTransitVehicleTypes: (types: ('bus' | 'tram' | 'metro' | 'train')[]) => void;
  toggleTransitVehicleType: (type: 'bus' | 'tram' | 'metro' | 'train') => void;

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
  },
  traffic: {
    timeRange: 'all',
    categories: ['accident', 'disruption', 'roadwork', 'weather', 'train', 'police', 'fire', 'transit'],
    layerVisible: true,
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

  const setCrimeLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      crime: { ...prev.crime, layerVisible: visible },
    }));
  }, []);

  const setCrimeLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      crime: { ...prev.crime, isLoading: loading },
    }));
  }, []);

  // ========== TRAFFIC ACTIONS ==========

  const setTrafficTimeRange = useCallback(
    (timeRange: '2h' | '8h' | '24h' | '7d' | 'all') => {
      setState(prev => ({
        ...prev,
        traffic: { ...prev.traffic, timeRange },
      }));
    },
    []
  );

  const setTrafficCategories = useCallback((categories: EventCategory[]) => {
    setState(prev => ({
      ...prev,
      traffic: { ...prev.traffic, categories },
    }));
  }, []);

  const toggleTrafficCategory = useCallback((category: EventCategory) => {
    setState(prev => {
      const currentCategories = prev.traffic.categories;
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];

      return {
        ...prev,
        traffic: { ...prev.traffic, categories: newCategories },
      };
    });
  }, []);

  const setTrafficLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      traffic: { ...prev.traffic, layerVisible: visible },
    }));
  }, []);

  // ========== WEATHER ACTIONS ==========

  const setWeatherLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      weather: { ...prev.weather, layerVisible: visible },
    }));
  }, []);

  const setWeatherMetric = useCallback((metric: 'temperature' | 'wind' | 'precipitation') => {
    setState(prev => ({
      ...prev,
      weather: { ...prev.weather, metric },
    }));
  }, []);

  // ========== TRANSIT ACTIONS ==========

  const setTransitLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      transit: { ...prev.transit, layerVisible: visible },
    }));
  }, []);

  const setTransitVehicleTypes = useCallback(
    (types: ('bus' | 'tram' | 'metro' | 'train')[]) => {
      setState(prev => ({
        ...prev,
        transit: { ...prev.transit, vehicleTypes: types },
      }));
    },
    []
  );

  const toggleTransitVehicleType = useCallback(
    (type: 'bus' | 'tram' | 'metro' | 'train') => {
      setState(prev => {
        const currentTypes = prev.transit.vehicleTypes;
        const newTypes = currentTypes.includes(type)
          ? currentTypes.filter(t => t !== type)
          : [...currentTypes, type];

        return {
          ...prev,
          transit: { ...prev.transit, vehicleTypes: newTypes },
        };
      });
    },
    []
  );

  // ========== ROAD WEATHER ACTIONS ==========

  const setRoadWeatherLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      roadWeather: { ...prev.roadWeather, layerVisible: visible },
    }));
  }, []);

  // ========== WEATHER CAMERA ACTIONS ==========

  const setWeatherCameraLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      weatherCamera: { ...prev.weatherCamera, layerVisible: visible },
    }));
  }, []);

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
    setTrafficTimeRange,
    setTrafficCategories,
    toggleTrafficCategory,
    setTrafficLayerVisible,
    setWeatherLayerVisible,
    setWeatherMetric,
    setTransitLayerVisible,
    setTransitVehicleTypes,
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
