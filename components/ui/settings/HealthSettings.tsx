'use client';

import { useState } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { SOTKANET_INDICATORS } from '@/lib/data/sotkanet/indicators';

export default function HealthSettings() {
  const { health, theme, setHealthIndicator, setHealthYear } = useUnifiedFilters();
  const isDark = theme === 'dark';
  const [infoExpanded, setInfoExpanded] = useState(false);

  const selectedIndicator = SOTKANET_INDICATORS.find((i) => i.id === health.indicator);

  return (
    <div className="space-y-3">
      {/* Indicator selector */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Indikaattori
        </label>
        <select
          value={health.indicator}
          onChange={(e) => setHealthIndicator(e.target.value)}
          className={`w-full mt-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
            isDark
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 focus:border-blue-500'
              : 'bg-white text-zinc-900 border-zinc-300 focus:border-blue-500'
          }`}
        >
          {SOTKANET_INDICATORS.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {ind.label}
            </option>
          ))}
        </select>
        {selectedIndicator && (
          <p className={`mt-1 text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {selectedIndicator.description}
          </p>
        )}
      </div>

      {/* Year */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Vuosi
        </label>
        <select
          value={health.year}
          onChange={(e) => setHealthYear(e.target.value)}
          className={`w-full mt-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
            isDark
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 focus:border-blue-500'
              : 'bg-white text-zinc-900 border-zinc-300 focus:border-blue-500'
          }`}
        >
          {['2024', '2023', '2022', '2021', '2020', '2019'].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Data info */}
      <div className={`border-t pt-2 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <button
          onClick={() => setInfoExpanded(!infoExpanded)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <span>ℹ️</span>
          <span>Tietoa datasta</span>
          <span className={`transition-transform text-[10px] ${infoExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {infoExpanded && (
          <div
            className={`mt-2 p-2.5 rounded-lg text-xs leading-relaxed space-y-1.5 ${
              isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-zinc-50 text-zinc-600'
            }`}
          >
            <p>
              <span className="font-semibold">Lähde:</span> THL / Sotkanet (CC BY 4.0)
            </p>
            <p>
              <span className="font-semibold">API:</span> sotkanet.fi/rest/1.1/
            </p>
            <p>
              <span className="font-semibold">Päivitys:</span> Vuosittain / neljännesvuosittain
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
