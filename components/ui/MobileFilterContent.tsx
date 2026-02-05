'use client';

import { useState } from 'react';
import {
  useUnifiedFilters,
  CRIME_CATEGORIES,
  AVAILABLE_YEARS,
} from '@/lib/contexts/UnifiedFilterContext';
import { EVENT_CATEGORIES, type EventCategory } from '@/lib/constants';

interface MobileFilterContentProps {
  mode: 'compact' | 'expanded';
}

export default function MobileFilterContent({ mode }: MobileFilterContentProps) {
  const {
    crime,
    traffic,
    weather,
    transit,
    roadWeather,
    weatherCamera,
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
  } = useUnifiedFilters();

  const [expandedSection, setExpandedSection] = useState<string | null>('weatherCamera');
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
            <button
              onClick={() => setWeatherLayerVisible(!weather.layerVisible)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors min-h-[44px]
                ${weather.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
                }
              `}
            >
              &#9730; Sää
            </button>
            <button
              onClick={() => setTransitLayerVisible(!transit.layerVisible)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors min-h-[44px]
                ${transit.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
                }
              `}
            >
              &#128652; Joukkoliik.
            </button>
            <button
              onClick={() => setTrafficLayerVisible(!traffic.layerVisible)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors min-h-[44px]
                ${traffic.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
                }
              `}
            >
              &#9888; Liikenne
            </button>
            <button
              onClick={() => setRoadWeatherLayerVisible(!roadWeather.layerVisible)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors min-h-[44px]
                ${roadWeather.layerVisible
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
                }
              `}
            >
              &#127777; Tiesää
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
            onClick={() => toggleSection('weatherCamera')}
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

      {/* ========== SÄÄ ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => toggleSection('weather')}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} min-h-[44px]`}
          >
            <span className="text-cyan-400">&#9730;</span>
            <span>SÄÄ</span>
            <span className={`transition-transform text-xs ml-auto ${weatherExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          <button
            onClick={() => setWeatherLayerVisible(!weather.layerVisible)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium
              transition-colors min-h-[44px] min-w-[60px]
              ${weather.layerVisible
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
              }
            `}
          >
            {weather.layerVisible ? 'ON' : 'OFF'}
          </button>
        </div>

        {weatherExpanded && (
          <div className="space-y-3 pt-2">
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Metriikka</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'temperature' as const, label: 'Lämpö' },
                  { value: 'wind' as const, label: 'Tuuli' },
                  { value: 'precipitation' as const, label: 'Sade' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setWeatherMetric(opt.value)}
                    className={`
                      px-3 py-2.5 text-sm font-medium rounded-lg
                      transition-colors min-h-[44px]
                      ${weather.metric === opt.value
                        ? 'bg-cyan-600 text-white'
                        : buttonBgClass
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className={`text-sm ${textMutedClass}`}>
              {weather.layerVisible
                ? 'FMI sääasemat kartalla'
                : 'Sääkerros piilotettu'}
            </p>
          </div>
        )}
      </div>

      {/* ========== JOUKKOLIIKENNE ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => toggleSection('transit')}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} min-h-[44px]`}
          >
            <span className="text-emerald-400">&#128652;</span>
            <span>JOUKKOLIIKENNE</span>
            <span className={`transition-transform text-xs ml-auto ${transitExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          <button
            onClick={() => setTransitLayerVisible(!transit.layerVisible)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium
              transition-colors min-h-[44px] min-w-[60px]
              ${transit.layerVisible
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
              }
            `}
          >
            {transit.layerVisible ? 'ON' : 'OFF'}
          </button>
        </div>

        {transitExpanded && (
          <div className="space-y-3 pt-2">
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Ajoneuvotyyppi</label>
              <div className="space-y-1.5">
                {([
                  { type: 'bus' as const, label: 'Bussi', emoji: '🚌' },
                  { type: 'tram' as const, label: 'Ratikka', emoji: '🚊' },
                  { type: 'metro' as const, label: 'Metro', emoji: '🚇' },
                  { type: 'train' as const, label: 'Lähijuna', emoji: '🚆' },
                ]).map(vt => (
                  <label
                    key={vt.type}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer
                      transition-colors min-h-[48px] ${hoverBgClass}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={transit.vehicleTypes.includes(vt.type)}
                      onChange={() => toggleTransitVehicleType(vt.type)}
                      className="w-6 h-6 rounded accent-emerald-600 flex-shrink-0"
                    />
                    <span className="text-lg">{vt.emoji}</span>
                    <span className={`text-sm flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {vt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <p className={`text-sm ${textMutedClass}`}>
              {transit.layerVisible
                ? 'HSL-alueen joukkoliikenne (15s päivitys)'
                : 'Joukkoliikennekerros piilotettu'}
            </p>
          </div>
        )}
      </div>

      {/* ========== TIESÄÄ ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => toggleSection('roadWeather')}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} min-h-[44px]`}
          >
            <span className="text-violet-400">&#127777;</span>
            <span>TIESÄÄ</span>
            <span className={`transition-transform text-xs ml-auto ${roadWeatherExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          <button
            onClick={() => setRoadWeatherLayerVisible(!roadWeather.layerVisible)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium
              transition-colors min-h-[44px] min-w-[60px]
              ${roadWeather.layerVisible
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
              }
            `}
          >
            {roadWeather.layerVisible ? 'ON' : 'OFF'}
          </button>
        </div>

        {roadWeatherExpanded && (
          <div className="space-y-3 pt-2">
            <p className={`text-sm ${textMutedClass}`}>
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

      {/* ========== LIIKENNE ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => toggleSection('traffic')}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${textClass} min-h-[44px]`}
          >
            <span className="text-orange-400">&#9888;</span>
            <span>LIIKENNE</span>
            <span className={`transition-transform text-xs ml-auto ${trafficExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          <button
            onClick={() => setTrafficLayerVisible(!traffic.layerVisible)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium
              transition-colors min-h-[44px] min-w-[60px]
              ${traffic.layerVisible
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 active:bg-zinc-500'
              }
            `}
          >
            {traffic.layerVisible ? 'ON' : 'OFF'}
          </button>
        </div>

        {trafficExpanded && (
          <div className="space-y-3 pt-2">
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Aikaikkuna</label>
              <div className="grid grid-cols-5 gap-2">
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
                    className={`
                      px-2 py-2.5 text-sm font-medium rounded-lg
                      transition-colors min-h-[44px]
                      ${traffic.timeRange === opt.value
                        ? 'bg-orange-600 text-white'
                        : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`text-xs ${textMutedClass} mb-2 block font-medium`}>Kategoriat</label>
              <div className="space-y-1.5">
                {(['accident', 'disruption', 'roadwork', 'weather'] as EventCategory[]).map(cat => (
                  <label
                    key={cat}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer
                      transition-colors min-h-[48px] ${hoverBgClass}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={traffic.categories.includes(cat)}
                      onChange={() => toggleTrafficCategory(cat)}
                      className="w-6 h-6 rounded accent-orange-600 flex-shrink-0"
                    />
                    <span className="text-lg">{EVENT_CATEGORIES[cat].emoji}</span>
                    <span className={`text-sm flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {EVENT_CATEGORIES[cat].label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <p className={`text-sm ${textMutedClass}`}>
              {traffic.layerVisible
                ? 'Fintraffic liikenneilmoitukset kartalla'
                : 'Liikennekerros piilotettu'}
            </p>
          </div>
        )}
      </div>

      {/* ========== RIKOSTILASTOT ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => toggleSection('crime')}
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
