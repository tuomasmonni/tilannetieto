'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

const ELECTION_YEARS = ['2023', '2019', '2015', '2011', '2007', '2003', '1999'];

const PARTY_LEGEND = [
  { code: 'KOK', name: 'Kokoomus', color: '#006288' },
  { code: 'PS', name: 'Perussuomalaiset', color: '#FFD700' },
  { code: 'SDP', name: 'SDP', color: '#E11931' },
  { code: 'KESK', name: 'Keskusta', color: '#00A651' },
  { code: 'VIHR', name: 'Vihreä liitto', color: '#61BF1A' },
  { code: 'VAS', name: 'Vasemmistoliitto', color: '#F00A64' },
  { code: 'RKP', name: 'RKP', color: '#FFDD00' },
  { code: 'KD', name: 'KD', color: '#1B3E94' },
];

export default function ElectionSettings() {
  const { election, theme, setElectionYear } = useUnifiedFilters();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-3">
      {/* Vuosi */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Vaalivuosi
        </label>
        <select
          value={election.year}
          onChange={(e) => setElectionYear(e.target.value)}
          className={`w-full mt-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
            isDark
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 focus:border-blue-500'
              : 'bg-white text-zinc-900 border-zinc-300 focus:border-blue-500'
          }`}
        >
          {ELECTION_YEARS.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Puoluelegenda */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Voittajapuolueen v&auml;ri
        </label>
        <div className="space-y-1 mt-1">
          {PARTY_LEGEND.map(p => (
            <div key={p.code} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
