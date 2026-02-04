'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

interface MobileFilterFABProps {
  onClick: () => void;
  isDark: boolean;
}

export default function MobileFilterFAB({ onClick, isDark }: MobileFilterFABProps) {
  const { traffic, crime, weatherCamera } = useUnifiedFilters();

  // Laske aktiivisten filtterien määrä
  const activeFiltersCount =
    (traffic.layerVisible ? traffic.categories.length : 0) +
    (crime.layerVisible ? crime.categories.length : 0) +
    (weatherCamera.layerVisible ? 1 : 0);

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-20 right-4 md:bottom-8 md:right-4 lg:hidden
        w-14 h-14 rounded-full shadow-xl
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-4
        z-30
        ${isDark
          ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/50'
          : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400/50'
        }
      `}
      aria-label="Open filters"
      aria-expanded="false"
    >
      {/* Filter icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-6 h-6 text-white"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
        />
      </svg>

      {/* Badge */}
      {activeFiltersCount > 0 && (
        <span
          className={`
            absolute -top-1 -right-1
            w-6 h-6 rounded-full
            flex items-center justify-center
            text-xs font-bold text-white
            ${isDark ? 'bg-red-600' : 'bg-red-500'}
            shadow-lg
          `}
          aria-label={`${activeFiltersCount} active filters`}
        >
          {activeFiltersCount}
        </span>
      )}
    </button>
  );
}
