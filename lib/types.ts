/**
 * Tilannekuva.online - Yhteiset tyyppimäärittelyt
 * Sisältää sekä liikenteen (traffic) että rikostilastojen (crime) tyypit
 */

import type { EventCategory } from './constants';

// ============================================
// LIIKENNE - TRAFFIC EVENT TYYPIT
// ============================================

export interface NormalizedEvent {
  id: string;
  type: 'traffic' | 'roadwork' | 'train' | 'camera' | 'news' | 'weather' | 'transit' | 'road_weather';
  category: EventCategory;
  title: string;
  description: string;
  location: {
    coordinates: [number, number];
    name: string;
    municipality?: string;
    road?: string;
  };
  timestamp: Date;
  endTime?: Date;
  severity: 'low' | 'medium' | 'high';
  source: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface EventFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Omit<NormalizedEvent, 'location' | 'timestamp' | 'endTime' | 'metadata'> & {
    locationName: string;
    municipality?: string;
    road?: string;
    timestamp: string;
    endTime?: string;
    metadata?: string;
  };
}

export interface EventFeatureCollection {
  type: 'FeatureCollection';
  features: EventFeature[];
}

export interface FintrafficMessageResponse {
  type: 'FeatureCollection';
  dataUpdatedTime: string;
  features: FintrafficFeature[];
}

export interface FintrafficFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'MultiPoint' | 'MultiLineString';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    situationId: string;
    situationType: string;
    trafficAnnouncementType?: string;
    announcements: FintrafficAnnouncement[];
  };
}

export interface FintrafficAnnouncement {
  language: string;
  title: string;
  location?: {
    description: string;
    roadAddressLocation?: {
      primaryPoint?: {
        municipality: string;
        roadNumber: number;
      };
    };
  };
  features?: Array<{ name: string }>;
  timeAndDuration?: {
    startTime: string;
    endTime?: string;
  };
  sender?: string;
}

export interface TrainLocation {
  trainNumber: number;
  departureDate: string;
  timestamp: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  speed: number;
  accuracy?: number;
}

// ============================================
// RIKOSTILASTOT - CRIME STATISTICS TYYPIT
// ============================================

export interface CrimeStatistics {
  municipalityCode: string;
  municipalityName: string;
  year: number;
  totalCrimes: number;
  crimesPerCapita?: number;
}

export interface PxWebQuery {
  query: Array<{
    code: string;
    selection: {
      filter: string;
      values: string[];
    };
  }>;
  response: {
    format: 'json' | 'json-stat2' | 'csv' | 'xlsx';
  };
}

export interface CrimeFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    kuntakoodi: string;
    nimi: string;
    totalCrimes: number;
    category: string;
    year: string;
  };
}

export interface CrimeMapGeoJSON {
  type: 'FeatureCollection';
  metadata: {
    year: string;
    categories: string[];
    source: string;
  };
  features: CrimeFeature[];
}

// ============================================
// FILTER STATE & UI TYYPIT
// ============================================

export interface TrafficFilterState {
  timeRange: '2h' | '8h' | '24h' | '7d' | 'all';
  categories: EventCategory[];
  layerVisible: boolean;
}

export interface CrimeFilterState {
  year: string;
  categories: string[];
  layerVisible: boolean;
  isLoading: boolean;
}

export interface FilterState {
  categories: EventCategory[];
  searchQuery: string;
  severity: ('low' | 'medium' | 'high')[];
  timeRange: 'all' | '1h' | '6h' | '24h';
}

export interface AppState {
  events: NormalizedEvent[];
  filters: FilterState;
  selectedEventId: string | null;
  isLoading: boolean;
  lastUpdate: Date | null;
  connectionStatus: 'connected' | 'reconnecting' | 'offline';
}

// ============================================
// EVENT DETAILS (UI COMPONENT)
// ============================================

export interface EventDetails {
  id: string;
  type: string;
  category: EventCategory;
  title: string;
  description: string;
  locationName: string;
  municipality?: string;
  road?: string;
  timestamp: string;
  endTime?: string;
  severity: 'low' | 'medium' | 'high';
  source: string;
  metadata?: Record<string, unknown>;
  screenPosition?: { x: number; y: number };
}
