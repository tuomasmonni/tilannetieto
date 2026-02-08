'use client';

import { useMemo } from 'react';
import type { WeatherMapObservation } from '@/lib/weather-map/types';
import { temperatureToCss } from '@/lib/weather-map/color-scales';

interface CurrentConditionsProps {
  observations: WeatherMapObservation[];
}

export default function CurrentConditions({ observations }: CurrentConditionsProps) {
  const stats = useMemo(() => {
    if (observations.length === 0) return null;

    let coldest: WeatherMapObservation | null = null;
    let warmest: WeatherMapObservation | null = null;
    let windiest: WeatherMapObservation | null = null;
    let tempSum = 0;
    let tempCount = 0;

    for (const obs of observations) {
      if (obs.temperature !== null) {
        if (!coldest || obs.temperature < (coldest.temperature ?? Infinity)) coldest = obs;
        if (!warmest || obs.temperature > (warmest.temperature ?? -Infinity)) warmest = obs;
        tempSum += obs.temperature;
        tempCount++;
      }
      if (obs.windSpeed !== null) {
        if (!windiest || obs.windSpeed > (windiest.windSpeed ?? 0)) windiest = obs;
      }
    }

    return {
      coldest,
      warmest,
      windiest,
      avgTemp: tempCount > 0 ? tempSum / tempCount : null,
      stationCount: observations.length,
    };
  }, [observations]);

  if (!stats) return null;

  return (
    <div className="fixed bottom-4 right-3 z-30 sm:right-4 lg:bottom-6">
      <div className="glass-surface border border-white/10 rounded-xl p-3 min-w-[180px]">
        <span className="text-[10px] text-zinc-500 font-medium">YHTEENVETO</span>

        <div className="mt-2 flex flex-col gap-1.5">
          {stats.coldest && stats.coldest.temperature !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400">Kylmin</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: temperatureToCss(stats.coldest.temperature) }}
                >
                  {stats.coldest.temperature.toFixed(1)}°
                </span>
              </div>
            </div>
          )}

          {stats.warmest && stats.warmest.temperature !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400">Lamin</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: temperatureToCss(stats.warmest.temperature) }}
                >
                  {stats.warmest.temperature.toFixed(1)}°
                </span>
              </div>
            </div>
          )}

          {stats.avgTemp !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400">Keskiarvo</span>
              <span
                className="text-sm font-mono font-bold"
                style={{ color: temperatureToCss(stats.avgTemp) }}
              >
                {stats.avgTemp.toFixed(1)}°
              </span>
            </div>
          )}

          {stats.windiest && stats.windiest.windSpeed !== null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400">Kovin tuuli</span>
              <span className="text-sm font-mono font-bold text-cyan-400">
                {stats.windiest.windSpeed.toFixed(1)} m/s
              </span>
            </div>
          )}

          <div className="pt-1 border-t border-white/5">
            <span className="text-[10px] text-zinc-600">{stats.stationCount} asemaa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
