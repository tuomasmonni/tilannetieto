'use client';

import { useState } from 'react';
import {
  useUnifiedFilters,
  CRIME_CATEGORIES,
  AVAILABLE_YEARS,
} from '@/lib/contexts/UnifiedFilterContext';

interface MobileFilterContentProps {
  mode: 'compact' | 'expanded';
}

export default function MobileFilterContent({ mode }: MobileFilterContentProps) {
  const {
    crime,
    weatherCamera,
    theme,
    setCrimeYear,
    toggleCrimeCategory,
    setCrimeLayerVisible,
    setCrimeDisplayMode,
    setWeatherCameraLayerVisible,
  } = useUnifiedFilters();

  const [crimeExpanded, setCrimeExpanded] = useState(false);
  const [crimeInfoExpanded, setCrimeInfoExpanded] = useState(false);
  const [weatherCameraExpanded, setWeatherCameraExpanded] = useState(true);

  const isDark = theme === 'dark';
  const textClass = isDark ? 'text-zinc-200' : 'text-zinc-800';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const hoverBgClass = isDark ? 'hover:bg-zinc-800 active:bg-zinc-700' : 'hover:bg-zinc-100 active:bg-zinc-200';
  const buttonBgClass = isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 active:bg-zinc-600' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 active:bg-zinc-400';
  const selectBgClass = isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300';

  // Compact mode: Only layer toggles
  if (mode === 'compact') {
    return (
      <div className="p-5 space-y-4">
        {/* Layer toggles */}
        <div className="space-y-2">
          <label className={`text-xs ${textMutedClass} font-medium block`}>
            Tasot
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setWeatherCameraLayerVisible(!weatherCamera.layerVisible)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors min-h-[44px]
                ${weatherCamera.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
                }
              `}
            >
              📷 Kelikamerat
            </button>
            <button
              onClick={() => setCrimeLayerVisible(!crime.layerVisible)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors min-h-[44px]
                ${crime.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
                }
              `}
            >
              🔴 Rikostilastot
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded mode: Full filter panel (mobiili-optimoitu)
  return (
    <div className="p-5 space-y-6">
      {/* ========== KELIKAMERAT ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeatherCameraExpanded(!weatherCameraExpanded)}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} min-h-[44px]`}
          >
            <span>📷</span>
            <span>KELIKAMERAT</span>
            <span
              className={`transition-transform text-xs ml-auto ${
                weatherCameraExpanded ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          <button
            onClick={() => setWeatherCameraLayerVisible(!weatherCamera.layerVisible)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium
              transition-colors min-h-[44px] min-w-[60px]
              ${weatherCamera.layerVisible
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
              }
            `}
          >
            {weatherCamera.layerVisible ? 'ON' : 'OFF'}
          </button>
        </div>

        {weatherCameraExpanded && (
          <div className="space-y-3 pt-2">
            <p className={`text-sm ${textMutedClass}`}>
              {weatherCamera.layerVisible
                ? '~300 kelikamera-asemaa kartalla'
                : 'Kelikamerat piilotettu'}
            </p>
            <p className={`text-xs ${textMutedClass} italic`}>
              Klikkaa kamera-ikonia kartalla nähdäksesi kuvat
            </p>
          </div>
        )}
      </div>

      {/* ========== RIKOSTILASTOT ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCrimeExpanded(!crimeExpanded)}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} min-h-[44px]`}
          >
            <span>🔴</span>
            <span>RIKOSTILASTOT</span>
            <span
              className={`transition-transform text-xs ml-auto ${
                crimeExpanded ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          <button
            onClick={() => setCrimeLayerVisible(!crime.layerVisible)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium
              transition-colors min-h-[44px] min-w-[60px]
              ${crime.layerVisible
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
              }
            `}
          >
            {crime.layerVisible ? 'ON' : 'OFF'}
          </button>
        </div>

        {crimeExpanded && (
          <div className="space-y-4 pt-2">
            {/* Year dropdown - mobiili-optimoitu */}
            <div>
              <label className={`text-xs ${textMutedClass} mb-1 block font-medium`}>
                Vuosi
              </label>
              <select
                value={crime.year}
                onChange={(e) => setCrimeYear(e.target.value)}
                className={`
                  w-full px-4 py-3 rounded border text-base
                  focus:border-blue-500 focus:outline-none
                  transition-colors min-h-[48px] ${selectBgClass}
                `}
              >
                {AVAILABLE_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Display mode toggle - mobiili-optimoitu */}
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>
                Näyttötapa
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCrimeDisplayMode('absolute')}
                  className={`
                    px-4 py-3 text-sm font-medium rounded-lg
                    transition-colors min-h-[48px]
                    ${crime.displayMode === 'absolute'
                      ? 'bg-blue-600 text-white'
                      : buttonBgClass
                    }
                  `}
                >
                  Absoluuttinen
                </button>
                <button
                  onClick={() => setCrimeDisplayMode('perCapita')}
                  className={`
                    px-4 py-3 text-sm font-medium rounded-lg
                    transition-colors min-h-[48px]
                    ${crime.displayMode === 'perCapita'
                      ? 'bg-blue-600 text-white'
                      : buttonBgClass
                    }
                  `}
                >
                  Per 100k as.
                </button>
              </div>
            </div>

            {/* Categories - mobiili-optimoitu isommat touch-targetit */}
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>
                Kategoriat
              </label>
              <div className="space-y-1.5 max-h-64 overflow-y-auto -mx-1 px-1">
                {CRIME_CATEGORIES.map((cat) => (
                  <label
                    key={cat.code}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer
                      transition-colors min-h-[48px] ${hoverBgClass}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={crime.categories.includes(cat.code)}
                      onChange={() => toggleCrimeCategory(cat.code)}
                      className="w-6 h-6 rounded accent-blue-600 flex-shrink-0"
                    />
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                      title={cat.label}
                    />
                    <span className={`text-sm flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data info */}
            <div className={`border-t pt-3 ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
              <button
                onClick={() => setCrimeInfoExpanded(!crimeInfoExpanded)}
                className={`flex items-center gap-1.5 text-xs transition-colors min-h-[44px] ${textMutedClass} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-900'}`}
              >
                <span>ℹ️</span>
                <span>Tietoa datasta</span>
                <span className={`transition-transform ${crimeInfoExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {crimeInfoExpanded && (
                <div className={`mt-2 p-3 rounded text-xs leading-relaxed space-y-2 ${isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-zinc-50 text-zinc-600'}`}>
                  <p>
                    <span className="font-semibold">Lähde:</span>{' '}
                    <a href="https://pxdata.stat.fi/PXWeb/pxweb/fi/StatFin/StatFin__rpk/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Tilastokeskus</a>
                    {' '}&ndash; Rikos- ja pakkokeinotilasto (ICCS)
                  </p>
                  <p>
                    <span className="font-semibold">Väkiluku:</span>{' '}
                    Tilastokeskuksen väestörakenne, kunnan väkiluku 31.12. valitulta vuodelta.
                  </p>
                  <p>
                    <span className="font-semibold">Per 100k laskenta:</span>{' '}
                    rikokset &divide; väkiluku &times; 100&nbsp;000
                  </p>
                  <p>
                    <span className="font-semibold">ICCS-luokitus:</span>{' '}
                    YK:n kansainvälinen rikosluokitus (teonkuvauspohjainen, ei lakipykäläpohjainen).
                  </p>
                  <p className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>
                    Data päivitetty: 03.02.2026
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
