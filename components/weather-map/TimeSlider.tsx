'use client';

import { useMemo } from 'react';

interface TimeSliderProps {
  hours: string[];
  currentIndex: number;
  playing: boolean;
  forecastMode: boolean;
  onHourChange: (index: number) => void;
  onPlayToggle: () => void;
  onModeToggle: () => void;
}

export default function TimeSlider({
  hours,
  currentIndex,
  playing,
  forecastMode,
  onHourChange,
  onPlayToggle,
  onModeToggle,
}: TimeSliderProps) {
  const currentTime = forecastMode && hours.length > 0 ? hours[currentIndex] : undefined;

  const timeLabel = useMemo(() => {
    if (!currentTime) return '';
    return new Date(currentTime).toLocaleString('fi-FI', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [currentTime]);

  const offsetLabel = useMemo(() => {
    if (!currentTime || !hours[0]) return '';
    const startMs = new Date(hours[0]).getTime();
    const currentMs = new Date(currentTime).getTime();
    const diffH = Math.round((currentMs - startMs) / 3600000);
    return diffH === 0 ? 'Nyt' : `+${diffH}h`;
  }, [currentTime, hours]);

  if (!forecastMode || hours.length === 0) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 lg:bottom-6">
        <button
          onClick={onModeToggle}
          className="px-4 py-2 rounded-xl glass-surface border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all text-sm"
        >
          Ennuste 48h
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:w-[600px]">
      <div className="glass-surface border border-white/10 rounded-xl p-3 flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onModeToggle}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Havaintoihin
          </button>
          <span className="text-sm font-medium text-white">{timeLabel}</span>
          <span className="text-xs text-cyan-400 font-mono">{offsetLabel}</span>
        </div>

        {/* Slider + controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
          >
            {playing ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <input
            type="range"
            min={0}
            max={hours.length - 1}
            value={currentIndex}
            onChange={(e) => onHourChange(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Time markers */}
        <div className="flex justify-between px-1">
          {[
            0,
            Math.floor(hours.length / 4),
            Math.floor(hours.length / 2),
            Math.floor((hours.length * 3) / 4),
            hours.length - 1,
          ].map((i) => {
            const h = hours[i];
            if (!h) return null;
            return (
              <span key={i} className="text-[9px] text-zinc-500">
                {new Date(h).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
