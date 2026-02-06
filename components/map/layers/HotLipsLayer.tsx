'use client';
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { loadMapIcons } from '@/lib/map-icons';
import hotlipsData from '@/data/static/hotlips.json';
interface HotLipsLayerProps { map: MapboxMap; }
const SOURCE_ID = 'hotlips-stores';
const LAYER_ID = 'hotlips-icons';
export default function HotLipsLayer({ map }: HotLipsLayerProps) {
  const { hotLips } = useUnifiedFilters();
  useEffect(() => {
    if (!map) return;
    (async () => {
      try { await loadMapIcons(map); } catch (e) { console.error('HotLips icons:', e); }
      if (!map.getSource(SOURCE_ID)) map.addSource(SOURCE_ID, { type: 'geojson', data: hotlipsData as GeoJSON.FeatureCollection });
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({ id: LAYER_ID, type: 'symbol', source: SOURCE_ID, layout: { 'icon-image': 'event-hotlips', 'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 8, 0.6, 12, 0.8, 16, 1.0], 'icon-allow-overlap': true, 'visibility': hotLips.layerVisible ? 'visible' : 'none' } });
        map.on('click', LAYER_ID, (e) => {
          if (!e.features?.[0]) return;
          const p = e.features[0].properties!;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          new mapboxgl.Popup({ offset: 25, maxWidth: '280px' }).setLngLat(coords).setHTML('<div style="font-family:system-ui,sans-serif;padding:4px 0"><h3 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#e53935">' + p.name + '</h3><p style="margin:0 0 4px;font-size:13px;color:#555">' + p.address + '</p><p style="margin:0 0 4px;font-size:13px;color:#555">\u260E ' + p.phone + '</p><p style="margin:0;font-size:13px;color:#555">\u23F0 ' + p.schedule + '</p></div>').addTo(map);
        });
        map.on('mouseenter', LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', LAYER_ID, () => { map.getCanvas().style.cursor = ''; });
      }
    })();
  }, [map, hotLips.layerVisible]);
  useEffect(() => {
    if (!map || !map.getLayer(LAYER_ID)) return;
    map.setLayoutProperty(LAYER_ID, 'visibility', hotLips.layerVisible ? 'visible' : 'none');
  }, [map, hotLips.layerVisible]);
  return null;
}
