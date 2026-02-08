'use client';

import type { WeatherMapObservation } from '@/lib/weather-map/types';
import { temperatureToCss, windSpeedToCss } from '@/lib/weather-map/color-scales';

interface StationPopupProps {
  station: WeatherMapObservation;
  onClose: () => void;
}

export default function StationPopup({ station, onClose }: StationPopupProps) {
  const time = new Date(station.timestamp).toLocaleTimeString('fi-FI', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const windDirText =
    station.windDirection !== null
      ? (() => {
          const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          const index = Math.round(station.windDirection / 45) % 8;
          return dirs[index];
        })()
      : null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 sm:fixed sm:top-auto sm:bottom-24 sm:left-1/2 sm:-translate-x-1/2 sm:translate-y-0">
      <div className="glass-surface border border-white/15 rounded-xl p-4 min-w-[240px] max-w-[320px] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">
              {station.stationName}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {station.source === 'fmi' ? 'FMI' : 'Digitraffic'} | {time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Data grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {station.temperature !== null && (
            <div>
              <span className="text-[10px] text-zinc-500 block">Lampotila</span>
              <span
                className="text-lg font-mono font-bold"
                style={{ color: temperatureToCss(station.temperature) }}
              >
                {station.temperature.toFixed(1)}°C
              </span>
            </div>
          )}

          {station.windSpeed !== null && (
            <div>
              <span className="text-[10px] text-zinc-500 block">Tuuli</span>
              <span
                className="text-lg font-mono font-bold"
                style={{ color: windSpeedToCss(station.windSpeed) }}
              >
                {station.windSpeed.toFixed(1)} m/s
              </span>
              {windDirText && <span className="text-[10px] text-zinc-400 ml-1">{windDirText}</span>}
            </div>
          )}

          {station.humidity !== null && (
            <div>
              <span className="text-[10px] text-zinc-500 block">Kosteus</span>
              <span className="text-sm font-mono text-zinc-300">
                {station.humidity.toFixed(0)}%
              </span>
            </div>
          )}

          {station.precipitation !== null && station.precipitation > 0 && (
            <div>
              <span className="text-[10px] text-zinc-500 block">Sade (1h)</span>
              <span className="text-sm font-mono text-blue-400">
                {station.precipitation.toFixed(1)} mm
              </span>
            </div>
          )}

          {station.roadTemperature !== null && (
            <div>
              <span className="text-[10px] text-zinc-500 block">Tie</span>
              <span
                className="text-sm font-mono"
                style={{ color: temperatureToCss(station.roadTemperature) }}
              >
                {station.roadTemperature.toFixed(1)}°C
              </span>
            </div>
          )}

          {station.visibility !== null && (
            <div>
              <span className="text-[10px] text-zinc-500 block">Nakyvyys</span>
              <span className="text-sm font-mono text-zinc-300">
                {station.visibility >= 1000
                  ? `${(station.visibility / 1000).toFixed(1)} km`
                  : `${station.visibility} m`}
              </span>
            </div>
          )}
        </div>

        {/* Coordinates */}
        <div className="mt-3 pt-2 border-t border-white/5">
          <span className="text-[9px] text-zinc-600 font-mono">
            {station.lat.toFixed(4)}°N, {station.lon.toFixed(4)}°E
          </span>
        </div>
      </div>
    </div>
  );
}
