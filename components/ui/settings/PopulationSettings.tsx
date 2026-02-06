'use client';

import { useState } from 'react';
import { useUnifiedFilters, AVAILABLE_YEARS } from '@/lib/contexts/UnifiedFilterContext';

export default function PopulationSettings() {
  const { population, theme, setPopulationYear, setPopulationDisplayMode } = useUnifiedFilters();
  const isDark = theme === 'dark';
  const [infoExpanded, setInfoExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Year */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Vuosi
        </label>
        <select
          value={population.year}
          onChange={(e) => setPopulationYear(e.target.value)}
          className={`w-full mt-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
            isDark
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 focus:border-blue-500'
              : 'bg-white text-zinc-900 border-zinc-300 focus:border-blue-500'
          }`}
        >
          {AVAILABLE_YEARS.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Display mode */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Näyttötapa
        </label>
        <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg mt-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          <button
            onClick={() => setPopulationDisplayMode('density')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              population.displayMode === 'density'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Väestötiheys
          </button>
          <button
            onClick={() => setPopulationDisplayMode('absolute')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              population.displayMode === 'absolute'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Väkiluku
          </button>
        </div>
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
          <span className={`transition-transform text-[10px] ${infoExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {infoExpanded && (
          <div className={`mt-2 p-2.5 rounded-lg text-xs leading-relaxed space-y-1.5 ${
            isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-zinc-50 text-zinc-600'
          }`}>
            <p><span className="font-semibold">Lähde:</span> Tilastokeskus &ndash; Väestörakenne</p>
            <p><span className="font-semibold">Taulukko:</span> 11rh &ndash; Väestö kunnittain</p>
            <p><span className="font-semibold">Tilanne:</span> 31.12. valitulta vuodelta</p>
          </div>
        )}
      </div>
    </div>
  );
}
