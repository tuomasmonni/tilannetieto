'use client';

import { useUnifiedFilters, type TrainType } from '@/lib/contexts/UnifiedFilterContext';

export default function TrainSettings() {
  const { train, theme, toggleTrainType } = useUnifiedFilters();
  const isDark = theme === 'dark';

  const trainTypes: { type: TrainType; label: string; emoji: string }[] = [
    { type: 'IC', label: 'InterCity', emoji: '🚄' },
    { type: 'S', label: 'S-juna', emoji: '🚆' },
    { type: 'Pendolino', label: 'Pendolino', emoji: '🚅' },
    { type: 'commuter', label: 'Lähijuna', emoji: '🚃' },
    { type: 'cargo', label: 'Tavarajuna', emoji: '🚛' },
  ];

  return (
    <div>
      <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        Junatyyppi
      </label>
      <div className="space-y-1 mt-1">
        {trainTypes.map(tt => (
          <label
            key={tt.type}
            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
            }`}
          >
            <input
              type="checkbox"
              checked={train.trainTypes.includes(tt.type)}
              onChange={() => toggleTrainType(tt.type)}
              className="w-3.5 h-3.5 rounded accent-green-600"
            />
            <span className="text-sm">{tt.emoji}</span>
            <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {tt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
