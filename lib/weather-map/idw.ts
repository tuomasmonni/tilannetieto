/**
 * Sääkartta — Inverse Distance Weighting (IDW) interpolointi
 *
 * Laskee interpoloidun arvon jokaiselle pikselille lähimpien
 * havaintoasemien perusteella.
 */

import { IDW_CONFIG } from './constants';
import { temperatureToColor } from './color-scales';
import type { WeatherMapObservation } from './types';

interface PixelStation {
  px: number; // pixel x
  py: number; // pixel y
  value: number;
}

/**
 * Renderöi lämpötilakartan canvas-elementille
 *
 * @param canvas - Target canvas
 * @param stations - Pixel-koordinaateiksi muunnetut asemat
 * @param alpha - Läpinäkyvyys (0-255)
 */
export function renderTemperatureIDW(
  canvas: HTMLCanvasElement,
  stations: PixelStation[],
  alpha: number = 160
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || stations.length === 0) return;

  // Guard against zero-size canvas (createImageData throws if w or h is 0)
  if (canvas.width <= 0 || canvas.height <= 0) return;

  const w = canvas.width;
  const h = canvas.height;
  const { step, maxDistance, power } = IDW_CONFIG;

  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  // Precompute squared max distance
  const maxDistSq = maxDistance * maxDistance;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      let weightSum = 0;
      let valueSum = 0;
      let exactMatch = false;

      for (let i = 0; i < stations.length; i++) {
        const dx = x - stations[i].px;
        const dy = y - stations[i].py;
        const distSq = dx * dx + dy * dy;

        if (distSq < 1) {
          // Exact station location
          valueSum = stations[i].value;
          weightSum = 1;
          exactMatch = true;
          break;
        }

        if (distSq > maxDistSq) continue;

        // IDW weight: 1 / distance^power
        const weight = 1 / Math.pow(Math.sqrt(distSq), power);
        weightSum += weight;
        valueSum += weight * stations[i].value;
      }

      if (weightSum === 0) continue; // No stations in range

      const interpolatedTemp = exactMatch ? valueSum : valueSum / weightSum;
      const [r, g, b, a] = temperatureToColor(interpolatedTemp, alpha);

      // Fill step x step block
      for (let dy = 0; dy < step && y + dy < h; dy++) {
        for (let dx = 0; dx < step && x + dx < w; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Muuntaa havaintoasemat pikselikoordinaateiksi kartan projektion avulla
 */
export function observationsToPixelStations(
  observations: WeatherMapObservation[],
  project: (lngLat: [number, number]) => { x: number; y: number },
  field: 'temperature' | 'windSpeed' = 'temperature'
): PixelStation[] {
  const result: PixelStation[] = [];

  for (const obs of observations) {
    const value = field === 'temperature' ? obs.temperature : obs.windSpeed;
    if (value === null) continue;

    const { x, y } = project([obs.lon, obs.lat]);
    result.push({ px: x, py: y, value });
  }

  return result;
}
