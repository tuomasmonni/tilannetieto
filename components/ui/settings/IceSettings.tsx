'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

export default function IceSettings() {
  const { ice, theme, setIceShowLakes, setIceShowSeaIce, setIceShowIcebreakers } = useUnifiedFilters();
  const isDark = theme === 'dark';

  const subLayers = [
    { key: 'showLakes' as const, label: 'Järvijää (SYKE)', emoji: '🏔️', checked: ice.showLakes, toggle: setIceShowLakes },
    { key: 'showSeaIce' as const, label: 'Merijää (FMI)', emoji: '🌊', checked: ice.showSeaIce, toggle: setIceShowSeaIce },
    { key: 'showIcebreakers' as const, label: 'Jäänmurtajareitit', emoji: '🚢', checked: ice.showIcebreakers, toggle: setIceShowIcebreakers },
  ];

  return (
    <div>
      <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        Alataso
      </label>
      <div className="space-y-1 mt-1">
        {subLayers.map(sl => (
          <label
            key={sl.key}
            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
            }`}
          >
            <input
              type="checkbox"
              checked={sl.checked}
              onChange={() => sl.toggle(!sl.checked)}
              className="w-3.5 h-3.5 rounded accent-sky-500"
            />
            <span className="text-sm">{sl.emoji}</span>
            <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {sl.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
