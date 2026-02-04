'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import MobileFilterContent from './MobileFilterContent';

type SheetState = 'closed' | 'half' | 'full';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function MobileFilterSheet({
  isOpen,
  onClose,
  isDark,
}: MobileFilterSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [startY, setStartY] = useState<number>(0);
  const [currentY, setCurrentY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Height mappings
  const heights = {
    closed: 0,
    half: 40,
    full: 90,
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset to half when opening
  useEffect(() => {
    if (isOpen) {
      setSheetState('half');
    }
  }, [isOpen]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const deltaY = e.touches[0].clientY - startY;
      setCurrentY(deltaY);
    },
    [isDragging, startY]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;

    // Swipe down
    if (currentY > threshold) {
      if (sheetState === 'full') {
        setSheetState('half');
      } else if (sheetState === 'half') {
        onClose();
      }
    }
    // Swipe up
    else if (currentY < -threshold) {
      if (sheetState === 'half') {
        setSheetState('full');
      }
    }

    setCurrentY(0);
  }, [isDragging, currentY, sheetState, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentHeight =
    heights[sheetState] + (isDragging ? -(currentY / window.innerHeight) * 100 : 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          fixed bottom-0 left-0 right-0 z-40 lg:hidden
          backdrop-blur-sm rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-out
          ${isDark ? 'bg-zinc-900/95 border-t border-zinc-700' : 'bg-white/95 border-t border-zinc-200'}
        `}
        style={{
          height: `${Math.max(0, Math.min(90, currentHeight))}vh`,
          transform: isDragging ? 'none' : 'translateY(0)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Filter settings"
      >
        {/* Drag handle */}
        <div
          className="w-full py-3 flex justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`w-10 h-1 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-zinc-300'}`}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 48px)' }}>
          <MobileFilterContent mode={sheetState === 'half' ? 'compact' : 'expanded'} />
        </div>
      </div>
    </>
  );
}
