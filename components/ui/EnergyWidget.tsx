'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { FINGRID_DATASETS, type EnergyOverview, type CrossBorderTransfer } from '@/lib/data/fingrid/client';

const REFRESH_INTERVAL = 300_000; // 5 min

export default function EnergyWidget() {
  const { energy, theme } = useUnifiedFilters();
  const isDark = theme === 'dark';
  const [data, setData] = useState<EnergyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fingrid');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const overview: EnergyOverview = await res.json();
      setData(overview);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Virhe ladattaessa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!energy.layerVisible) return;

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [energy.layerVisible, fetchData]);

  if (!energy.layerVisible) return null;

  // Tuotantomix-palkki (stacked bar)
  const renderProductionMix = () => {
    if (!data || data.production === 0) return null;

    const segments = [
      { key: 'nuclear', value: data.nuclear, color: FINGRID_DATASETS.nuclear.color, label: 'Ydin' },
      { key: 'hydro', value: data.hydro, color: FINGRID_DATASETS.hydro.color, label: 'Vesi' },
      { key: 'wind', value: data.wind, color: FINGRID_DATASETS.wind.color, label: 'Tuuli' },
      { key: 'other', value: data.other, color: '#6b7280', label: 'Muu' },
    ].filter(s => s.value > 0);

    const total = segments.reduce((sum, s) => sum + s.value, 0);

    return (
      <div className="space-y-1.5">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden">
          {segments.map(s => (
            <div
              key={s.key}
              className="transition-all duration-500"
              style={{
                width: `${(s.value / total) * 100}%`,
                backgroundColor: s.color,
              }}
              title={`${s.label}: ${Math.round(s.value)} MW (${Math.round((s.value / total) * 100)}%)`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {segments.map(s => (
            <div key={s.key} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {s.label} {Math.round(s.value)} MW
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Error state */}
      {error && (
        <div className={`p-2 rounded-lg text-xs ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
          {error === 'FINGRID_API_KEY not configured'
            ? 'Fingrid API-avain puuttuu. Lisää FINGRID_API_KEY ympäristömuuttujiin.'
            : `Virhe: ${error}`}
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Ladataan sähködataa...
        </div>
      )}

      {/* Data */}
      {data && (
        <>
          {/* Main metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
              <div className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Tuotanto</div>
              <div className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {Math.round(data.production).toLocaleString('fi-FI')} MW
              </div>
            </div>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
              <div className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Kulutus</div>
              <div className={`text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {Math.round(data.consumption).toLocaleString('fi-FI')} MW
              </div>
            </div>
          </div>

          {/* Surplus/deficit indicator */}
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
            data.surplus >= 0
              ? isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'
              : isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
          }`}>
            <span>{data.surplus >= 0 ? '+' : ''}{Math.round(data.surplus).toLocaleString('fi-FI')} MW</span>
            <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>
              {data.surplus >= 0 ? 'ylijäämä (vienti)' : 'alijäämä (tuonti)'}
            </span>
          </div>

          {/* Production mix */}
          <div>
            <div className={`text-[10px] font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Tuotantomix
            </div>
            {renderProductionMix()}
          </div>

          {/* Rajasiirrot */}
          {data.transfers && data.transfers.length > 0 && (
            <div>
              <div className={`text-[10px] font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Rajasiirrot
              </div>
              <div className="space-y-0.5">
                {data.transfers.map((t: CrossBorderTransfer) => {
                  const isExport = t.value >= 0;
                  const label = t.connection.replace('FI-', '');
                  return (
                    <div key={t.connection} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                      isDark ? 'bg-zinc-800' : 'bg-zinc-50'
                    }`}>
                      <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{label}</span>
                      <span className={isExport
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                      }>
                        {isExport ? '→' : '←'} {Math.abs(Math.round(t.value)).toLocaleString('fi-FI')} MW
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Päivitetty {formatTime(data.timestamp)} &middot; Lähde: Fingrid
          </div>
        </>
      )}
    </div>
  );
}
