/**
 * /api/news - Uutisvalvonta API
 * Hakee RSS-syötteet, analysoi AI:llä ja palauttaa GeoJSON
 */

import { NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/data/news/rss-parser';
import { analyzeArticles } from '@/lib/data/news/news-analyzer';
import type { NewsArticle, NewsCategory, NewsSource } from '@/lib/data/news/types';

// In-memory cache
let cache: {
  data: NewsArticle[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 min

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

async function getArticles(): Promise<NewsArticle[]> {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_TTL) {
    console.log('[NewsAPI] Using cache');
    return cache.data;
  }

  console.log('[NewsAPI] Fetching fresh data...');
  const feeds = await fetchAllFeeds();

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = feeds.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  const articles = await analyzeArticles(unique);

  cache = { data: articles, timestamp: now };
  console.log(`[NewsAPI] Cached ${articles.length} articles`);

  return articles;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'geojson';
    const timeRange = searchParams.get('timeRange') || '24h';
    const sourcesParam = searchParams.get('sources');
    const categoriesParam = searchParams.get('categories');
    const searchQuery = searchParams.get('search');

    let articles = await getArticles();

    // Filter by time range
    const cutoff = Date.now() - getTimeRangeMs(timeRange);
    articles = articles.filter(
      (a) => new Date(a.publishedAt).getTime() > cutoff
    );

    // Filter by sources
    if (sourcesParam) {
      const sources = sourcesParam.split(',') as NewsSource[];
      articles = articles.filter((a) => sources.includes(a.source));
    }

    // Filter by categories
    if (categoriesParam) {
      const categories = categoriesParam.split(',') as NewsCategory[];
      articles = articles.filter((a) =>
        a.categories.some((c) => categories.includes(c))
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.municipality?.toLowerCase().includes(query)
      );
    }

    // Raw JSON format
    if (format === 'json') {
      return NextResponse.json(
        {
          articles,
          metadata: {
            totalArticles: articles.length,
            fetchedAt: new Date().toISOString(),
          },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    // GeoJSON format (default)
    const geoArticles = articles.filter((a) => a.lat !== null && a.lng !== null);

    const geojson = {
      type: 'FeatureCollection' as const,
      features: geoArticles.map((article) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [article.lng!, article.lat!] as [number, number],
        },
        properties: {
          id: article.id,
          type: 'news',
          category: article.categories[0] || 'muu',
          allCategories: article.categories,
          title: article.title,
          description: article.summary,
          source: article.source,
          sourceUrl: article.url,
          municipality: article.municipality || '',
          timestamp: article.publishedAt instanceof Date
            ? article.publishedAt.toISOString()
            : article.publishedAt,
          severity: article.severity,
          confidence: article.confidence,
          locationName: article.locationName,
        },
      })),
      metadata: {
        totalArticles: articles.length,
        geolocated: geoArticles.length,
        fetchedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[NewsAPI] Error:', error);
    return NextResponse.json(
      {
        type: 'FeatureCollection',
        features: [],
        metadata: { error: 'Failed to fetch news', fetchedAt: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
