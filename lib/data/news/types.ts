/**
 * Uutisvalvonta - Tyypit
 */

export type NewsSource = 'yle' | 'iltalehti' | 'mtv';

export type NewsCategory =
  | 'liikenne'
  | 'rikos'
  | 'politiikka'
  | 'terveys'
  | 'ymparisto'
  | 'talous'
  | 'urheilu'
  | 'onnettomuus'
  | 'muu';

export interface RawRSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  'content:encoded'?: string;
  guid?: string;
  category?: string | string[];
}

export interface ParsedFeedItem {
  title: string;
  url: string;
  summary: string;
  publishedAt: Date;
  source: NewsSource;
  rawCategories?: string[];
}

export interface NewsAnalysis {
  municipality: string | null;
  categories: NewsCategory[];
  severity: 'low' | 'medium' | 'high';
  summary: string;
  confidence: number;
}

export interface NewsArticle {
  id: string;
  source: NewsSource;
  title: string;
  url: string;
  summary: string;
  publishedAt: Date;
  categories: NewsCategory[];
  municipality: string | null;
  lat: number | null;
  lng: number | null;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  locationName: string;
}

export interface NewsFilterState {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  sources: NewsSource[];
  categories: NewsCategory[];
  searchQuery: string;
}
