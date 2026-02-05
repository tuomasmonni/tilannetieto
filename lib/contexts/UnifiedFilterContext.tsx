'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { CRIME_CATEGORIES, AVAILABLE_YEARS, type MapTheme } from '@/lib/constants';

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
    displayMode: 'absolute' | 'perCapita';
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
  weatherCamera: {
    layerVisible: true, // Kelikamerat oletuksena PÄÄLLÄ
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

  const setCrimeDisplayMode = useCallback((mode: 'absolute' | 'perCapita') => {
    setState(prev => ({
      ...prev,
      crime: { ...prev.crime, displayMode: mode },
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
    setCrimeDisplayMode,
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
