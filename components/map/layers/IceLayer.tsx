'use client';

import mapboxgl from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventDetails } from '@/lib/types';

interface IceLayerProps {
  map: mapboxgl.Map;
  onEventSelect?: (event: EventDetails | null) => void;
}

export default function IceLayer({ map, onEventSelect }: IceLayerProps) {
  const { ice } = useUnifiedFilters();

  // Placeholder - ice layer implementation pending
  if (!ice.layerVisible || !map) return null;
  return null;
}
