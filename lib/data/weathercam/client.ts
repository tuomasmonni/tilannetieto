/**
 * Tilannekuva.online - Weather Camera Client
 * Digitraffic API wrapper
 */

import { API_ENDPOINTS } from '@/lib/constants';
import type { WeatherCameraApiResponse } from './types';

/**
 * Hae kelikamerat Digitraffic API:sta
 * Endpoint: https://tie.digitraffic.fi/api/weathercam/v1/stations
 */
export async function fetchWeatherCameras(): Promise<WeatherCameraApiResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.weatherCameras, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Digitraffic-User': 'tilannekuva.online/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: WeatherCameraApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch weather cameras:', error);
    // Palauta tyhjä GeoJSON-kollektion virhetilanteessa
    return {
      type: 'FeatureCollection',
      dataUpdatedTime: new Date().toISOString(),
      features: [],
    };
  }
}
