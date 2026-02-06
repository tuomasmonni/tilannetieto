'use client';

import { useState, ReactNode } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { LAYER_INFO, type LayerKey } from '@/lib/constants';

interface LayerCardProps {
  layerKey: LayerKey;
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
  statusText?: string;
  children?: ReactNode;
}

export default function LayerCard({ layerKey, isVisible, onToggle, statusText, children }: LayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useUnifiedFilters();
  const isDark = theme === 'dark';
  const info = LAYER_INFO[layerKey];

  const hasSettings = !!children;

  return (
    <div
      className={`rounded-xl transition-all ${
        isDark
          ? 'bg-white/5 hover:bg-white/[0.08]'
          : 'bg-black/5 hover:bg-black/[0.08]'
      }`}
    >
      {/* Header row - expand and toggle are separate buttons */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Left side: expand trigger (only if has settings) */}
        {hasSettings ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            aria-expanded={expanded}
            aria-label={`${info.label} asetukset`}
          >
            <span className="text-base flex-shrink-0">{info.icon}</span>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {info.label}
              </span>
              {(statusText || info.description) && (
                <p className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {statusText || info.description}
                </p>
              )}
            </div>
            <svg
              className={`w-4 h-4 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''} ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-base flex-shrink-0">{info.icon}</span>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {info.label}
              </span>
              {(statusText || info.description) && (
                <p className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {statusText || info.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Toggle switch - separate from expand, with 44px touch target */}
        <div className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <button
            type="button"
            onClick={() => onToggle(!isVisible)}
            className={`toggle-switch relative w-10 h-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              isVisible
                ? 'bg-green-500 hover:bg-green-600'
                : isDark
                ? 'bg-zinc-700 hover:bg-zinc-600'
                : 'bg-zinc-300 hover:bg-zinc-400'
            }`}
            aria-label={`${info.label} ${isVisible ? 'pois' : 'päälle'}`}
            aria-checked={isVisible}
            role="switch"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                isVisible ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable settings */}
      {hasSettings && expanded && (
        <div className={`px-3 pb-3 pt-1 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
          <div className="layer-settings-enter">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
