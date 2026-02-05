'use client';

import { useState } from 'react';
import {
  useUnifiedFilters,
  CRIME_CATEGORIES,
  AVAILABLE_YEARS,
} from '@/lib/contexts/UnifiedFilterContext';
import { EVENT_CATEGORIES, NEWS_CATEGORIES, NEWS_SOURCES, type EventCategory, type NewsCategoryKey, type NewsSourceKey } from '@/lib/constants';

export default function FilterPanel() {
  const {
    crime,
    traffic,
    weather,
    transit,
    roadWeather,
    weatherCamera,
    news,
    theme,
    setCrimeYear,
    toggleCrimeCategory,
    setCrimeLayerVisible,
    setCrimeDisplayMode,
    setTrafficLayerVisible,
    setTrafficTimeRange,
    toggleTrafficCategory,
    setWeatherLayerVisible,
    setWeatherMetric,
    setTransitLayerVisible,
    toggleTransitVehicleType,
    setRoadWeatherLayerVisible,
    setWeatherCameraLayerVisible,
    setNewsLayerVisible,
    setNewsTimeRange,
    toggleNewsSource,
    toggleNewsCategory,
    setNewsSearchQuery,
  } = useUnifiedFilters();

  const [expandedSection, setExpandedSection] = useState<string | null>('news');
  const [crimeInfoExpanded, setCrimeInfoExpanded] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
    if (section !== 'crime') setCrimeInfoExpanded(false);
  };

  const crimeExpanded = expandedSection === 'crime';
  const weatherCameraExpanded = expandedSection === 'weatherCamera';
  const weatherExpanded = expandedSection === 'weather';
  const transitExpanded = expandedSection === 'transit';
  const trafficExpanded = expandedSection === 'traffic';
  const roadWeatherExpanded = expandedSection === 'roadWeather';
  const newsExpanded = expandedSection === 'news';

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-zinc-200';
  const textClass = isDark ? 'text-zinc-200' : 'text-zinc-800';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const hoverBgClass = isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100';
  const selectBgClass = isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300';

  return (
    <div className={`w-80 md:w-96 backdrop-blur-sm rounded-lg border shadow-xl overflow-hidden transition-colors max-h-[80vh] overflow-y-auto ${bgClass}`}>
      {/* ========== SECTION 0: UUTISET ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection('news')}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
            >
              <span className="text-amber-400">&#128240;</span>
              <span>UUTISET</span>
              <span className={`transition-transform text-xs ml-auto ${newsExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
            </button>

            <button
              onClick={() => setNewsLayerVisible(!news.layerVisible)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                news.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
              }`}
            >
              {news.layerVisible ? 'ON' : 'OFF'}
            </button>
          </div>

          {newsExpanded && (
            <div className="space-y-3 pt-2">
              {/* Time range */}
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Aikaikkuna</label>
                <div className="grid grid-cols-5 gap-1 p-1 rounded bg-zinc-100 dark:bg-zinc-800">
                  {([
                    { value: '1h' as const, label: '1h' },
                    { value: '6h' as const, label: '6h' },
                    { value: '24h' as const, label: '24h' },
                    { value: '7d' as const, label: '7pv' },
                    { value: '30d' as const, label: '30pv' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNewsTimeRange(opt.value)}
                      className={`px-1 py-1.5 text-xs font-medium rounded transition-all ${
                        news.timeRange === opt.value
                          ? 'bg-amber-600 text-white shadow-sm'
                          : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media sources */}
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Media</label>
                <div className="flex gap-2">
                  {(Object.entries(NEWS_SOURCES) as [NewsSourceKey, typeof NEWS_SOURCES[NewsSourceKey]][]).map(([key, src]) => (
                    <button
                      key={key}
                      onClick={() => toggleNewsSource(key)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                        news.sources.includes(key)
                          ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                          : isDark ? 'border-zinc-700 text-zinc-500' : 'border-zinc-300 text-zinc-400'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Kategoriat</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {(Object.entries(NEWS_CATEGORIES) as [NewsCategoryKey, typeof NEWS_CATEGORIES[NewsCategoryKey]][]).map(([key, cat]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${hoverBgClass}`}
                    >
                      <input
                        type="checkbox"
                        checked={news.categories.includes(key)}
                        onChange={() => toggleNewsCategory(key)}
                        className="w-3.5 h-3.5 rounded accent-amber-600"
                      />
                      <span className="text-sm">{cat.emoji}</span>
                      <span className={`text-xs flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {cat.label}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Hae uutisista..."
                  value={news.searchQuery}
                  onChange={(e) => setNewsSearchQuery(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded border text-xs focus:border-amber-500 focus:outline-none transition-colors ${selectBgClass}`}
                />
              </div>

              <p className={`text-xs ${textMutedClass}`}>
                {news.layerVisible
                  ? 'YLE, Iltalehti, MTV uutiset kartalla (AI-analysoitu)'
                  : 'Uutiskerros piilotettu'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== SECTION 1: KELIKAMERAT ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection('weatherCamera')}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
            >
              <span>&#128247;</span>
              <span>KELIKAMERAT</span>
              <span
                className={`transition-transform text-xs ml-auto ${
                  weatherCameraExpanded ? 'rotate-180' : ''
                }`}
              >
                &#9660;
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

      {/* ========== SECTION 2: SÄÄ ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection('weather')}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
            >
              <span className="text-cyan-400">&#9730;</span>
              <span>SÄÄ</span>
              <span className={`transition-transform text-xs ml-auto ${weatherExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
            </button>

            <button
              onClick={() => setWeatherLayerVisible(!weather.layerVisible)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                weather.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
              }`}
            >
              {weather.layerVisible ? 'ON' : 'OFF'}
            </button>
          </div>

          {weatherExpanded && (
            <div className="space-y-3 pt-2">
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Metriikka</label>
                <div
                  role="radiogroup"
                  aria-label="Sään näyttömetriikka"
                  className="grid grid-cols-3 gap-1 p-1 rounded bg-zinc-100 dark:bg-zinc-800"
                >
                  {([
                    { value: 'temperature' as const, label: 'Lämpö' },
                    { value: 'wind' as const, label: 'Tuuli' },
                    { value: 'precipitation' as const, label: 'Sade' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      role="radio"
                      aria-checked={weather.metric === opt.value}
                      onClick={() => setWeatherMetric(opt.value)}
                      className={`px-2 py-1.5 text-xs font-medium rounded transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        weather.metric === opt.value
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className={`text-xs ${textMutedClass}`}>
                {weather.layerVisible
                  ? 'FMI sääasemat kartalla (klusteroitu)'
                  : 'Sääkerros piilotettu'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== SECTION 3: JOUKKOLIIKENNE ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection('transit')}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
            >
              <span className="text-emerald-400">&#128652;</span>
              <span>JOUKKOLIIKENNE</span>
              <span className={`transition-transform text-xs ml-auto ${transitExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
            </button>

            <button
              onClick={() => setTransitLayerVisible(!transit.layerVisible)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                transit.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
              }`}
            >
              {transit.layerVisible ? 'ON' : 'OFF'}
            </button>
          </div>

          {transitExpanded && (
            <div className="space-y-3 pt-2">
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Ajoneuvotyyppi</label>
                <div className="space-y-1">
                  {([
                    { type: 'bus' as const, label: 'Bussi', emoji: '&#128652;' },
                    { type: 'tram' as const, label: 'Ratikka', emoji: '&#128650;' },
                    { type: 'metro' as const, label: 'Metro', emoji: '&#128647;' },
                    { type: 'train' as const, label: 'Lähijuna', emoji: '&#128646;' },
                  ]).map(vt => (
                    <label
                      key={vt.type}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${hoverBgClass}`}
                    >
                      <input
                        type="checkbox"
                        checked={transit.vehicleTypes.includes(vt.type)}
                        onChange={() => toggleTransitVehicleType(vt.type)}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span dangerouslySetInnerHTML={{ __html: vt.emoji }} />
                      <span className={`text-sm flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {vt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <p className={`text-xs ${textMutedClass}`}>
                {transit.layerVisible
                  ? 'HSL-alueen joukkoliikenne (15s päivitys)'
                  : 'Joukkoliikennekerros piilotettu'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== SECTION 4: TIESÄÄ ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection('roadWeather')}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
            >
              <span className="text-violet-400">&#127777;</span>
              <span>TIESÄÄ</span>
              <span className={`transition-transform text-xs ml-auto ${roadWeatherExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
            </button>

            <button
              onClick={() => setRoadWeatherLayerVisible(!roadWeather.layerVisible)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                roadWeather.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
              }`}
            >
              {roadWeather.layerVisible ? 'ON' : 'OFF'}
            </button>
          </div>

          {roadWeatherExpanded && (
            <div className="space-y-3 pt-2">
              <p className={`text-xs ${textMutedClass}`}>
                {roadWeather.layerVisible
                  ? '~500 tiesääasemaa kartalla'
                  : 'Tiesääkerros piilotettu'}
              </p>
              <p className={`text-xs ${textMutedClass} italic`}>
                Korkean vakavuuden kohteet (jää, huono näkyvyys) korostettu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== SECTION 5: LIIKENNE ========== */}
      <div className={`border-b ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection('traffic')}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
            >
              <span className="text-orange-400">&#9888;</span>
              <span>LIIKENNE</span>
              <span className={`transition-transform text-xs ml-auto ${trafficExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
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
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Aikaikkuna</label>
                <div className="grid grid-cols-5 gap-1 p-1 rounded bg-zinc-100 dark:bg-zinc-800">
                  {([
                    { value: '2h' as const, label: '2h' },
                    { value: '8h' as const, label: '8h' },
                    { value: '24h' as const, label: '24h' },
                    { value: '7d' as const, label: '7pv' },
                    { value: 'all' as const, label: 'Kaikki' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTrafficTimeRange(opt.value)}
                      className={`px-1 py-1.5 text-xs font-medium rounded transition-all ${
                        traffic.timeRange === opt.value
                          ? 'bg-orange-600 text-white shadow-sm'
                          : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Kategoriat</label>
                <div className="space-y-1">
                  {(['accident', 'disruption', 'roadwork', 'weather'] as EventCategory[]).map(cat => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${hoverBgClass}`}
                    >
                      <input
                        type="checkbox"
                        checked={traffic.categories.includes(cat)}
                        onChange={() => toggleTrafficCategory(cat)}
                        className="w-4 h-4 rounded accent-orange-600"
                      />
                      <span>{EVENT_CATEGORIES[cat].emoji}</span>
                      <span className={`text-sm flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {EVENT_CATEGORIES[cat].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <p className={`text-xs ${textMutedClass}`}>
                {traffic.layerVisible
                  ? 'Fintraffic liikenneilmoitukset kartalla'
                  : 'Liikennekerros piilotettu'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== SECTION 6: RIKOSTILASTOT ========== */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => toggleSection('crime')}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} ${isDark ? 'hover:text-white' : 'hover:text-zinc-900'}`}
          >
            <span>&#128308;</span>
            <span>RIKOSTILASTOT</span>
            <span
              className={`transition-transform text-xs ml-auto ${
                crimeExpanded ? 'rotate-180' : ''
              }`}
            >
              &#9660;
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

            {/* Data info */}
            <div className={`border-t pt-3 ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
              <button
                onClick={() => setCrimeInfoExpanded(!crimeInfoExpanded)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${textMutedClass} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-900'}`}
              >
                <span>&#8505;&#65039;</span>
                <span>Tietoa datasta</span>
                <span className={`transition-transform ${crimeInfoExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
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
