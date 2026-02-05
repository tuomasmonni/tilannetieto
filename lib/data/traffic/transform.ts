/**
 * Fintraffic liikenneilmoitukset → EventFeatureCollection muunnos
 */

import type { FintrafficFeature, EventFeatureCollection, EventFeature } from '@/lib/types';

function getCoordinates(feature: FintrafficFeature): [number, number] | null {
  const geom = feature.geometry;
  if (!geom?.coordinates) return null;

  if (geom.type === 'Point') {
    const coords = geom.coordinates as number[];
    if (coords.length >= 2) return [coords[0], coords[1]];
  } else if (geom.type === 'MultiPoint') {
    const coords = geom.coordinates as number[][];
    if (coords.length > 0 && coords[0].length >= 2) return [coords[0][0], coords[0][1]];
  } else if (geom.type === 'LineString') {
    const coords = geom.coordinates as number[][];
    const mid = Math.floor(coords.length / 2);
    if (coords[mid]?.length >= 2) return [coords[mid][0], coords[mid][1]];
  } else if (geom.type === 'MultiLineString') {
    const coords = geom.coordinates as number[][][];
    if (coords[0]?.[0]?.length >= 2) return [coords[0][0][0], coords[0][0][1]];
  }

  return null;
}

function getCategory(feature: FintrafficFeature): string {
  const sitType = feature.properties.situationType;
  const annType = feature.properties.trafficAnnouncementType;

  if (sitType === 'ROAD_WORK') return 'roadwork';
  if (annType === 'PRELIMINARY_ACCIDENT_REPORT' || annType === 'ACCIDENT_REPORT') return 'accident';
  if (sitType === 'WEIGHT_RESTRICTION' || sitType === 'EXEMPTED_TRANSPORT') return 'disruption';

  // Check announcement features
  const announcements = feature.properties.announcements || [];
  for (const ann of announcements) {
    const features = ann.features || [];
    for (const f of features) {
      const name = f.name?.toLowerCase() || '';
      if (name.includes('accident') || name.includes('onnettomuus')) return 'accident';
      if (name.includes('weather') || name.includes('sää')) return 'weather';
    }
  }

  return 'disruption';
}

function getSeverity(feature: FintrafficFeature): 'low' | 'medium' | 'high' {
  const category = getCategory(feature);
  if (category === 'accident') return 'high';
  if (category === 'roadwork') return 'low';
  return 'medium';
}

export function transformTrafficToEventFeatures(response: { features: FintrafficFeature[] }): EventFeatureCollection {
  const features: EventFeature[] = [];

  for (const feature of response.features) {
    const coords = getCoordinates(feature);
    if (!coords) continue;

    const announcements = feature.properties.announcements || [];
    const fiAnn = announcements.find(a => a.language === 'fi') || announcements[0];
    if (!fiAnn) continue;

    const title = fiAnn.title || 'Liikenneilmoitus';
    const locationDesc = fiAnn.location?.description || '';
    const municipality = fiAnn.location?.roadAddressLocation?.primaryPoint?.municipality || '';
    const roadNumber = fiAnn.location?.roadAddressLocation?.primaryPoint?.roadNumber;
    const startTime = fiAnn.timeAndDuration?.startTime;
    const endTime = fiAnn.timeAndDuration?.endTime;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coords,
      },
      properties: {
        id: `ft-${feature.properties.situationId}`,
        type: 'traffic',
        category: getCategory(feature) as any,
        title,
        description: locationDesc,
        locationName: locationDesc || municipality || 'Tuntematon sijainti',
        municipality: municipality || undefined,
        road: roadNumber ? String(roadNumber) : undefined,
        timestamp: startTime || new Date().toISOString(),
        endTime: endTime || undefined,
        severity: getSeverity(feature),
        source: 'Fintraffic',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
