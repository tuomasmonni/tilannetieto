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
  if (geometry.type === 'Point') {
    return geometry.coordinates as [number, number];
  }

  if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
    // Ota ensimmäinen piste
    const coords = geometry.coordinates as number[][];
    return coords[0] as [number, number];
  }

  return [25.0, 65.0]; // Fallback keskelle Suomea
}

/**
 * Muunna Fintraffic feature normalisoiduksi tapahtumaksi
 */
export function transformTrafficFeature(feature: FintrafficFeature): NormalizedEvent {
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

  // Tarkista onko tapahtuma päättynyt
  if (announcement?.timeAndDuration?.endTime) {
    const endTime = new Date(announcement.timeAndDuration.endTime);

    // Jos päättyi yli tunti sitten → filtteröi pois
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (endTime < oneHourAgo) {
      return false;
    }
  }

  // Tarkista onko tapahtuma liian vanha (alkanut yli 7 päivää sitten)
  if (announcement?.timeAndDuration?.startTime) {
    const startTime = new Date(announcement.timeAndDuration.startTime);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (startTime < sevenDaysAgo) {
      return false;
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
    // Suodata pois Suomen ulkopuoliset
    const [lng, lat] = event.location.coordinates;
    return lng >= 19 && lng <= 32 && lat >= 59 && lat <= 71;
  });
  console.log(`[TRANSFORM] Suomen rajoissa: ${inBounds.length} tapahtumaa`);

  // Kategoriajakauma
  const categoryBreakdown = inBounds.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`[TRANSFORM] Kategoriajakauma:`, categoryBreakdown);

  return inBounds;
}
