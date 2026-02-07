'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

interface SidebarFooterProps {
  collapsed: boolean;
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { theme, setTheme } = useUnifiedFilters();
  const { user, profile, signOut, isLoading } = useAuth();
  const isDark = theme === 'dark';

  if (collapsed) {
    return (
      <div className={`p-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <a
          href="https://datasuomi.fi"
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full p-2 rounded-lg text-center transition-colors ${
            isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/10 text-zinc-600'
          }`}
          aria-label="DataSuomi.fi"
          title="DataSuomi.fi — Tilastot"
        >
          📊
        </a>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`w-full p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/10 text-zinc-600'
          }`}
          aria-label={isDark ? 'Vaihda vaaleaan teemaan' : 'Vaihda tummaan teemaan'}
        >
          {isDark ? '🌙' : '☀️'}
        </button>
        {!isLoading && !user && (
          <Link
            href="/login"
            className={`block w-full p-2 mt-1 rounded-lg text-center transition-colors ${isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/10 text-zinc-600'}`}
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
      {!isLoading && user && (
        <div
          className={`flex items-center gap-2 mb-2 px-1 py-1.5 rounded-lg ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {(profile?.display_name || user.email || '?')[0].toUpperCase()}
          </div>
          <span className="text-xs truncate flex-1">{profile?.display_name || user.email}</span>
        </div>
      )}
      {!isLoading && user && (
        <div className="flex items-center gap-1 mb-2">
          <Link
            href="/profile"
            className={`flex-1 text-center px-2 py-1 rounded text-[11px] transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200' : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-900'}`}
          >
            Profiili
          </Link>
          <Link
            href="/roadmap"
            className={`flex-1 text-center px-2 py-1 rounded text-[11px] transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200' : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-900'}`}
          >
            Roadmap
          </Link>
          <button
            onClick={signOut}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${isDark ? 'hover:bg-white/10 text-zinc-500 hover:text-zinc-300' : 'hover:bg-black/10 text-zinc-500 hover:text-zinc-700'}`}
          >
            Ulos
          </button>
        </div>
      )}
      {!isLoading && !user && (
        <Link
          href="/login"
          className={`block text-center px-2 py-1.5 mb-2 rounded-lg text-xs transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200' : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-900'}`}
        >
          Kirjaudu sisään
        </Link>
      )}
      <a
        href="https://datasuomi.fi"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 px-2 py-1.5 mb-2 rounded-lg text-xs transition-colors ${
          isDark
            ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
            : 'bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-900'
        }`}
      >
        <span>📊</span>
        <span>DataSuomi.fi</span>
        <span className={`ml-auto text-[10px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          &rarr;
        </span>
      </a>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
            isDark
              ? 'hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
              : 'hover:bg-black/10 text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <span>{isDark ? '🌙' : '☀️'}</span>
          <span>{isDark ? 'Tumma' : 'Vaalea'}</span>
        </button>
        <span className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          tilannetieto.fi
        </span>
      </div>
    </div>
  );
}
