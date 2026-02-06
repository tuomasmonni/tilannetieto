'use client';

import { useMemo } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

const CRIME_QUANTILES = [
  { label: 'Matala (0-25%)', color: '#c6efce' },
  { label: 'Keskitaso (25-50%)', color: '#ffeb9c' },
  { label: 'Korkea (50-75%)', color: '#ffc7ce' },
  { label: 'Erittäin korkea (75-100%)', color: '#ff6b6b' },
];

const ELECTION_PARTIES = [
  { label: 'Kokoomus', color: '#006288' },
  { label: 'Perussuomalaiset', color: '#FFD700' },
  { label: 'SDP', color: '#E11931' },
  { label: 'Keskusta', color: '#00A651' },
  { label: 'Vihreä liitto', color: '#61BF1A' },
  { label: 'Vasemmistoliitto', color: '#F00A64' },
  { label: 'RKP', color: '#FFDD00' },
  { label: 'KD', color: '#1B3E94' },
];

const ASSOCIATIONS_QUANTILES = [
  { label: 'Vähän (0-25%)', color: '#dbeafe' },
  { label: 'Keskitaso (25-50%)', color: '#93c5fd' },
  { label: 'Paljon (50-75%)', color: '#3b82f6' },
  { label: 'Erittäin paljon (75-100%)', color: '#1e3a5f' },
];

interface LegendConfig {
  title: string;
  items: Array<{ label: string; color: string }>;
}

export default function Legend() {
  const { crime, election, associations, theme } = useUnifiedFilters();

  const legendConfig = useMemo((): LegendConfig | null => {
    const showCrime = crime.layerVisible && crime.categories.length > 0;
    if (showCrime) {
      const suffix = crime.displayMode === 'perCapita' ? ' (per 100k as.)' : '';
      return {
        title: `🔴 Rikostaso (${crime.year})${suffix}`,
        items: CRIME_QUANTILES,
      };
    }

    if (election.layerVisible) {
      return {
        title: `🏛️ Voittajapuolue (${election.year})`,
        items: ELECTION_PARTIES,
      };
    }

    if (associations.layerVisible) {
      const suffix = associations.displayMode === 'perCapita' ? ' (per 1000 as.)' : '';
      return {
        title: `🤝 Yhdistykset${suffix}`,
        items: ASSOCIATIONS_QUANTILES,
      };
    }

    return null;
  }, [crime, election, associations]);

  if (!legendConfig) return null;

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-zinc-200';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textClass = isDark ? 'text-zinc-300' : 'text-zinc-700';
  const borderClass = isDark ? 'border-zinc-600' : 'border-zinc-300';

  return (
    <div className={`backdrop-blur-sm rounded-lg border p-4 min-w-[240px] shadow-lg transition-colors ${bgClass}`}>
      <div>
        <h3 className={`text-xs font-semibold ${textMutedClass} mb-2 uppercase tracking-wide`}>
          {legendConfig.title}
        </h3>
        <div className="space-y-1.5">
          {legendConfig.items.map((q) => (
            <div key={q.label} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border ${borderClass}`}
                style={{ backgroundColor: q.color }}
              />
              <span className={`text-xs ${textClass}`}>{q.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
