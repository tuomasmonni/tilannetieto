'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { NEWS_CATEGORIES, NEWS_SOURCES, type NewsCategoryKey, type NewsSourceKey } from '@/lib/constants';

export default function NewsSettings() {
  const { news, theme, setNewsTimeRange, toggleNewsSource, toggleNewsCategory, setNewsSearchQuery } = useUnifiedFilters();
  const isDark = theme === 'dark';

  const timeOptions: { value: typeof news.timeRange; label: string }[] = [
    { value: '1h', label: '1h' },
    { value: '6h', label: '6h' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7pv' },
    { value: '30d', label: '30pv' },
  ];

  return (
    <div className="space-y-3">
      {/* Time range */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Aikaikkuna
        </label>
        <div className={`grid grid-cols-5 gap-1 p-1 rounded-lg mt-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          {timeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setNewsTimeRange(opt.value)}
              className={`px-1 py-1.5 text-xs font-medium rounded-md transition-all ${
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
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Media
        </label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(Object.entries(NEWS_SOURCES) as [NewsSourceKey, typeof NEWS_SOURCES[NewsSourceKey]][]).map(([key, src]) => (
            <button
              key={key}
              onClick={() => toggleNewsSource(key)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors border ${
                news.sources.includes(key)
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : isDark ? 'border-zinc-700 text-zinc-500' : 'border-zinc-300 text-zinc-400'
              }`}
            >
              {src.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Kategoriat
        </label>
        <div className="space-y-1 mt-1 max-h-36 overflow-y-auto">
          {(Object.entries(NEWS_CATEGORIES) as [NewsCategoryKey, typeof NEWS_CATEGORIES[NewsCategoryKey]][]).map(([key, cat]) => (
            <label
              key={key}
              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
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
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
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
          className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
            isDark
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 focus:border-amber-500'
              : 'bg-white text-zinc-900 border-zinc-300 focus:border-amber-500'
          }`}
        />
      </div>
    </div>
  );
}
