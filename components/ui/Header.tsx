'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function Header() {
  const { user, profile, signOut, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-2 sm:p-4 bg-zinc-950/50 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-lg sm:text-xl">📍</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate text-white">Tilannetieto</h1>
            <p className="text-xs hidden sm:block text-zinc-400">Suomen reaaliaikainen kartta</p>
          </div>
        </div>

        {!isLoading && (
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {(profile?.display_name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-zinc-300 hidden sm:block max-w-[120px] truncate">
                    {profile?.display_name || user.email}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profiili
                    </Link>
                    <Link
                      href="/roadmap"
                      className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      Roadmap
                    </Link>
                    <a
                      href="https://datasuomi.fi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      📊 DataSuomi.fi &rarr;
                    </a>
                    <hr className="border-zinc-800 my-1" />
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                      Kirjaudu ulos
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a
                  href="https://datasuomi.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Tilastot &rarr;
                </a>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Kirjaudu
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
