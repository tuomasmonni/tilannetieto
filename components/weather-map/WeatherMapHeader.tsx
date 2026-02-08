'use client';

import Link from 'next/link';

interface WeatherMapHeaderProps {
  lastUpdated: string | null;
}

export default function WeatherMapHeader({ lastUpdated }: WeatherMapHeaderProps) {
  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex items-center justify-between p-3 sm:p-4">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl glass-surface border border-white/10 text-zinc-200 hover:text-white hover:border-white/20 transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="hidden sm:inline">Takaisin karttaan</span>
        </Link>
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl glass-surface border border-white/10">
          <h1 className="text-sm sm:text-base font-semibold text-white">Saakartta</h1>
          {timeStr && <span className="text-[11px] text-zinc-400">{timeStr}</span>}
        </div>
        <div className="w-[120px]" /> {/* Spacer for balance */}
      </div>
    </header>
  );
}
