'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { LAYER_GROUPS, type LayerGroupKey } from '@/lib/constants';

const TAB_ORDER: LayerGroupKey[] = ['weather', 'traffic', 'energy', 'statistics', 'health', 'media', 'services'];

interface BottomTabBarProps {
  onTabSelect: (group: LayerGroupKey) => void;
}

export default function BottomTabBar({ onTabSelect }: BottomTabBarProps) {
  const { theme, activeGroup, getActiveLayerCount } = useUnifiedFilters();
  const isDark = theme === 'dark';

  return (
    <nav
      aria-label="Kategorianavigaatio"
      className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden ${
        isDark ? 'glass-surface border-t border-white/10' : 'glass-surface-light border-t border-black/10'
      }`}
      style={{ borderRight: 'none' }}
    >
      <div className="flex items-center h-14" role="tablist">
        {TAB_ORDER.map(groupKey => {
          const group = LAYER_GROUPS[groupKey];
          const isActive = activeGroup === groupKey;
          const count = getActiveLayerCount(groupKey);

          return (
            <button
              key={groupKey}
              onClick={() => onTabSelect(groupKey)}
              aria-label={`${group.label} kategoria`}
              aria-selected={isActive}
              role="tab"
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
                isActive
                  ? ''
                  : isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
              )}

              <span className="text-lg relative">
                {group.icon}
                {count > 0 && (
                  <span
                    className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: group.color }}
                  >
                    {count}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isActive
                    ? isDark ? 'text-zinc-200' : 'text-zinc-900'
                    : ''
                }`}
              >
                {group.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
