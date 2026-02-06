/**
 * Tilannetieto.fi - Yhdistetyt vakiot
 * Sisältää liikenteen, rikostilastojen ja uutisten konfiguraation
 */

// ============================================
// KARTTA & YLEINEN KONFIGURAATIO
// ============================================

export const FINLAND_BOUNDS: [[number, number], [number, number]] = [
  [19.0, 59.5],  // SW: Ahvenanmaa
  [31.6, 70.1],  // NE: Utsjoki
];

export const MAP_CENTER: [number, number] = [25.5, 64.5];
export const DEFAULT_ZOOM = 5;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 18;

// Mapbox styles
export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/streets-v12',
} as const;

export type MapTheme = keyof typeof MAP_STYLES;

// ============================================
// LIIKENNE - EVENT KATEGORIAT
// ============================================

export const EVENT_CATEGORIES = {
  accident: {
    color: '#ef4444',
    icon: 'car',
    label: 'Onnettomuus',
    emoji: '\u{1F697}',
  },
  disruption: {
    color: '#f97316',
    icon: 'alert-triangle',
    label: 'H\u00e4iri\u00f6',
    emoji: '\u26A0\uFE0F',
  },
  roadwork: {
    color: '#eab308',
    icon: 'construction',
    label: 'Tiety\u00f6',
    emoji: '\u{1F6A7}',
  },
  train: {
    color: '#22c55e',
    icon: 'train',
    label: 'Juna',
    emoji: '\u{1F682}',
  },
  camera: {
    color: '#3b82f6',
    icon: 'camera',
    label: 'Kelikamera',
    emoji: '\u{1F4F7}',
  },
  police: {
    color: '#6366f1',
    icon: 'shield',
    label: 'Poliisi',
    emoji: '\u{1F694}',
  },
  fire: {
    color: '#dc2626',
    icon: 'flame',
    label: 'Tulipalo',
    emoji: '\u{1F525}',
  },
  weather: {
    color: '#06b6d4',
    icon: 'cloud',
    label: 'S\u00e4\u00e4',
    emoji: '\u26C8\uFE0F',
  },
  transit: {
    color: '#10b981',
    icon: 'bus',
    label: 'Joukkoliikenne',
    emoji: '\u{1F68C}',
  },
  road_weather: {
    color: '#8b5cf6',
    icon: 'thermometer',
    label: 'Ties\u00e4\u00e4',
    emoji: '\u{1F321}\uFE0F',
  },
  snow: {
    color: '#a5f3fc',
    icon: 'snowflake',
    label: 'Lumitilanne',
    emoji: '\u2744\uFE0F',
  },
  ice: {
    color: '#38bdf8',
    icon: 'ice',
    label: 'Jäänpaksuus',
    emoji: '\u{1F9CA}',
  },
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

// ============================================
// RIKOSTILASTOT - KATEGORIAT
// ============================================

export const CRIME_CATEGORIES = [
  { code: 'SSS', label: 'Kaikki rikokset', color: '#6b7280' },
  { code: '010000', label: 'Henkirikokset', color: '#dc2626' },
  { code: '020000', label: 'V\u00e4kivaltarikokset', color: '#ea580c' },
  { code: '030000', label: 'Seksuaalirikokset', color: '#d946ef' },
  { code: '050000', label: 'Omaisuusrikokset', color: '#2563eb' },
  { code: '060000', label: 'Huumausainerikokset', color: '#65a30d' },
  { code: '070000', label: 'Petokset/korruptio', color: '#ca8a04' },
  { code: '090000', label: 'Turvallisuusrikokset', color: '#78716c' },
] as const;

export type CrimeCategory = typeof CRIME_CATEGORIES[number];

export const AVAILABLE_YEARS = ['2024', '2023', '2022', '2021', '2020'] as const;

// ============================================
// POLLING & API
// ============================================

export const POLLING_INTERVALS = {
  traffic: 60_000,    // 1 min
  trains: 10_000,     // 10 sec
  cameras: 300_000,   // 5 min
  feeds: 300_000,     // 5 min
  weather: 300_000,   // 5 min (FMI)
  transit: 15_000,    // 15 sec (HSL GTFS-RT)
  roadWeather: 300_000, // 5 min (Digitraffic)
  news: 900_000,      // 15 min (RSS feeds)
  snow: 300_000,      // 5 min (FMI lumensyvyys)
  ice: 1_800_000,     // 30 min (SYKE jäänpaksuus)
} as const;

export const API_ENDPOINTS = {
  trafficMessages: 'https://tie.digitraffic.fi/api/traffic-message/v1/messages',
  weatherCameras: 'https://tie.digitraffic.fi/api/weathercam/v1/stations',
  roadWeather: 'https://tie.digitraffic.fi/api/weather/v1/forecasts',
  trainLocations: 'https://rata.digitraffic.fi/api/v1/train-locations/latest',
  trains: 'https://rata.digitraffic.fi/api/v1/trains',
  yleNews: 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET&concepts=18-34837',
} as const;

export const SITUATION_TYPES = {
  TRAFFIC_ANNOUNCEMENT: 'Liikenneilmoitus',
  ROAD_WORK: 'Tiety\u00f6',
  WEIGHT_RESTRICTION: 'Painorajoitus',
  EXEMPTED_TRANSPORT: 'Erikoiskuljetus',
} as const;

// ============================================
// UUTISET - NEWS KATEGORIAT
// ============================================

export const NEWS_CATEGORIES = {
  liikenne:     { label: 'Liikenne',      color: '#3b82f6', emoji: '\u{1F697}' },
  rikos:        { label: 'Rikos',          color: '#ef4444', emoji: '\u{1F534}' },
  politiikka:   { label: 'Politiikka',    color: '#8b5cf6', emoji: '\u{1F3DB}\uFE0F' },
  terveys:      { label: 'Terveys',       color: '#10b981', emoji: '\u{1F3E5}' },
  ymparisto:    { label: 'Ymp\u00e4rist\u00f6',     color: '#22c55e', emoji: '\u{1F33F}' },
  talous:       { label: 'Talous',        color: '#f59e0b', emoji: '\u{1F4B0}' },
  urheilu:      { label: 'Urheilu',       color: '#06b6d4', emoji: '\u26BD' },
  onnettomuus:  { label: 'Onnettomuus',   color: '#dc2626', emoji: '\u{1F6A8}' },
  muu:          { label: 'Muu',           color: '#6b7280', emoji: '\u{1F4F0}' },
} as const;

export type NewsCategoryKey = keyof typeof NEWS_CATEGORIES;

export const NEWS_SOURCES = {
  yle:                  { label: 'YLE',                   shortLabel: 'YLE',  color: '#0047b3' },
  iltalehti:            { label: 'Iltalehti',             shortLabel: 'IL',   color: '#e30613' },
  mtv:                  { label: 'MTV',                   shortLabel: 'MTV',  color: '#ff6900' },
  hs:                   { label: 'Helsingin Sanomat',     shortLabel: 'HS',   color: '#f0563e' },
  is:                   { label: 'Ilta-Sanomat',          shortLabel: 'IS',   color: '#ed1c24' },
  kauppalehti:          { label: 'Kauppalehti',           shortLabel: 'KL',   color: '#006db6' },
  maaseuduntulevaisuus: { label: 'Maaseudun Tulevaisuus', shortLabel: 'MT',   color: '#2d8b2d' },
  suomenkuvalehti:      { label: 'Suomen Kuvalehti',      shortLabel: 'SK',   color: '#1a1a1a' },
} as const;

export type NewsSourceKey = keyof typeof NEWS_SOURCES;

// ============================================
// LAYER GROUPS (Category Navigator)
// ============================================

export type LayerKey = 'weather' | 'roadWeather' | 'weatherCamera' | 'snow' | 'ice' | 'traffic' | 'transit' | 'train' | 'crime' | 'news' | 'election' | 'associations' | 'energy' | 'unemployment' | 'housing' | 'population' | 'health';
export type LayerGroupKey = 'weather' | 'traffic' | 'statistics' | 'media' | 'energy' | 'health';

export interface LayerGroupConfig {
  label: string;
  icon: string;
  color: string;
  tailwindColor: string;
  layers: LayerKey[];
}

export const LAYER_GROUPS: Record<LayerGroupKey, LayerGroupConfig> = {
  weather: {
    label: 'Sää',
    icon: '☀️',
    color: '#06b6d4',
    tailwindColor: 'group-weather',
    layers: ['weather', 'roadWeather', 'weatherCamera', 'snow', 'ice'],
  },
  traffic: {
    label: 'Liikenne',
    icon: '🚗',
    color: '#f97316',
    tailwindColor: 'group-traffic',
    layers: ['traffic', 'transit', 'train'],
  },
  energy: {
    label: 'Energia',
    icon: '⚡',
    color: '#22c55e',
    tailwindColor: 'group-energy',
    layers: ['energy'],
  },
  statistics: {
    label: 'Tilastot',
    icon: '📊',
    color: '#3b82f6',
    tailwindColor: 'group-statistics',
    layers: ['crime', 'unemployment', 'housing', 'population', 'election', 'associations'],
  },
  health: {
    label: 'Terveys',
    icon: '🏥',
    color: '#10b981',
    tailwindColor: 'group-health',
    layers: ['health'],
  },
  media: {
    label: 'Media',
    icon: '📰',
    color: '#f59e0b',
    tailwindColor: 'group-media',
    layers: ['news'],
  },
} as const;

export const LAYER_INFO: Record<LayerKey, { label: string; icon: string; description: string }> = {
  weather: { label: 'Sää', icon: '🌡️', description: '~200 FMI-asemaa' },
  roadWeather: { label: 'Tiesää', icon: '🛣️', description: '~520 asemaa' },
  weatherCamera: { label: 'Kelikamerat', icon: '📷', description: '~780 kameraa' },
  traffic: { label: 'Tapahtumat', icon: '⚠️', description: 'Fintraffic-ilmoitukset' },
  transit: { label: 'Joukkoliikenne', icon: '🚌', description: 'HSL-alueen liikenne' },
  crime: { label: 'Rikostilastot', icon: '📈', description: 'Tilastokeskus ICCS' },
  news: { label: 'Uutiset', icon: '📰', description: '8 mediaa, AI-ryhmittely' },
  train: { label: 'Junat', icon: '🚆', description: 'Reaaliaikaiset junasijainnit' },
  snow: { label: 'Lumitilanne', icon: '❄️', description: 'FMI lumensyvyys' },
  ice: { label: 'Jäänpaksuus', icon: '🧊', description: 'SYKE järvet + FMI merijää' },
  election: { label: 'Eduskuntavaalit', icon: '🏛️', description: 'Vaalitulokset kunnittain' },
  associations: { label: 'Yhdistykset', icon: '🤝', description: 'Rekisteröidyt yhdistykset' },
  energy: { label: 'Sähköjärjestelmä', icon: '⚡', description: 'Fingrid reaaliaikainen' },
  unemployment: { label: 'Työttömyys', icon: '📉', description: 'Tilastokeskus kunnittain' },
  housing: { label: 'Asuntohinnat', icon: '🏠', description: 'Tilastokeskus €/m²' },
  population: { label: 'Väestö', icon: '👥', description: 'Tilastokeskus 31.12.' },
  health: { label: 'Terveys', icon: '🏥', description: 'THL/Sotkanet indikaattorit' },
} as const;
