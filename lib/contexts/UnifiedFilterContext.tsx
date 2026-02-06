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

  // Jäänpaksuus (SYKE + FMI WMS + Digitraffic)
  ice: {
    layerVisible: boolean;
    showLakes: boolean;
    showSeaIce: boolean;
    showIcebreakers: boolean;
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

  // Energia (Fingrid)
  energy: {
    layerVisible: boolean;
  };

  // Työttömyys (Tilastokeskus)
  unemployment: {
    year: string;
    layerVisible: boolean;
    displayMode: 'absolute' | 'perCapita';
    isLoading: boolean;
  };

  // Asuntohinnat (Tilastokeskus)
  housing: {
    year: string;
    layerVisible: boolean;
    isLoading: boolean;
  };

  // Väestö (Tilastokeskus)
  population: {
    year: string;
    layerVisible: boolean;
    displayMode: 'density' | 'absolute';
    isLoading: boolean;
  };

  // Terveys (Sotkanet/THL)
  health: {
    indicator: string;
    year: string;
    layerVisible: boolean;
    isLoading: boolean;
  };

  // Hot Lips
  hotLips: {
    layerVisible: boolean;
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

  // Ice actions
  setIceLayerVisible: (visible: boolean) => void;
  setIceShowLakes: (show: boolean) => void;
  setIceShowSeaIce: (show: boolean) => void;
  setIceShowIcebreakers: (show: boolean) => void;

  // Election actions
  setElectionYear: (year: string) => void;
  setElectionLayerVisible: (visible: boolean) => void;

  // Associations actions
  setAssociationsLayerVisible: (visible: boolean) => void;
  setAssociationsDisplayMode: (mode: 'count' | 'perCapita') => void;

  // Energy actions
  setEnergyLayerVisible: (visible: boolean) => void;

  // Unemployment actions
  setUnemploymentYear: (year: string) => void;
  setUnemploymentLayerVisible: (visible: boolean) => void;
  setUnemploymentDisplayMode: (mode: 'absolute' | 'perCapita') => void;
  setUnemploymentLoading: (loading: boolean) => void;

  // Housing actions
  setHousingYear: (year: string) => void;
  setHousingLayerVisible: (visible: boolean) => void;
  setHousingLoading: (loading: boolean) => void;

  // Population actions
  setPopulationYear: (year: string) => void;
  setPopulationLayerVisible: (visible: boolean) => void;
  setPopulationDisplayMode: (mode: 'density' | 'absolute') => void;
  setPopulationLoading: (loading: boolean) => void;

  // Health actions
  setHealthIndicator: (indicator: string) => void;
  setHealthYear: (year: string) => void;
  setHealthLayerVisible: (visible: boolean) => void;
  setHealthLoading: (loading: boolean) => void;

  // Hot Lips actions
  setHotLipsLayerVisible: (visible: boolean) => void;

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
  ice: {
    layerVisible: false,
    showLakes: true,
    showSeaIce: true,
    showIcebreakers: false,
  },
  election: {
    year: '2023',
    layerVisible: false,
  },
  associations: {
    layerVisible: false,
    displayMode: 'count',
  },
  energy: {
    layerVisible: false,
  },
  unemployment: {
    year: '2024',
    layerVisible: false,
    displayMode: 'perCapita',
    isLoading: false,
  },
  housing: {
    year: '2024',
    layerVisible: false,
    isLoading: false,
  },
  population: {
    year: '2024',
    layerVisible: false,
    displayMode: 'density',
    isLoading: false,
  },
  health: {
    indicator: '3064', // Sairastavuusindeksi (THL)
    year: '2023',
    layerVisible: false,
    isLoading: false,
  },
  hotLips: {
    layerVisible: false,
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
// PROVIDER
// ============================================

interface UnifiedFilterProviderProps {
  children: ReactNode;
}

export function UnifiedFilterProvider({ children }: UnifiedFilterProviderProps) {
  const [state, setState] = useState<UnifiedFilterState>(DEFAULT_STATE);

  // ========== GROUP LOGIC ==========

  const setActiveGroup = useCallback((group: LayerGroupKey | null) => {
    setState(prev => ({ ...prev, activeGroup: group }));
  }, []);

  const getActiveLayerCount = useCallback((group: LayerGroupKey): number => {
    const layers = LAYER_GROUPS[group].layers;
    return layers.filter(layer => {
      const layerState = state[layer] as { layerVisible: boolean };
      return layerState.layerVisible;
    }).length;
  }, [state]);

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

  const setWeatherMetric = useCallback((metric: WeatherMetric) => {
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

  // ========== NEWS ACTIONS ==========

  const setNewsLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      news: { ...prev.news, layerVisible: visible },
    }));
  }, []);

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
    setState(prev => ({
      ...prev,
      train: { ...prev.train, layerVisible: visible },
    }));
  }, []);

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
    setState(prev => ({
      ...prev,
      snow: { ...prev.snow, layerVisible: visible },
    }));
  }, []);

  // ========== ICE ACTIONS ==========

  const setIceLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      ice: { ...prev.ice, layerVisible: visible },
    }));
  }, []);

  const setIceShowLakes = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      ice: { ...prev.ice, showLakes: show },
    }));
  }, []);

  const setIceShowSeaIce = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      ice: { ...prev.ice, showSeaIce: show },
    }));
  }, []);

  const setIceShowIcebreakers = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      ice: { ...prev.ice, showIcebreakers: show },
    }));
  }, []);

  // ========== ELECTION ACTIONS ==========

  const setElectionYear = useCallback((year: string) => {
    setState(prev => ({
      ...prev,
      election: { ...prev.election, year },
    }));
  }, []);

  const setElectionLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      election: { ...prev.election, layerVisible: visible },
    }));
  }, []);

  // ========== ASSOCIATIONS ACTIONS ==========

  const setAssociationsLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      associations: { ...prev.associations, layerVisible: visible },
    }));
  }, []);

  const setAssociationsDisplayMode = useCallback((mode: 'count' | 'perCapita') => {
    setState(prev => ({
      ...prev,
      associations: { ...prev.associations, displayMode: mode },
    }));
  }, []);

  // ========== ENERGY ACTIONS ==========

  const setEnergyLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      energy: { ...prev.energy, layerVisible: visible },
    }));
  }, []);

  // ========== UNEMPLOYMENT ACTIONS ==========

  const setUnemploymentYear = useCallback((year: string) => {
    setState(prev => ({
      ...prev,
      unemployment: { ...prev.unemployment, year },
    }));
  }, []);

  const setUnemploymentLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      unemployment: { ...prev.unemployment, layerVisible: visible },
    }));
  }, []);

  const setUnemploymentDisplayMode = useCallback((mode: 'absolute' | 'perCapita') => {
    setState(prev => ({
      ...prev,
      unemployment: { ...prev.unemployment, displayMode: mode },
    }));
  }, []);

  const setUnemploymentLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      unemployment: { ...prev.unemployment, isLoading: loading },
    }));
  }, []);

  // ========== HOUSING ACTIONS ==========

  const setHousingYear = useCallback((year: string) => {
    setState(prev => ({
      ...prev,
      housing: { ...prev.housing, year },
    }));
  }, []);

  const setHousingLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      housing: { ...prev.housing, layerVisible: visible },
    }));
  }, []);

  const setHousingLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      housing: { ...prev.housing, isLoading: loading },
    }));
  }, []);

  // ========== POPULATION ACTIONS ==========

  const setPopulationYear = useCallback((year: string) => {
    setState(prev => ({
      ...prev,
      population: { ...prev.population, year },
    }));
  }, []);

  const setPopulationLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      population: { ...prev.population, layerVisible: visible },
    }));
  }, []);

  const setPopulationDisplayMode = useCallback((mode: 'density' | 'absolute') => {
    setState(prev => ({
      ...prev,
      population: { ...prev.population, displayMode: mode },
    }));
  }, []);

  const setPopulationLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      population: { ...prev.population, isLoading: loading },
    }));
  }, []);

  // ========== HEALTH ACTIONS ==========

  const setHealthIndicator = useCallback((indicator: string) => {
    setState(prev => ({
      ...prev,
      health: { ...prev.health, indicator },
    }));
  }, []);

  const setHealthYear = useCallback((year: string) => {
    setState(prev => ({
      ...prev,
      health: { ...prev.health, year },
    }));
  }, []);

  const setHealthLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      health: { ...prev.health, layerVisible: visible },
    }));
  }, []);

  const setHealthLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      health: { ...prev.health, isLoading: loading },
    }));
  }, []);

  // ========== HOT LIPS ACTIONS ==========

  const setHotLipsLayerVisible = useCallback((visible: boolean) => {
    setState(prev => ({ ...prev, hotLips: { ...prev.hotLips, layerVisible: visible } }));
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
    setIceLayerVisible,
    setIceShowLakes,
    setIceShowSeaIce,
    setIceShowIcebreakers,
    setElectionYear,
    setElectionLayerVisible,
    setAssociationsLayerVisible,
    setAssociationsDisplayMode,
    setEnergyLayerVisible,
    setUnemploymentYear,
    setUnemploymentLayerVisible,
    setUnemploymentDisplayMode,
    setUnemploymentLoading,
    setHousingYear,
    setHousingLayerVisible,
    setHousingLoading,
    setPopulationYear,
    setPopulationLayerVisible,
    setPopulationDisplayMode,
    setPopulationLoading,
    setHealthIndicator,
    setHealthYear,
    setHealthLayerVisible,
    setHealthLoading,
    setHotLipsLayerVisible,
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
