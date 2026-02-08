'use client';

import { useReducer, useCallback } from 'react';
import type {
  WeatherMapState,
  WeatherMapAction,
  WeatherMapObservation,
  ForecastPoint,
  RadarFrame,
} from '@/lib/weather-map/types';

const initialState: WeatherMapState = {
  temperatureVisible: true,
  windVisible: false,
  radarVisible: false,
  stationsVisible: true,

  temperatureOpacity: 0.6,
  windOpacity: 0.8,
  radarOpacity: 0.6,

  forecastMode: false,
  forecastHourIndex: 0,
  forecastPlaying: false,

  radarPlaying: false,
  radarFrameIndex: 0,
  radarSpeed: 500,

  observations: [],
  forecast: [],
  forecastHours: [],
  radarFrames: [],

  selectedStation: null,
  loading: true,
  lastUpdated: null,
};

function reducer(state: WeatherMapState, action: WeatherMapAction): WeatherMapState {
  switch (action.type) {
    case 'SET_LAYER_VISIBLE':
      return { ...state, [`${action.layer}Visible`]: action.visible };
    case 'SET_LAYER_OPACITY':
      return { ...state, [`${action.layer}Opacity`]: action.opacity };
    case 'SET_OBSERVATIONS':
      return { ...state, observations: action.observations, loading: false };
    case 'SET_FORECAST':
      return { ...state, forecast: action.forecast, forecastHours: action.hours };
    case 'SET_RADAR_FRAMES':
      return { ...state, radarFrames: action.frames };
    case 'SET_FORECAST_MODE':
      return { ...state, forecastMode: action.enabled, forecastPlaying: false };
    case 'SET_FORECAST_HOUR':
      return { ...state, forecastHourIndex: action.index };
    case 'SET_FORECAST_PLAYING':
      return { ...state, forecastPlaying: action.playing };
    case 'SET_RADAR_PLAYING':
      return { ...state, radarPlaying: action.playing };
    case 'SET_RADAR_FRAME':
      return { ...state, radarFrameIndex: action.index };
    case 'SET_RADAR_SPEED':
      return { ...state, radarSpeed: action.speed };
    case 'SET_SELECTED_STATION':
      return { ...state, selectedStation: action.station };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.timestamp };
    default:
      return state;
  }
}

export function useWeatherMapState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setLayerVisible = useCallback(
    (layer: 'temperature' | 'wind' | 'radar' | 'stations', visible: boolean) => {
      dispatch({ type: 'SET_LAYER_VISIBLE', layer, visible });
    },
    []
  );

  const setLayerOpacity = useCallback(
    (layer: 'temperature' | 'wind' | 'radar', opacity: number) => {
      dispatch({ type: 'SET_LAYER_OPACITY', layer, opacity });
    },
    []
  );

  const setObservations = useCallback((observations: WeatherMapObservation[]) => {
    dispatch({ type: 'SET_OBSERVATIONS', observations });
    dispatch({ type: 'SET_LAST_UPDATED', timestamp: new Date().toISOString() });
  }, []);

  const setForecast = useCallback((forecast: ForecastPoint[], hours: string[]) => {
    dispatch({ type: 'SET_FORECAST', forecast, hours });
  }, []);

  const setRadarFrames = useCallback((frames: RadarFrame[]) => {
    dispatch({ type: 'SET_RADAR_FRAMES', frames });
  }, []);

  const setForecastMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_FORECAST_MODE', enabled });
  }, []);

  const setForecastHour = useCallback((index: number) => {
    dispatch({ type: 'SET_FORECAST_HOUR', index });
  }, []);

  const setForecastPlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_FORECAST_PLAYING', playing });
  }, []);

  const setRadarPlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_RADAR_PLAYING', playing });
  }, []);

  const setRadarFrame = useCallback((index: number) => {
    dispatch({ type: 'SET_RADAR_FRAME', index });
  }, []);

  const setRadarSpeed = useCallback((speed: number) => {
    dispatch({ type: 'SET_RADAR_SPEED', speed });
  }, []);

  const setSelectedStation = useCallback((station: WeatherMapObservation | null) => {
    dispatch({ type: 'SET_SELECTED_STATION', station });
  }, []);

  return {
    state,
    setLayerVisible,
    setLayerOpacity,
    setObservations,
    setForecast,
    setRadarFrames,
    setForecastMode,
    setForecastHour,
    setForecastPlaying,
    setRadarPlaying,
    setRadarFrame,
    setRadarSpeed,
    setSelectedStation,
  };
}
