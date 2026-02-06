'use client';

import { useEffect, useRef } from 'react';
import { CRIME_CATEGORIES } from '@/lib/constants';

interface CrimeMunicipalityDetailProps {
  municipalityName: string;
  year: number;
  breakdown: Record<string, number>;
  population?: number;
  screenPosition?: { x: number; y: number };
  onClose: () => void;
}

export default function CrimeMunicipalityDetail({
  municipalityName,
  year,
  breakdown,
  population,
  screenPosition,
  onClose,
}: CrimeMunicipalityDetailProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Detail categories (skip SSS = total)
  const detailCategories = CRIME_CATEGORIES.filter(c => c.code !== 'SSS');
  const totalCrimes = breakdown['SSS'] || 0;
  const maxValue = Math.max(...detailCategories.map(c => breakdown[c.code] || 0), 1);

  const getCardStyle = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      return {
        position: 'fixed' as const,
        left: '0',
        right: '0',
        bottom: '0',
        maxHeight: '80vh',
        borderRadius: '16px 16px 0 0',
      };
    }

    if (screenPosition) {
      const { x, y } = screenPosition;
      const cardWidth = 360;
      const cardHeight = 480;
      const padding = 20;

      let left = x - cardWidth / 2;
      let top = y - cardHeight - 20;

      if (top < padding) top = y + 20;
      if (left < padding) left = padding;
      if (left + cardWidth > window.innerWidth - padding) {
        left = window.innerWidth - cardWidth - padding;
      }

      return {
        position: 'fixed' as const,
        left: `${left}px`,
        top: `${top}px`,
        maxHeight: `${Math.min(cardHeight, window.innerHeight - 100)}px`,
      };
    }

    return {
      position: 'fixed' as const,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      maxHeight: '80vh',
    };
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Card */}
      <div
        ref={cardRef}
        style={getCardStyle()}
        className="z-[60] bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden w-[360px] max-w-[95vw] rounded-xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-700 bg-zinc-800/50">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">{municipalityName}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rikostilastot {year}
                {totalCrimes > 0 && (
                  <span className="ml-2 text-zinc-300">{totalCrimes.toLocaleString('fi-FI')} rikosta yht.</span>
                )}
              </p>
              {population && population > 0 && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  {(totalCrimes / population * 100000).toFixed(0)} / 100 000 as.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Categories with bar chart */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-80">
          {detailCategories.map(cat => {
            const count = breakdown[cat.code] || 0;
            const barWidth = maxValue > 0 ? (count / maxValue) * 100 : 0;
            const perCapita = population && population > 0
              ? (count / population * 100000).toFixed(1)
              : null;

            return (
              <div key={cat.code}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-zinc-300">{cat.label}</span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="font-medium text-zinc-200">{count.toLocaleString('fi-FI')}</span>
                    {perCapita && (
                      <span className="text-zinc-500 ml-1.5">{perCapita}/100k</span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: cat.color,
                      opacity: count > 0 ? 1 : 0.2,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/80">
          <p className="text-[10px] text-zinc-500">Tilastokeskus ICCS</p>
        </div>
      </div>
    </>
  );
}
