'use client';

import { TEMPERATURE_STOPS } from '@/lib/weather-map/constants';
import { temperatureToCss } from '@/lib/weather-map/color-scales';

export default function TemperatureLegend() {
  // Show key temperature values
  const labels = [-30, -20, -10, 0, 10, 20, 30];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-zinc-400 font-medium">°C</span>
      <div className="relative w-4 h-48 rounded-sm overflow-hidden">
        {/* Gradient bar (top = hot, bottom = cold) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${[...TEMPERATURE_STOPS]
              .reverse()
              .map(([temp, [r, g, b]]) => {
                const pct = ((40 - temp) / 75) * 100; // 40 to -35
                return `rgb(${r},${g},${b}) ${pct}%`;
              })
              .join(', ')})`,
          }}
        />
      </div>
      {/* Labels */}
      <div className="relative h-48 -mt-48 ml-6">
        {labels.map((temp) => {
          const pct = ((40 - temp) / 75) * 100;
          return (
            <div
              key={temp}
              className="absolute flex items-center gap-1"
              style={{ top: `${pct}%`, transform: 'translateY(-50%)' }}
            >
              <div className="w-2 h-px bg-zinc-500" />
              <span
                className={`text-[10px] ${temp === 0 ? 'font-bold text-white' : 'text-zinc-400'}`}
              >
                {temp > 0 ? `+${temp}` : temp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
