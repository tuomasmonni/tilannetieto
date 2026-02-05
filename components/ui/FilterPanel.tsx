'use client';

import { useState } from 'react';
import {
  useUnifiedFilters,
  CRIME_CATEGORIES,
  AVAILABLE_YEARS,
} from '@/lib/contexts/UnifiedFilterContext';

export default function FilterPanel() {
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
  const [weatherCameraExpanded, setWeatherCameraExpanded] = useState(true);

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-zinc-200';
  const textClass = isDark ? 'text-zinc-200' : 'text-zinc-800';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const hoverBgClass = isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100';
  const selectBgClass = isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300';

  return (
    <div className={`w-80 md:w-96 backdrop-blur-sm rounded-lg border shadow-xl overflow-hidden transition-colors max-h-[80vh] overflow-y-auto ${bgClass}`}>
      {/* ========== SECTION 1: KELIKAMERAT ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeatherCameraExpanded(!weatherCameraExpanded)}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
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
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                weatherCamera.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
              }`}
            >
              {weatherCamera.layerVisible ? 'ON' : 'OFF'}
            </button>
          </div>

          {weatherCameraExpanded && (
            <div className="space-y-3 pt-2">
              <p className={`text-xs ${textMutedClass}`}>
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
      </div>

      {/* ========== SECTION 2: RIKOSTILASTOT ========== */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCrimeExpanded(!crimeExpanded)}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
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
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              crime.layerVisible
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
            }`}
          >
            {crime.layerVisible ? 'ON' : 'OFF'}
          </button>
        </div>

        {crimeExpanded && (
          <div className="space-y-3 pt-2">
            {/* Year dropdown */}
            <div>
              <label className={`text-xs ${textMutedClass} mb-1 block font-medium`}>
                Vuosi
              </label>
              <select
                value={crime.year}
                onChange={(e) => setCrimeYear(e.target.value)}
                className={`w-full px-3 py-2 rounded border text-sm focus:border-blue-500 focus:outline-none transition-colors ${selectBgClass}`}
              >
                {AVAILABLE_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Display mode toggle */}
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>
                Näyttötapa
              </label>
              <div
                role="radiogroup"
                aria-label="Rikostilastojen näyttötapa"
                className="grid grid-cols-2 gap-1 p-1 rounded bg-zinc-100 dark:bg-zinc-800"
              >
                <button
                  role="radio"
                  aria-checked={crime.displayMode === 'absolute'}
                  onClick={() => setCrimeDisplayMode('absolute')}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      setCrimeDisplayMode('perCapita');
                      e.preventDefault();
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                    crime.displayMode === 'absolute'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-300'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Absoluuttinen
                </button>
                <button
                  role="radio"
                  aria-checked={crime.displayMode === 'perCapita'}
                  onClick={() => setCrimeDisplayMode('perCapita')}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      setCrimeDisplayMode('absolute');
                      e.preventDefault();
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                    crime.displayMode === 'perCapita'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-300'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Per 100k as.
                </button>
              </div>
            </div>

            {/* Category checkboxes */}
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>
                Kategoriat
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {CRIME_CATEGORIES.map((cat) => (
                  <label
                    key={cat.code}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${hoverBgClass}`}
                  >
                    <input
                      type="checkbox"
                      checked={crime.categories.includes(cat.code)}
                      onChange={() => toggleCrimeCategory(cat.code)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span
                      className="w-3 h-3 rounded-full"
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
          </div>
        )}
      </div>
    </div>
  );
}
