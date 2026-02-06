'use client';

import { useState, useCallback } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import {
  UnifiedFilterProvider,
  useUnifiedFilters,
} from '@/lib/contexts/UnifiedFilterContext';
import { type LayerGroupKey } from '@/lib/constants';
import Header from '@/components/ui/Header';
import Sidebar from '@/components/ui/Sidebar';
import BottomTabBar from '@/components/ui/BottomTabBar';
import CategorySheet from '@/components/ui/CategorySheet';
import ActiveGroupChip from '@/components/ui/ActiveGroupChip';
import Legend from '@/components/ui/Legend';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MapContainer from '@/components/map/MapContainer';
import CrimeLayer from '@/components/map/layers/CrimeLayer';
import EventDetailCard from '@/components/ui/EventDetailCard';
import type { EventDetails } from '@/lib/types';
import dynamic from 'next/dynamic';

const WeatherCameraLayer = dynamic(
  () => import('@/components/map/layers/WeatherCameraLayer'),
  { ssr: false }
);

const TrafficLayer = dynamic(
  () => import('@/components/map/layers/TrafficLayer'),
  { ssr: false }
);

const WeatherLayer = dynamic(
  () => import('@/components/map/layers/WeatherLayer'),
  { ssr: false }
);

const TransitLayer = dynamic(
  () => import('@/components/map/layers/TransitLayer'),
  { ssr: false }
);

const RoadWeatherLayer = dynamic(
  () => import('@/components/map/layers/RoadWeatherLayer'),
  { ssr: false }
);

const NewsLayer = dynamic(
  () => import('@/components/map/layers/NewsLayer'),
  { ssr: false }
);

const ElectionLayer = dynamic(
  () => import('@/components/map/layers/ElectionLayer'),
  { ssr: false }
);

const AssociationsLayer = dynamic(
  () => import('@/components/map/layers/AssociationsLayer'),
  { ssr: false }
);

const TrainLayer = dynamic(
  () => import('@/components/map/layers/TrainLayer'),
  { ssr: false }
);

const SnowLayer = dynamic(
  () => import('@/components/map/layers/SnowLayer'),
  { ssr: false }
);

const WeatherCameraModal = dynamic(
  () => import('@/components/ui/WeatherCameraModal'),
  { ssr: false }
);

function AppContent() {
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSheetGroup, setMobileSheetGroup] = useState<LayerGroupKey | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const { theme, activeGroup, setActiveGroup } = useUnifiedFilters();

  const handleMapReady = useCallback((mapInstance: MapboxMap) => {
    setMap(mapInstance);
    setIsLoading(false);
  }, []);

  const handleEventSelect = useCallback((event: EventDetails | null) => {
    setSelectedEvent(event);
  }, []);

  const handleTabSelect = useCallback((group: LayerGroupKey) => {
    if (mobileSheetGroup === group) {
      // Tap same tab → close sheet
      setMobileSheetGroup(null);
    } else {
      // Activate group and open sheet
      setActiveGroup(group);
      setMobileSheetGroup(group);
    }
  }, [mobileSheetGroup, setActiveGroup]);

  const handleSheetClose = useCallback(() => {
    setMobileSheetGroup(null);
  }, []);

  return (
    <main className="relative w-full h-screen bg-zinc-950 overflow-hidden">
      {/* Header - hidden on desktop (sidebar has its own header) */}
      <div className="lg:hidden">
        <Header />
      </div>

      {/* Desktop Sidebar */}
      <div className="absolute top-0 left-0 bottom-0 z-10 hidden lg:block">
        <Sidebar />
      </div>

      {/* Map Container */}
      <MapContainer onMapReady={handleMapReady} theme={theme}>
        {map && (
          <>
            <CrimeLayer map={map} />
            <TrafficLayer map={map} onEventSelect={handleEventSelect} />
            <WeatherCameraLayer map={map} />
            <WeatherLayer map={map} onEventSelect={handleEventSelect} />
            <TransitLayer map={map} onEventSelect={handleEventSelect} />
            <RoadWeatherLayer map={map} onEventSelect={handleEventSelect} />
            <NewsLayer map={map} onEventSelect={handleEventSelect} />
            <TrainLayer map={map} onEventSelect={handleEventSelect} />
            <SnowLayer map={map} onEventSelect={handleEventSelect} />
            <ElectionLayer map={map} />
            <AssociationsLayer map={map} />
          </>
        )}
      </MapContainer>

      {/* Mobile: Active group chip (floating above tab bar) */}
      <ActiveGroupChip />

      {/* Mobile: Category bottom sheet */}
      <CategorySheet group={mobileSheetGroup} onClose={handleSheetClose} />

      {/* Mobile: Bottom tab bar */}
      <BottomTabBar onTabSelect={handleTabSelect} />

      {/* Legend - Bottom right (hidden on mobile, visible on md+) */}
      <div className="absolute bottom-8 right-4 z-10 hidden lg:block">
        <Legend />
      </div>

      {/* Event Detail Card */}
      <EventDetailCard event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Weather Camera Modal */}
      <WeatherCameraModal />

      {/* Info Badge - Bottom left on desktop (offset for sidebar) */}
      <div className={`absolute bottom-4 left-4 lg:left-[380px] z-10 hidden lg:block px-4 py-3 rounded-lg backdrop-blur text-xs border shadow-lg transition-colors ${
        theme === 'dark'
          ? 'bg-zinc-800/90 text-zinc-400 border-zinc-700'
          : 'bg-white/90 text-zinc-600 border-zinc-200'
      }`}>
        <p className={`font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'}`}>Tietolähteet</p>
        <p>YLE, IL, MTV + Tilastokeskus + Fintraffic + FMI</p>
        <p className={`mt-1 text-zinc-500`}>Päivittyy automaattisesti</p>
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
