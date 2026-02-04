/**
 * Fintraffic data transformations
 *
 * Muuntaa Fintraffic API vastaukset NormalizedEvent-muotoon
 */

import type { NormalizedEvent, FintrafficFeature, TrainLocation } from '@/lib/types';
import type { EventCategory } from '@/lib/constants';

/**
 * Päättele tapahtumakategoria Fintraffic-datan perusteella
 */
function categorizeTrafficEvent(feature: FintrafficFeature): EventCategory {
  const situationType = feature.properties.situationType;
  const announcementType = feature.properties.trafficAnnouncementType;

  // Tietyöt
  if (situationType === 'ROAD_WORK') {
    return 'roadwork';
  }

  // Painorajoitukset ja erikoiskuljetukset -> häiriö
  if (situationType === 'WEIGHT_RESTRICTION' || situationType === 'EXEMPTED_TRANSPORT') {
    return 'disruption';
  }

  // Liikenneilmoitukset - tarkempi kategorisointi
  if (situationType === 'TRAFFIC_ANNOUNCEMENT') {
    // Tarkista features-listasta onnettomuusviitteet
    const announcement = feature.properties.announcements?.[0];
    const featureNames = announcement?.features?.map(f => f.name.toLowerCase()) || [];

    // Onnettomuus-avainsanat
    const accidentKeywords = [
      'onnettomuus', 'kolari', 'törmäys', 'suistuminen',
      'accident', 'liikenneonnettomuus', 'nokkakolari'
    ];

    if (featureNames.some(name => accidentKeywords.some(kw => name.includes(kw)))) {
      return 'accident';
    }

    // Sää-avainsanat
    const weatherKeywords = ['sää', 'liukkaus', 'lumisade', 'sumu', 'tuuli', 'myrsky'];
    if (featureNames.some(name => weatherKeywords.some(kw => name.includes(kw)))) {
      return 'weather';
    }
  }

  // Oletus: häiriö
  return 'disruption';
}

/**
 * Päättele vakavuus
 */
function determineSeverity(feature: FintrafficFeature): 'low' | 'medium' | 'high' {
  const announcement = feature.properties.announcements?.[0];
  const title = announcement?.title?.toLowerCase() || '';

  // Korkea: onnettomuudet, suljettu tie
  if (title.includes('onnettomuus') || title.includes('suljettu') || title.includes('vakava')) {
    return 'high';
  }

  // Keskitaso: rajoitukset, hidastukset
  if (title.includes('rajoitus') || title.includes('hidast') || title.includes('varoitus')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Hae koordinaatit geometriasta
 */
function getCoordinates(geometry: FintrafficFeature['geometry']): [number, number] {
  // 1. Point-geometria
  if (geometry.type === 'Point') {
    const coords = geometry.coordinates as [number, number];
    if (Array.isArray(coords) && coords.length === 2 &&
        typeof coords[0] === 'number' && typeof coords[1] === 'number' &&
        coords[0] >= 19 && coords[0] <= 32 &&
        coords[1] >= 59 && coords[1] <= 71) {
      return coords;
    }
  }

  // 2. LineString tai MultiPoint
  if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
    const coords = geometry.coordinates as number[][];

    if (Array.isArray(coords) && coords.length > 0) {
      const firstPoint = coords[0];

      if (Array.isArray(firstPoint) && firstPoint.length >= 2 &&
          typeof firstPoint[0] === 'number' && typeof firstPoint[1] === 'number') {

        const lng = firstPoint[0];
        const lat = firstPoint[1];

        // Validoi Suomen rajat
        if (lng >= 19 && lng <= 32 && lat >= 59 && lat <= 71) {
          return [lng, lat];
        }
      }
    }
  }

  // 3. MultiLineString - ota ensimmäisen linjan ensimmäinen piste
  if (geometry.type === 'MultiLineString') {
    const lines = geometry.coordinates as number[][][];

    if (Array.isArray(lines) && lines.length > 0) {
      const firstLine = lines[0];

      if (Array.isArray(firstLine) && firstLine.length > 0) {
        const firstPoint = firstLine[0];

        if (Array.isArray(firstPoint) && firstPoint.length >= 2 &&
            typeof firstPoint[0] === 'number' && typeof firstPoint[1] === 'number') {

          const lng = firstPoint[0];
          const lat = firstPoint[1];

          // Validoi Suomen rajat
          if (lng >= 19 && lng <= 32 && lat >= 59 && lat <= 71) {
            return [lng, lat];
          }
        }
      }
    }
  }

  // 4. Fallback (vain jos kaikki muu epäonnistuu)
  console.warn(`[TRANSFORM] Invalid geometry, using fallback:`, geometry.type);
  return [25.0, 65.0];
}

/**
 * Muunna Fintraffic feature normalisoiduksi tapahtumaksi
 */
export function transformTrafficFeature(feature: FintrafficFeature): NormalizedEvent {
  // DEBUG: Logaa ei-Point geometriat
  if (feature.geometry.type !== 'Point') {
    console.log(`[TRANSFORM] Non-Point geometry: ${feature.geometry.type}`, {
      situationId: feature.properties.situationId,
      coordinates: feature.geometry.coordinates,
    });
  }

  const announcement = feature.properties.announcements?.find(a => a.language === 'FI')
    || feature.properties.announcements?.[0];

  const coordinates = getCoordinates(feature.geometry);
  const locationDesc = announcement?.location?.description || '';
  const roadInfo = announcement?.location?.roadAddressLocation?.primaryPoint;

  return {
    id: `traffic-${feature.properties.situationId}`,
    type: feature.properties.situationType === 'ROAD_WORK' ? 'roadwork' : 'traffic',
    category: categorizeTrafficEvent(feature),
    title: announcement?.title || 'Liikenneilmoitus',
    description: announcement?.features?.map(f => f.name).join(', ') || locationDesc,
    location: {
      coordinates,
      name: locationDesc || `Tie ${roadInfo?.roadNumber || ''}`,
      municipality: roadInfo?.municipality,
      road: roadInfo?.roadNumber?.toString(),
    },
    timestamp: new Date(announcement?.timeAndDuration?.startTime || Date.now()),
    endTime: announcement?.timeAndDuration?.endTime
      ? new Date(announcement.timeAndDuration.endTime)
      : undefined,
    severity: determineSeverity(feature),
    source: announcement?.sender || 'Fintraffic',
    metadata: {
      situationType: feature.properties.situationType,
      announcementType: feature.properties.trafficAnnouncementType,
    },
  };
}

/**
 * Muunna junan sijainti normalisoiduksi tapahtumaksi
 */
export function transformTrainLocation(train: TrainLocation): NormalizedEvent {
  return {
    id: `train-${train.trainNumber}-${train.departureDate}`,
    type: 'train',
    category: 'train',
    title: `Juna ${train.trainNumber}`,
    description: `Nopeus: ${train.speed} km/h`,
    location: {
      coordinates: train.location.coordinates,
      name: `Juna ${train.trainNumber}`,
    },
    timestamp: new Date(train.timestamp),
    severity: 'low',
    source: 'Fintraffic Rata',
    metadata: {
      speed: train.speed,
      accuracy: train.accuracy,
      departureDate: train.departureDate,
    },
  };
}

/**
 * Tarkista onko tapahtuma tuore
 */
function isEventFresh(feature: FintrafficFeature): boolean {
  const announcement = feature.properties.announcements?.[0];
  const now = new Date();
  const situationType = feature.properties.situationType;

  // 1. Tarkista onko tapahtuma päättynyt
  if (announcement?.timeAndDuration?.endTime) {
    const endTime = new Date(announcement.timeAndDuration.endTime);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (endTime < oneHourAgo) {
      return false;
    }
  }

  // 2. Eri logiikka eri tyypeille
  if (announcement?.timeAndDuration?.startTime) {
    const startTime = new Date(announcement.timeAndDuration.startTime);

    // TIETYÖT: 14 päivän ikkuna (pitkäkestoiset)
    if (situationType === 'ROAD_WORK') {
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      if (startTime < fourteenDaysAgo) {
        return false;
      }
    }
    // MUUT: 7 päivän ikkuna
    else {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (startTime < sevenDaysAgo) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Muunna kaikki Fintraffic-tapahtumat
 */
export function transformAllTrafficEvents(
  features: FintrafficFeature[]
): NormalizedEvent[] {
  console.log(`[TRANSFORM] Vastaanotettu: ${features.length} tapahtumaa`);

  const fresh = features.filter(isEventFresh);
  console.log(`[TRANSFORM] Tuoreet: ${fresh.length} tapahtumaa`);

  const transformed = fresh.map(transformTrafficFeature);

  const inBounds = transformed.filter(event => {
    const [lng, lat] = event.location.coordinates;

    // Hylkää fallback-koordinaatit (25, 65)
    if (lng === 25.0 && lat === 65.0) {
      console.warn(`[TRANSFORM] Rejected fallback for: ${event.id}`);
      return false;
    }

    // Suodata pois Suomen ulkopuoliset
    return lng >= 19 && lng <= 32 && lat >= 59 && lat <= 71;
  });

  console.log(`[TRANSFORM] Suomen rajoissa (ilman fallbackia): ${inBounds.length} tapahtumaa`);
  console.log(`[TRANSFORM] Hylätty (fallback): ${transformed.length - inBounds.length} tapahtumaa`);

  // Kategoriajakauma
  const categoryBreakdown = inBounds.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`[TRANSFORM] Kategoriajakauma:`, categoryBreakdown);

  return inBounds;
}
