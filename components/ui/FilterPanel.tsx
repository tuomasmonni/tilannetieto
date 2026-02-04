'use client';

import { useState } from 'react';
import {
  useUnifiedFilters,
  CRIME_CATEGORIES,
  AVAILABLE_YEARS,
} from '@/lib/contexts/UnifiedFilterContext';
import { EVENT_CATEGORIES } from '@/lib/constants';

export default function FilterPanel() {
  const {
    crime,
    traffic,
    weatherCamera,
    theme,
    setCrimeYear,
    toggleCrimeCategory,
    setCrimeLayerVisible,
    setTrafficTimeRange,
    toggleTrafficCategory,
    setTrafficLayerVisible,
    setWeatherCameraLayerVisible,
  } = useUnifiedFilters();

  const [crimeExpanded, setCrimeExpanded] = useState(false);
  const [trafficExpanded, setTrafficExpanded] = useState(true);
  const [weatherCameraExpanded, setWeatherCameraExpanded] = useState(false);

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-zinc-200';
  const textClass = isDark ? 'text-zinc-200' : 'text-zinc-800';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const hoverBgClass = isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100';
  const selectBgClass = isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300';
  const buttonBgClass = isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300';

  const timeRangeButtons = [
    { value: '2h' as const, label: '2h' },
    { value: '8h' as const, label: '8h' },
    { value: '24h' as const, label: '24h' },
    { value: '7d' as const, label: '7pv' },
    { value: 'all' as const, label: 'All' },
  ];

  return (
    <div className={`w-80 md:w-96 backdrop-blur-sm rounded-lg border shadow-xl overflow-hidden transition-colors max-h-[80vh] overflow-y-auto ${bgClass}`}>
      {/* ========== SECTION 1: LIIKENNE ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setTrafficExpanded(!trafficExpanded)}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
            >
              <span>🚗</span>
              <span>LIIKENNE</span>
              <span
                className={`transition-transform text-xs ml-auto ${
                  trafficExpanded ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            <button
              onClick={() => setTrafficLayerVisible(!traffic.layerVisible)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                traffic.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
              }`}
            >
              {traffic.layerVisible ? 'ON' : 'OFF'}
            </button>
          </div>

          {trafficExpanded && (
            <div className="space-y-3 pt-2">
              {/* Time range buttons */}
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>
                  Aikaväli
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {timeRangeButtons.map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => setTrafficTimeRange(btn.value)}
                      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                        traffic.timeRange === btn.value
                          ? 'bg-blue-600 text-white'
                          : buttonBgClass
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category checkboxes */}
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>
                  Tapahtumat
                </label>
                <div className="space-y-1">
                  {['accident', 'disruption', 'roadwork', 'weather', 'train', 'police', 'fire', 'transit'].map((catKey) => {
                    const cat = EVENT_CATEGORIES[catKey as keyof typeof EVENT_CATEGORIES];
                    return (
                      <label
                        key={catKey}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${hoverBgClass}`}
                      >
                        <input
                          type="checkbox"
                          checked={traffic.categories.includes(
                            catKey as any
                          )}
                          onChange={() =>
                            toggleTrafficCategory(catKey as any)
                          }
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-lg">{cat.emoji}</span>
                        <span className={`text-sm flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          {cat.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
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

      {/* ========== SECTION 3: KELIKAMERAT ========== */}
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
                💡 Klikkaa kamera-ikonia kartalla nähdäksesi kuvat modalissa
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
