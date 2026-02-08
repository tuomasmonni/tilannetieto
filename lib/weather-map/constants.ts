/**
 * Sääkartta — Vakiot ja konfiguraatio
 */

// Finland bounding box
export const FINLAND_BBOX = {
  minLat: 59.5,
  maxLat: 70.1,
  minLon: 19.0,
  maxLon: 31.6,
};

// Forecast grid: ~72 points across Finland
// Latitude: 59.5 to 70 (step 1.5) = 8 rows
// Longitude: 20 to 31 (step 1.5) = 8 cols = 64 points
export const FORECAST_GRID = (() => {
  const points: { lat: number; lon: number }[] = [];
  for (let lat = 59.5; lat <= 70; lat += 1.5) {
    for (let lon = 20; lon <= 31; lon += 1.5) {
      points.push({ lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 });
    }
  }
  return points;
})();

// Temperature color scale (meteorological standard)
// violetti -35C -> sininen -20C -> syaani -10C -> valkoinen 0C -> vihreä +10C -> keltainen +20C -> oranssi +30C -> punainen +40C
export const TEMPERATURE_STOPS: [number, [number, number, number]][] = [
  [-35, [100, 0, 160]], // violetti
  [-25, [60, 60, 200]], // tummasininen
  [-20, [40, 100, 220]], // sininen
  [-15, [30, 140, 230]], // vaaleasininen
  [-10, [0, 200, 220]], // syaani
  [-5, [180, 220, 240]], // vaalea syaani
  [0, [255, 255, 255]], // valkoinen (0°C rajapiste)
  [5, [180, 230, 140]], // vaaleavihreä
  [10, [80, 200, 60]], // vihreä
  [15, [180, 210, 40]], // keltavihreä
  [20, [240, 220, 20]], // keltainen
  [25, [250, 180, 0]], // oranssi
  [30, [240, 100, 0]], // tummaoranssi
  [35, [220, 40, 20]], // punainen
  [40, [180, 0, 0]], // tumma punainen
];

// Wind speed color scale
export const WIND_SPEED_STOPS: [number, [number, number, number, number]][] = [
  [0, [120, 120, 120, 150]], // harmaa, melko läpinäkyvä
  [2, [200, 200, 200, 180]], // vaalean harmaa
  [5, [255, 255, 255, 200]], // valkoinen
  [10, [0, 220, 255, 220]], // syaani
  [15, [255, 220, 0, 240]], // keltainen
  [20, [255, 100, 0, 255]], // oranssi
  [25, [255, 30, 30, 255]], // punainen
];

// IDW interpolation settings
export const IDW_CONFIG = {
  step: 4, // Interpolate every 4th pixel
  maxDistance: 600, // Max pixel distance for station influence
  power: 2, // Distance weight power (IDW p-parameter)
  debounceMs: 100, // Debounce on map move
};

// Wind particle settings
export const WIND_PARTICLE_CONFIG = {
  countDesktop: 800,
  countMobile: 400,
  maxAge: 120, // frames
  speedFactor: 0.3,
  fadeOpacity: 0.92, // Trail fade (lower = shorter trails)
  lineWidth: 1.2,
};

// Radar animation settings
export const RADAR_CONFIG = {
  frameCount: 24, // Last 2 hours (5min intervals)
  intervalMs: 5 * 60 * 1000, // 5 minutes
  playbackSpeed: 500, // ms per frame (default)
  opacity: 0.6,
  wmsBaseUrl: 'https://openwms.fmi.fi/geoserver/Radar/wms',
  layer: 'Radar:suomi_dbz_eureffin',
  bounds: {
    north: 70.5,
    south: 58.5,
    east: 33.0,
    west: 17.5,
  },
};

// Open-Meteo API
export const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Polling intervals (sääkartta)
export const WEATHER_MAP_POLLING = {
  observations: 300_000, // 5 min
  forecast: 1_800_000, // 30 min
  radar: 120_000, // 2 min
};
