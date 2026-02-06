'use client';

import { useEffect, useRef } from 'react';
import { EVENT_CATEGORIES } from '@/lib/constants';
import type { EventDetails } from '@/lib/types';

interface EventDetailCardProps {
  event: EventDetails | null;
  onClose: () => void;
}

const severityLabels = {
  low: { label: 'Matala', color: 'bg-green-500', border: 'border-green-500' },
  medium: { label: 'Keskitaso', color: 'bg-yellow-500', border: 'border-yellow-500' },
  high: { label: 'Korkea', color: 'bg-red-500', border: 'border-red-500' },
};

export default function EventDetailCard({ event, onClose }: EventDetailCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Sulje kortti kun klikataan ulkopuolelle
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

  // Sulje ESC-näppäimellä
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!event) return null;

  const categoryInfo = EVENT_CATEGORIES[event.category] || {
    emoji: '📍',
    label: 'Tapahtuma',
    color: '#666666',
  };
  const severityInfo = severityLabels[event.severity];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fi-FI', {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCardStyle = () => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return {
        position: 'fixed' as const,
        left: '0',
        right: '0',
        bottom: '0',
        maxHeight: '70vh',
        borderRadius: '16px 16px 0 0',
      };
    }

    if (event.screenPosition) {
      const { x, y } = event.screenPosition;
      const cardWidth = 320;
      const cardHeight = 400;
      const padding = 20;

      let left = x - cardWidth / 2;
      let top = y - cardHeight - 20;

      if (top < padding) {
        top = y + 20;
      }

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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Tumma overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Kortti */}
      <div
        ref={cardRef}
        style={getCardStyle()}
        className={`
          z-[60] bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden
          animate-in fade-in duration-200
          ${isMobile
            ? 'w-full slide-in-from-bottom-4'
            : 'w-80 rounded-xl zoom-in-95'
          }
        `}
      >
        {/* Header värikoodilla */}
        <div
          className="p-4 border-b border-zinc-700"
          style={{ backgroundColor: categoryInfo.color + '20' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0">{categoryInfo.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: categoryInfo.color + '40', color: categoryInfo.color }}
                  >
                    {categoryInfo.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${severityInfo.color}`} />
                </div>
                <h2 className="text-sm font-bold text-white leading-tight line-clamp-2">
                  {event.title}
                </h2>
              </div>
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

        {/* Content - scrollable */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-64">
          {event.description && (
            <div>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Location */}
          <div className="bg-zinc-800/50 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-xs">
                <p className="text-zinc-200">{event.locationName}</p>
                {event.municipality && (
                  <p className="text-zinc-400">{event.municipality}</p>
                )}
                {event.road && (
                  <p className="text-zinc-500">Tie {event.road}</p>
                )}
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="bg-zinc-800/50 rounded-lg p-2.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs">
                <span className="text-zinc-200">{formatDate(event.timestamp)}</span>
                {event.endTime && (
                  <span className="text-zinc-400"> — {formatDate(event.endTime)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>{event.source}</span>
            <span className={`px-1.5 py-0.5 rounded ${severityInfo.color}/20 ${severityInfo.border} border`}>
              {severityInfo.label}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
