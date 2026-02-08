/**
 * Sääkartta — Tyypit
 */

export interface WeatherMapObservation {
  id: string;
  lat: number;
  lon: number;
  temperature: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  humidity: number | null;
  precipitation: number | null;
  roadTemperature: number | null;
  visibility: number | null;
  stationName: string;
  source: 'fmi' | 'digitraffic';
  timestamp: string;
}

export interface ForecastPoint {
  lat: number;
  lon: number;
  hours: ForecastHour[];
}

export interface ForecastHour {
  time: string;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  weatherCode: number;
}

export interface RadarFrame {
  url: string;
  timestamp: string;
}

export interface WeatherMapState {
  // Layer visibility
  temperatureVisible: boolean;
  windVisible: boolean;
  radarVisible: boolean;
  stationsVisible: boolean;

  // Layer opacity
  temperatureOpacity: number;
  windOpacity: number;
  radarOpacity: number;

  // Forecast
  forecastMode: boolean;
  forecastHourIndex: number;
  forecastPlaying: boolean;

  // Radar animation
  radarPlaying: boolean;
  radarFrameIndex: number;
  radarSpeed: number;

  // Data
  observations: WeatherMapObservation[];
  forecast: ForecastPoint[];
  forecastHours: string[];
  radarFrames: RadarFrame[];

  // UI
  selectedStation: WeatherMapObservation | null;
  loading: boolean;
  lastUpdated: string | null;
}

export type WeatherMapAction =
  | {
      type: 'SET_LAYER_VISIBLE';
      layer: 'temperature' | 'wind' | 'radar' | 'stations';
      visible: boolean;
    }
  | { type: 'SET_LAYER_OPACITY'; layer: 'temperature' | 'wind' | 'radar'; opacity: number }
  | { type: 'SET_OBSERVATIONS'; observations: WeatherMapObservation[] }
  | { type: 'SET_FORECAST'; forecast: ForecastPoint[]; hours: string[] }
  | { type: 'SET_RADAR_FRAMES'; frames: RadarFrame[] }
  | { type: 'SET_FORECAST_MODE'; enabled: boolean }
  | { type: 'SET_FORECAST_HOUR'; index: number }
  | { type: 'SET_FORECAST_PLAYING'; playing: boolean }
  | { type: 'SET_RADAR_PLAYING'; playing: boolean }
  | { type: 'SET_RADAR_FRAME'; index: number }
  | { type: 'SET_RADAR_SPEED'; speed: number }
  | { type: 'SET_SELECTED_STATION'; station: WeatherMapObservation | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_LAST_UPDATED'; timestamp: string };
