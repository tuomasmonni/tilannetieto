'use client';

import { useState, useCallback, ReactNode } from 'react';
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

  const handleToggle = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggle(!isVisible);
  }, [isVisible, onToggle]);

  return (
    <div
      className={`rounded-xl transition-colors ${
        isDark
          ? 'bg-white/5 hover:bg-white/[0.08]'
          : 'bg-black/5 hover:bg-black/[0.08]'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 pl-3 pr-1 py-1">
        {/* Left side: label + optional expand */}
        {hasSettings ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left py-1.5"
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
          <div className="flex items-center gap-3 flex-1 min-w-0 py-1.5">
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

        {/* Toggle — 48x48 touch target, visual switch inside */}
        <div
          role="switch"
          tabIndex={0}
          aria-checked={isVisible}
          aria-label={`${info.label} ${isVisible ? 'pois' : 'päälle'}`}
          onClick={handleToggle}
          onTouchEnd={handleToggle}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center cursor-pointer select-none touch-manipulation"
        >
          <div
            className={`relative w-11 h-[26px] rounded-full transition-colors ${
              isVisible
                ? 'bg-green-500'
                : isDark
                ? 'bg-zinc-700'
                : 'bg-zinc-300'
            }`}
          >
            <div
              className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isVisible ? 'translate-x-[24px]' : 'translate-x-[3px]'
              }`}
            />
          </div>
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
