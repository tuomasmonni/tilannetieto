'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  CRIME_CATEGORIES,
  AVAILABLE_YEARS,
  LAYER_GROUPS,
  type MapTheme,
  type EventCategory,
  type NewsCategoryKey,
  type NewsSourceKey,
  type LayerGroupKey,
  type LayerKey,
} from '@/lib/constants';

// ============================================
// RE-EXPORT CONSTANTS
// ============================================

export { CRIME_CATEGORIES, AVAILABLE_YEARS };

// ============================================
// STATE INTERFACES
// ============================================

export type TransitVehicleType = 'bus' | 'tram' | 'metro' | 'train';
export type TrainType = 'IC' | 'S' | 'Pendolino' | 'commuter' | 'cargo';
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

  // Saa (FMI)
  weather: {
    layerVisible: boolean;
    metric: WeatherMetric;
  };

  // Joukkoliikenne (HSL)
  transit: {
    layerVisible: boolean;
    vehicleTypes: TransitVehicleType[];
  };

  // Tiesaa (Digitraffic)
  roadWeather: {
    layerVisible: boolean;
  };

  // Kelikamerat (Digitraffic)
  weatherCamera: {
    layerVisible: boolean;
    selectedStationId: string | null;
  };

  // Uutiset (RSS + AI)
  news: {
    layerVisible: boolean;
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
    sources: NewsSourceKey[];
    categories: NewsCategoryKey[];
    searchQuery: string;
  };

  // Junaseuranta (rata.digitraffic.fi)
  train: {
    layerVisible: boolean;
    trainTypes: TrainType[];
  };

  // Lumitilanne (FMI)
  snow: {
    layerVisible: boolean;
  };

  // Eduskuntavaalit
  election: {
    year: string;
    layerVisible: boolean;
  };

  // Yhdistykset (PRH)
  associations: {
    layerVisible: boolean;
    displayMode: 'count' | 'perCapita';
  };

  // Yleiset asetukset
  theme: MapTheme;

  // Category Navigator
  activeGroup: LayerGroupKey | null;
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

  // News actions
  setNewsLayerVisible: (visible: boolean) => void;
  setNewsTimeRange: (timeRange: '1h' | '6h' | '24h' | '7d' | '30d') => void;
  toggleNewsSource: (source: NewsSourceKey) => void;
  toggleNewsCategory: (category: NewsCategoryKey) => void;
  setNewsSearchQuery: (query: string) => void;

  // Train actions
  setTrainLayerVisible: (visible: boolean) => void;
  toggleTrainType: (type: TrainType) => void;

  // Snow actions
  setSnowLayerVisible: (visible: boolean) => void;

  // Election actions
  setElectionYear: (year: string) => void;
  setElectionLayerVisible: (visible: boolean) => void;

  // Associations actions
  setAssociationsLayerVisible: (visible: boolean) => void;
  setAssociationsDisplayMode: (mode: 'count' | 'perCapita') => void;

  // General actions
  setTheme: (theme: MapTheme) => void;
  resetFilters: () => void;

  // Group actions
  setActiveGroup: (group: LayerGroupKey | null) => void;
  getActiveLayerCount: (group: LayerGroupKey) => number;
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
  news: {
    layerVisible: false,
    timeRange: '24h',
    sources: ['yle', 'iltalehti', 'mtv'],
    categories: ['liikenne', 'rikos', 'politiikka', 'terveys', 'ymparisto', 'talous', 'urheilu', 'onnettomuus', 'muu'],
    searchQuery: '',
  },
  train: {
    layerVisible: false,
    trainTypes: ['IC', 'S', 'Pendolino', 'commuter'],
  },
  snow: {
    layerVisible: false,
  },
  election: {
    year: '2023',
    layerVisible: false,
  },
  associations: {
    layerVisible: false,
    displayMode: 'count',
  },
  theme: 'dark',
  activeGroup: null,
};

// ============================================
// CONTEXT
// ============================================

const UnifiedFilterContext = createContext<
  (UnifiedFilterState & UnifiedFilterActions) | null
>(null);

// ============================================
// HELPERS
// ============================================

function getLayerVisibleKey(layer: LayerKey): keyof UnifiedFilterState {
  return layer;
}

function turnOffGroupLayers(state: UnifiedFilterState, group: LayerGroupKey): UnifiedFilterState {
  const layers = LAYER_GROUPS[group].layers;
  let newState = { ...state };
  for (const layer of layers) {
    const key = getLayerVisibleKey(layer);
    newState = {
      ...newState,
      [key]: { ...(newState[key] as Record<string, unknown>), layerVisible: false },
    };
  }
  return newState;
}

function findGroupForLayer(layer: LayerKey): LayerGroupKey | null {
  for (const [groupKey, group] of Object.entries(LAYER_GROUPS)) {
    if (group.layers.includes(layer)) {
      return groupKey as LayerGroupKey;
    }
  }
  return null;
}

// ============================================
// PROVIDER
// ============================================

interface UnifiedFilterProviderProps {
  children: ReactNode;
}

export function UnifiedFilterProvider({ children }: UnifiedFilterProviderProps) {
  const [state, setState] = useState<UnifiedFilterState>(DEFAULT_STATE);

  // ========== GROUP LOGIC ==========

  const setActiveGroup = useCallback((group: LayerGroupKey | null) => {
    setState(prev => {
      if (group === null) {
        // Turn off all layers of the current active group
        if (prev.activeGroup) {
          return { ...turnOffGroupLayers(prev, prev.activeGroup), activeGroup: null };
        }
        return { ...prev, activeGroup: null };
      }

      // If switching to a different group, turn off old group's layers
      let newState = { ...prev };
      if (prev.activeGroup && prev.activeGroup !== group) {
        newState = turnOffGroupLayers(newState, prev.activeGroup);
      }

      return { ...newState, activeGroup: group };
    });
  }, []);

  const getActiveLayerCount = useCallback((group: LayerGroupKey): number => {
    const layers = LAYER_GROUPS[group].layers;
    return layers.filter(layer => {
      const layerState = state[layer] as { layerVisible: boolean };
      return layerState.layerVisible;
    }).length;
  }, [state]);

  // ========== LAYER TOGGLE WITH GROUP AWARENESS ==========

  const toggleLayerWithGroup = useCallback((layer: LayerKey, visible: boolean, updater: (prev: UnifiedFilterState) => UnifiedFilterState) => {
    setState(prev => {
      let newState = updater(prev);

      if (visible) {
        // When enabling a layer, activate its group and turn off other groups
        const group = findGroupForLayer(layer);
        if (group) {
          if (prev.activeGroup && prev.activeGroup !== group) {
            newState = turnOffGroupLayers(newState, prev.activeGroup);
          }
          // Re-apply the layer visibility since turnOffGroupLayers might have turned it off
          // if the layer was in the previously active group (shouldn't happen, but safety)
          newState = {
            ...newState,
            [layer]: { ...(newState[layer] as Record<string, unknown>), layerVisible: true },
            activeGroup: group,
          };
        }
      } else {
        // When disabling a layer, check if group still has active layers
        const group = findGroupForLayer(layer);
        if (group) {
          const otherLayersInGroup = LAYER_GROUPS[group].layers.filter(l => l !== layer);
          const hasOtherActive = otherLayersInGroup.some(l => {
            const ls = newState[l] as { layerVisible: boolean };
            return ls.layerVisible;
          });
          if (!hasOtherActive) {
            newState = { ...newState, activeGroup: null };
          }
        }
      }

      return newState;
    });
  }, []);

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

      if (code === 'SSS') {
        return {
          ...prev,
          crime: {
            ...prev.crime,
            categories: isSelected ? [] : ['SSS'],
          },
        };
      }

      let newCategories: string[];
      if (isSelected) {
        newCategories = currentCategories.filter(c => c !== code);
      } else {
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
    toggleLayerWithGroup('crime', visible, prev => ({
      ...prev,
      crime: { ...prev.crime, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

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
    toggleLayerWithGroup('traffic', visible, prev => ({
      ...prev,
      traffic: { ...prev.traffic, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  // ========== WEATHER ACTIONS ==========

  const setWeatherLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('weather', visible, prev => ({
      ...prev,
      weather: { ...prev.weather, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  const setWeatherMetric = useCallback((metric: WeatherMetric) => {
    setState(prev => ({
      ...prev,
      weather: { ...prev.weather, metric },
    }));
  }, []);

  // ========== TRANSIT ACTIONS ==========

  const setTransitLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('transit', visible, prev => ({
      ...prev,
      transit: { ...prev.transit, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

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
    toggleLayerWithGroup('roadWeather', visible, prev => ({
      ...prev,
      roadWeather: { ...prev.roadWeather, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  // ========== WEATHER CAMERA ACTIONS ==========

  const setWeatherCameraLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('weatherCamera', visible, prev => ({
      ...prev,
      weatherCamera: { ...prev.weatherCamera, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  const setSelectedWeatherCamera = useCallback((stationId: string | null) => {
    setState(prev => ({
      ...prev,
      weatherCamera: { ...prev.weatherCamera, selectedStationId: stationId },
    }));
  }, []);

  // ========== NEWS ACTIONS ==========

  const setNewsLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('news', visible, prev => ({
      ...prev,
      news: { ...prev.news, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  const setNewsTimeRange = useCallback((timeRange: '1h' | '6h' | '24h' | '7d' | '30d') => {
    setState(prev => ({
      ...prev,
      news: { ...prev.news, timeRange },
    }));
  }, []);

  const toggleNewsSource = useCallback((source: NewsSourceKey) => {
    setState(prev => {
      const sources = prev.news.sources;
      const newSources = sources.includes(source)
        ? sources.filter(s => s !== source)
        : [...sources, source];
      return {
        ...prev,
        news: { ...prev.news, sources: newSources },
      };
    });
  }, []);

  const toggleNewsCategory = useCallback((category: NewsCategoryKey) => {
    setState(prev => {
      const cats = prev.news.categories;
      const newCats = cats.includes(category)
        ? cats.filter(c => c !== category)
        : [...cats, category];
      return {
        ...prev,
        news: { ...prev.news, categories: newCats },
      };
    });
  }, []);

  const setNewsSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      news: { ...prev.news, searchQuery: query },
    }));
  }, []);

  // ========== TRAIN ACTIONS ==========

  const setTrainLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('train', visible, prev => ({
      ...prev,
      train: { ...prev.train, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  const toggleTrainType = useCallback((type: TrainType) => {
    setState(prev => {
      const types = prev.train.trainTypes;
      const newTypes = types.includes(type)
        ? types.filter(t => t !== type)
        : [...types, type];
      return {
        ...prev,
        train: { ...prev.train, trainTypes: newTypes },
      };
    });
  }, []);

  // ========== SNOW ACTIONS ==========

  const setSnowLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('snow', visible, prev => ({
      ...prev,
      snow: { ...prev.snow, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  // ========== ELECTION ACTIONS ==========

  const setElectionYear = useCallback((year: string) => {
    setState(prev => ({
      ...prev,
      election: { ...prev.election, year },
    }));
  }, []);

  const setElectionLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('election', visible, prev => ({
      ...prev,
      election: { ...prev.election, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  // ========== ASSOCIATIONS ACTIONS ==========

  const setAssociationsLayerVisible = useCallback((visible: boolean) => {
    toggleLayerWithGroup('associations', visible, prev => ({
      ...prev,
      associations: { ...prev.associations, layerVisible: visible },
    }));
  }, [toggleLayerWithGroup]);

  const setAssociationsDisplayMode = useCallback((mode: 'count' | 'perCapita') => {
    setState(prev => ({
      ...prev,
      associations: { ...prev.associations, displayMode: mode },
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
    setNewsLayerVisible,
    setNewsTimeRange,
    toggleNewsSource,
    toggleNewsCategory,
    setNewsSearchQuery,
    setTrainLayerVisible,
    toggleTrainType,
    setSnowLayerVisible,
    setElectionYear,
    setElectionLayerVisible,
    setAssociationsLayerVisible,
    setAssociationsDisplayMode,
    setTheme,
    resetFilters,
    setActiveGroup,
    getActiveLayerCount,
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
