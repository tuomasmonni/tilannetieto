'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

export default function AssociationsSettings() {
  const { associations, theme, setAssociationsDisplayMode } = useUnifiedFilters();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-3">
      {/* Näyttötapa */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          N&auml;ytt&ouml;tapa
        </label>
        <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg mt-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          <button
            onClick={() => setAssociationsDisplayMode('count')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              associations.displayMode === 'count'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Lukum&auml;&auml;r&auml;
          </button>
          <button
            onClick={() => setAssociationsDisplayMode('perCapita')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              associations.displayMode === 'perCapita'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Per 1000 as.
          </button>
        </div>
      </div>

      {/* Väriselite */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          V&auml;riskaala
        </label>
        <div className="space-y-1 mt-1">
          {[
            { label: 'Vähän (0-25%)', color: '#dbeafe' },
            { label: 'Keskitaso (25-50%)', color: '#93c5fd' },
            { label: 'Paljon (50-75%)', color: '#3b82f6' },
            { label: 'Erittäin paljon (75-100%)', color: '#1e3a5f' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 border"
                style={{ backgroundColor: item.color, borderColor: isDark ? '#52525b' : '#d4d4d8' }}
              />
              <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tietoa */}
      <div className={`text-[10px] pt-2 border-t ${isDark ? 'border-white/5 text-zinc-500' : 'border-black/5 text-zinc-500'}`}>
        L&auml;hde: PRH Yhdistysrekisteri
      </div>
    </div>
  );
}
