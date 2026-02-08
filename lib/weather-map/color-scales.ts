/**
 * Sääkartta — Väriskaalojen laskenta
 */

import { TEMPERATURE_STOPS, WIND_SPEED_STOPS } from './constants';

/**
 * Interpoloi väri lineaarisesti kahden pisteen välillä
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Lämpötila -> RGBA
 */
export function temperatureToColor(
  temp: number,
  alpha: number = 160
): [number, number, number, number] {
  const stops = TEMPERATURE_STOPS;

  // Clamp
  if (temp <= stops[0][0]) {
    const [r, g, b] = stops[0][1];
    return [r, g, b, alpha];
  }
  if (temp >= stops[stops.length - 1][0]) {
    const [r, g, b] = stops[stops.length - 1][1];
    return [r, g, b, alpha];
  }

  // Find surrounding stops
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (temp >= t0 && temp <= t1) {
      const t = (temp - t0) / (t1 - t0);
      return [
        Math.round(lerp(c0[0], c1[0], t)),
        Math.round(lerp(c0[1], c1[1], t)),
        Math.round(lerp(c0[2], c1[2], t)),
        alpha,
      ];
    }
  }

  return [128, 128, 128, alpha]; // fallback
}

/**
 * Tuulen nopeus -> RGBA
 */
export function windSpeedToColor(speed: number): [number, number, number, number] {
  const stops = WIND_SPEED_STOPS;

  if (speed <= stops[0][0]) return stops[0][1];
  if (speed >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];

  for (let i = 0; i < stops.length - 1; i++) {
    const [s0, c0] = stops[i];
    const [s1, c1] = stops[i + 1];
    if (speed >= s0 && speed <= s1) {
      const t = (speed - s0) / (s1 - s0);
      return [
        Math.round(lerp(c0[0], c1[0], t)),
        Math.round(lerp(c0[1], c1[1], t)),
        Math.round(lerp(c0[2], c1[2], t)),
        Math.round(lerp(c0[3], c1[3], t)),
      ];
    }
  }

  return [128, 128, 128, 180]; // fallback
}

/**
 * Tuulen nopeus -> CSS väri (legendaan)
 */
export function windSpeedToCss(speed: number): string {
  const [r, g, b] = windSpeedToColor(speed);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Lämpötila -> CSS väri (legendaan)
 */
export function temperatureToCss(temp: number): string {
  const [r, g, b] = temperatureToColor(temp, 255);
  return `rgb(${r}, ${g}, ${b})`;
}
