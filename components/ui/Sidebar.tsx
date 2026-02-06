'use client';

import { useState, useMemo } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { LAYER_GROUPS, LAYER_INFO, type LayerGroupKey } from '@/lib/constants';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import LayerSearch from './LayerSearch';
import CategoryGroup from './CategoryGroup';
import LayerCard from './LayerCard';
import WeatherSettings from './settings/WeatherSettings';
import TrafficSettings from './settings/TrafficSettings';
import TransitSettings from './settings/TransitSettings';
import CrimeSettings from './settings/CrimeSettings';
import NewsSettings from './settings/NewsSettings';
import TrainSettings from './settings/TrainSettings';
import ElectionSettings from './settings/ElectionSettings';
import AssociationsSettings from './settings/AssociationsSettings';

const GROUP_ORDER: LayerGroupKey[] = ['weather', 'traffic', 'statistics', 'media'];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    theme,
    activeGroup,
    setActiveGroup,
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
    getActiveLayerCount,
  } = useUnifiedFilters();

  const isDark = theme === 'dark';

  // Layer visibility and toggle maps
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
  }), [
    weather.layerVisible, roadWeather.layerVisible, weatherCamera.layerVisible,
    traffic.layerVisible, transit.layerVisible, crime.layerVisible, news.layerVisible,
    train.layerVisible, snow.layerVisible, election.layerVisible, associations.layerVisible,
    setWeatherLayerVisible, setRoadWeatherLayerVisible, setWeatherCameraLayerVisible,
    setTrafficLayerVisible, setTransitLayerVisible, setCrimeLayerVisible, setNewsLayerVisible,
    setTrainLayerVisible, setSnowLayerVisible, setElectionLayerVisible, setAssociationsLayerVisible,
  ]);

  // Settings components map
  const layerSettings: Record<string, React.ReactNode> = {
    weather: <WeatherSettings />,
    traffic: <TrafficSettings />,
    transit: <TransitSettings />,
    crime: <CrimeSettings />,
    news: <NewsSettings />,
    train: <TrainSettings />,
    election: <ElectionSettings />,
    associations: <AssociationsSettings />,
  };

  // Filter layers by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return GROUP_ORDER;
    const q = searchQuery.toLowerCase();
    return GROUP_ORDER.filter(groupKey => {
      const group = LAYER_GROUPS[groupKey];
      if (group.label.toLowerCase().includes(q)) return true;
      return group.layers.some(layerKey => {
        const info = LAYER_INFO[layerKey];
        return info.label.toLowerCase().includes(q);
      });
    });
  }, [searchQuery]);

  // Collapsed sidebar - just icons
  if (collapsed) {
    return (
      <div
        className={`w-14 h-full flex flex-col sidebar-transition ${
          isDark ? 'glass-surface' : 'glass-surface-light'
        }`}
      >
        <SidebarHeader collapsed onToggleCollapse={() => setCollapsed(false)} />

        <div className="flex-1 py-2 space-y-1 overflow-hidden">
          {GROUP_ORDER.map(groupKey => {
            const group = LAYER_GROUPS[groupKey];
            const count = getActiveLayerCount(groupKey);
            return (
              <button
                key={groupKey}
                onClick={() => {
                  setCollapsed(false);
                  setActiveGroup(groupKey);
                }}
                className={`w-full p-2 flex flex-col items-center gap-0.5 transition-colors relative ${
                  activeGroup === groupKey
                    ? isDark ? 'bg-white/10' : 'bg-black/10'
                    : isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
                style={activeGroup === groupKey ? { borderLeft: `2px solid ${group.color}` } : undefined}
                title={group.label}
              >
                <span className="text-lg">{group.icon}</span>
                {count > 0 && (
                  <span
                    className="absolute top-1 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: group.color }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <SidebarFooter collapsed />
      </div>
    );
  }

  // Full sidebar
  return (
    <div
      className={`w-[360px] h-full flex flex-col sidebar-transition ${
        isDark ? 'glass-surface' : 'glass-surface-light'
      }`}
    >
      <SidebarHeader collapsed={false} onToggleCollapse={() => setCollapsed(true)} />

      <LayerSearch value={searchQuery} onChange={setSearchQuery} />

      <div className="flex-1 overflow-y-auto">
        {filteredGroups.map(groupKey => (
          <CategoryGroup
            key={groupKey}
            groupKey={groupKey}
            isActive={activeGroup === groupKey}
            onActivate={() => setActiveGroup(activeGroup === groupKey ? null : groupKey)}
          >
            {LAYER_GROUPS[groupKey].layers
              .filter(layerKey => {
                if (!searchQuery.trim()) return true;
                return LAYER_INFO[layerKey].label.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map(layerKey => (
                <LayerCard
                  key={layerKey}
                  layerKey={layerKey}
                  isVisible={layerState[layerKey].visible}
                  onToggle={layerState[layerKey].toggle}
                >
                  {layerSettings[layerKey] || null}
                </LayerCard>
              ))}
          </CategoryGroup>
        ))}
      </div>

      <SidebarFooter collapsed={false} />
    </div>
  );
}
