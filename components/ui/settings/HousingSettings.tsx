'use client';

import { useState } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

const HOUSING_YEARS = ['2024', '2023', '2022', '2021', '2020'] as const;

export default function HousingSettings() {
  const { housing, theme, setHousingYear } = useUnifiedFilters();
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
          value={housing.year}
          onChange={(e) => setHousingYear(e.target.value)}
          className={`w-full mt-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
            isDark
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 focus:border-blue-500'
              : 'bg-white text-zinc-900 border-zinc-300 focus:border-blue-500'
          }`}
        >
          {HOUSING_YEARS.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Color scale info */}
      <div className="space-y-1">
        <div className={`text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Väriskaala</div>
        <div className="flex h-2 rounded-full overflow-hidden">
          <div className="flex-1" style={{ backgroundColor: '#c6efce' }} />
          <div className="flex-1" style={{ backgroundColor: '#ffeb9c' }} />
          <div className="flex-1" style={{ backgroundColor: '#ffc7ce' }} />
          <div className="flex-1" style={{ backgroundColor: '#ff6b6b' }} />
        </div>
        <div className="flex justify-between">
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Edullinen</span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Kallis</span>
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
            <p><span className="font-semibold">Lähde:</span> Tilastokeskus &ndash; Asuntojen hinnat</p>
            <p><span className="font-semibold">Taulukko:</span> 112q &ndash; Vanhojen asuntojen hinnat</p>
            <p><span className="font-semibold">Yksikkö:</span> €/m² (keskiarvo)</p>
          </div>
        )}
      </div>
    </div>
  );
}
