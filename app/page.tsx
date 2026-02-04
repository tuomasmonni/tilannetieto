'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import {
  UnifiedFilterProvider,
  useUnifiedFilters,
} from '@/lib/contexts/UnifiedFilterContext';
import type { EventDetails } from '@/lib/types';
import Header from '@/components/ui/Header';
import FilterPanel from '@/components/ui/FilterPanel';
import MobileFilterFAB from '@/components/ui/MobileFilterFAB';
import MobileFilterSheet from '@/components/ui/MobileFilterSheet';
import Legend from '@/components/ui/Legend';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MapContainer from '@/components/map/MapContainer';
import CrimeLayer from '@/components/map/layers/CrimeLayer';
import TrafficLayer from '@/components/map/layers/TrafficLayer';
import EventDetailCard from '@/components/ui/EventDetailCard';
import dynamic from 'next/dynamic';

const WeatherCameraLayer = dynamic(
  () => import('@/components/map/layers/WeatherCameraLayer'),
  { ssr: false }
);

const WeatherCameraModal = dynamic(
  () => import('@/components/ui/WeatherCameraModal'),
  { ssr: false }
);

function AppContent() {
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme } = useUnifiedFilters();

  const handleMapReady = useCallback((mapInstance: MapboxMap) => {
    setMap(mapInstance);
    setIsLoading(false);
  }, []);

  // Close sheet when event detail opens
  useEffect(() => {
    if (selectedEvent) {
      setIsSheetOpen(false);
    }
  }, [selectedEvent]);

  return (
    <main className="relative w-full h-screen bg-zinc-950 overflow-hidden">
      {/* Header */}
      <Header />

      {/* Filter Panel - Left side (hidden on mobile, visible on desktop) */}
      <div className="absolute top-20 left-4 z-10 hidden lg:block">
        <FilterPanel />
      </div>

      {/* Mobile Filter FAB (visible only on mobile/tablet) */}
      <MobileFilterFAB
        onClick={() => setIsSheetOpen(true)}
        isDark={theme === 'dark'}
      />

      {/* Mobile Filter Sheet (visible only on mobile/tablet) */}
      <MobileFilterSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        isDark={theme === 'dark'}
      />

      {/* Map Container */}
      <MapContainer onMapReady={handleMapReady} theme={theme}>
        {map && (
          <>
            <CrimeLayer map={map} />
            <TrafficLayer map={map} onEventSelect={setSelectedEvent} />
            <WeatherCameraLayer map={map} />
          </>
        )}
      </MapContainer>

      {/* Legend - Bottom right (hidden on mobile, visible on md+) */}
      <div className="absolute bottom-8 right-4 z-10 hidden md:block">
        <Legend />
      </div>

      {/* Mobile Legend - Bottom center (visible only on mobile) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 md:hidden">
        <Legend />
      </div>

      {/* Event Details Modal */}
      <EventDetailCard
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Weather Camera Modal */}
      <WeatherCameraModal />

      {/* Info Badge - Bottom left (hidden on mobile, visible on md+) */}
      <div className={`absolute bottom-4 left-4 z-10 hidden md:block px-4 py-3 rounded-lg backdrop-blur text-xs border shadow-lg transition-colors ${
        theme === 'dark'
          ? 'bg-zinc-800/90 text-zinc-400 border-zinc-700'
          : 'bg-white/90 text-zinc-600 border-zinc-200'
      }`}>
        <p className={`font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'}`}>Tietolähteet</p>
        <p>{theme === 'dark' ? 'Tilastokeskus + Fintraffic' : 'Tilastokeskus + Fintraffic'}</p>
        <p className={`mt-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>Päivittyy automaattisesti</p>
      </div>

      {/* Mobile Info Badge - Bottom center */}
      <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 md:hidden px-3 py-2 rounded-lg backdrop-blur text-xs border shadow-lg transition-colors ${
        theme === 'dark'
          ? 'bg-zinc-800/90 text-zinc-400 border-zinc-700'
          : 'bg-white/90 text-zinc-600 border-zinc-200'
      }`}>
        <p className={`font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'}`}>Tilastokeskus + Fintraffic</p>
      </div>

      {/* Loading Screen */}
      {isLoading && <LoadingScreen />}
    </main>
  );
}

export default function Home() {
  return (
    <UnifiedFilterProvider>
      <AppContent />
    </UnifiedFilterProvider>
  );
}
