'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { LAYER_GROUPS, LAYER_INFO, type LayerGroupKey } from '@/lib/constants';
import LayerCard from './LayerCard';
import WeatherSettings from './settings/WeatherSettings';
import TrafficSettings from './settings/TrafficSettings';
import TransitSettings from './settings/TransitSettings';
import CrimeSettings from './settings/CrimeSettings';
import NewsSettings from './settings/NewsSettings';
import TrainSettings from './settings/TrainSettings';
import ElectionSettings from './settings/ElectionSettings';
import AssociationsSettings from './settings/AssociationsSettings';
import EnergyWidget from './EnergyWidget';
import UnemploymentSettings from './settings/UnemploymentSettings';
import HousingSettings from './settings/HousingSettings';
import PopulationSettings from './settings/PopulationSettings';
import HealthSettings from './settings/HealthSettings';

interface CategorySheetProps {
  group: LayerGroupKey | null;
  onClose: () => void;
}

export default function CategorySheet({ group, onClose }: CategorySheetProps) {
  const {
    theme,
    weather,
    roadWeather,
    weatherCamera,
    traffic,
    transit,
    crime,
    news,
    train,
    snow,
    election,
    associations,
    energy,
    unemployment,
    housing,
    population,
    health,
    setWeatherLayerVisible,
    setRoadWeatherLayerVisible,
    setWeatherCameraLayerVisible,
    setTrafficLayerVisible,
    setTransitLayerVisible,
    setCrimeLayerVisible,
    setNewsLayerVisible,
    setTrainLayerVisible,
    setSnowLayerVisible,
    setElectionLayerVisible,
    setAssociationsLayerVisible,
    setEnergyLayerVisible,
    setUnemploymentLayerVisible,
    setHousingLayerVisible,
    setPopulationLayerVisible,
    setHealthLayerVisible,
  } = useUnifiedFilters();

  const isDark = theme === 'dark';
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, startTranslate: 0, isDragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const layerState = useMemo(() => ({
    weather: { visible: weather.layerVisible, toggle: setWeatherLayerVisible },
    roadWeather: { visible: roadWeather.layerVisible, toggle: setRoadWeatherLayerVisible },
    weatherCamera: { visible: weatherCamera.layerVisible, toggle: setWeatherCameraLayerVisible },
    traffic: { visible: traffic.layerVisible, toggle: setTrafficLayerVisible },
    transit: { visible: transit.layerVisible, toggle: setTransitLayerVisible },
    crime: { visible: crime.layerVisible, toggle: setCrimeLayerVisible },
    news: { visible: news.layerVisible, toggle: setNewsLayerVisible },
    train: { visible: train.layerVisible, toggle: setTrainLayerVisible },
    snow: { visible: snow.layerVisible, toggle: setSnowLayerVisible },
    election: { visible: election.layerVisible, toggle: setElectionLayerVisible },
    associations: { visible: associations.layerVisible, toggle: setAssociationsLayerVisible },
    energy: { visible: energy.layerVisible, toggle: setEnergyLayerVisible },
    unemployment: { visible: unemployment.layerVisible, toggle: setUnemploymentLayerVisible },
    housing: { visible: housing.layerVisible, toggle: setHousingLayerVisible },
    population: { visible: population.layerVisible, toggle: setPopulationLayerVisible },
    health: { visible: health.layerVisible, toggle: setHealthLayerVisible },
  }), [
    weather.layerVisible, roadWeather.layerVisible, weatherCamera.layerVisible,
    traffic.layerVisible, transit.layerVisible, crime.layerVisible, news.layerVisible,
    train.layerVisible, snow.layerVisible, election.layerVisible, associations.layerVisible,
    energy.layerVisible, unemployment.layerVisible, housing.layerVisible, population.layerVisible, health.layerVisible,
    setWeatherLayerVisible, setRoadWeatherLayerVisible, setWeatherCameraLayerVisible,
    setTrafficLayerVisible, setTransitLayerVisible, setCrimeLayerVisible, setNewsLayerVisible,
    setTrainLayerVisible, setSnowLayerVisible, setElectionLayerVisible, setAssociationsLayerVisible,
    setEnergyLayerVisible, setUnemploymentLayerVisible, setHousingLayerVisible, setPopulationLayerVisible, setHealthLayerVisible,
  ]);

  const layerSettings: Record<string, React.ReactNode> = {
    weather: <WeatherSettings />,
    traffic: <TrafficSettings />,
    transit: <TransitSettings />,
    crime: <CrimeSettings />,
    news: <NewsSettings />,
    train: <TrainSettings />,
    election: <ElectionSettings />,
    associations: <AssociationsSettings />,
    energy: <EnergyWidget />,
    unemployment: <UnemploymentSettings />,
    housing: <HousingSettings />,
    population: <PopulationSettings />,
    health: <HealthSettings />,
  };

  const closeSheet = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setTranslateY(0);
    }, 300);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && group) closeSheet();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [group, closeSheet]);

  // Drag handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startTranslate: translateY,
      isDragging: true,
    };
  }, [translateY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging) return;
    const diff = e.touches[0].clientY - dragRef.current.startY;
    const newTranslate = Math.max(0, dragRef.current.startTranslate + diff);
    setTranslateY(newTranslate);
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    if (translateY > 100) {
      closeSheet();
    } else {
      setTranslateY(0);
    }
  }, [translateY, closeSheet]);

  if (!group) return null;

  const groupConfig = LAYER_GROUPS[group];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        } bg-black/40`}
        onClick={closeSheet}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-14 left-0 right-0 z-50 lg:hidden rounded-t-2xl shadow-2xl max-h-[75vh] overflow-hidden ${
          isDark ? 'bg-zinc-900' : 'bg-white'
        } ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{
          transform: `translateY(${translateY}px)`,
          transition: dragRef.current.isDragging ? 'none' : undefined,
        }}
      >
        {/* Drag handle - ONLY this area handles drag gestures */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
        </div>

        {/* Group title */}
        <div className={`px-4 pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{groupConfig.icon}</span>
            <h2 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {groupConfig.label}
            </h2>
          </div>
        </div>

        {/* Layer cards */}
        <div className="overflow-y-auto max-h-[60vh] p-3 space-y-2">
          {groupConfig.layers.map(layerKey => (
            <LayerCard
              key={layerKey}
              layerKey={layerKey}
              isVisible={layerState[layerKey].visible}
              onToggle={layerState[layerKey].toggle}
            >
              {layerSettings[layerKey] || null}
            </LayerCard>
          ))}
        </div>
      </div>
    </>
  );
}
