'use client';

import { windSpeedToCss } from '@/lib/weather-map/color-scales';

const WIND_LEVELS = [
  { speed: 1, label: 'Tyyntä', range: '<2' },
  { speed: 3, label: 'Heikko', range: '2-5' },
  { speed: 7, label: 'Kohtalainen', range: '5-10' },
  { speed: 12, label: 'Navakka', range: '10-15' },
  { speed: 17, label: 'Kova', range: '15-20' },
  { speed: 22, label: 'Myrsky', range: '20+' },
];

export default function WindLegend() {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-zinc-400 font-medium">m/s</span>
      {WIND_LEVELS.map(({ speed, label, range }) => (
        <div key={speed} className="flex items-center gap-1.5">
          <div
            className="w-4 h-1.5 rounded-full"
            style={{ backgroundColor: windSpeedToCss(speed) }}
          />
          <span className="text-[10px] text-zinc-400">{range}</span>
        </div>
      ))}
    </div>
  );
}
