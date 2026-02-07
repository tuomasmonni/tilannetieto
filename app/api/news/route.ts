/**
 * /api/news - Uutisvalvonta API
 * Hakee RSS-syötteet, analysoi AI:llä, ryhmittelee tapahtumat ja palauttaa GeoJSON
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/data/news/rss-parser';
import { analyzeArticles } from '@/lib/data/news/news-analyzer';
import { clusterArticles } from '@/lib/data/news/event-clusterer';
import { getCached, setCached } from '@/lib/cache/redis';
import { validateFormat, sanitizeSearch } from '@/lib/validation';
import type { NewsArticle, NewsEvent, NewsCategory, NewsSource } from '@/lib/data/news/types';

const REDIS_KEY = 'news:processed';
const REDIS_TTL = 600; // 10 min

interface CachedNewsData {
  articles: NewsArticle[];
  events: NewsEvent[];
  singleArticles: NewsArticle[];
}

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

async function getData(): Promise<CachedNewsData> {
  // 1. Try Redis cache
  const cached = await getCached<CachedNewsData>(REDIS_KEY);
  if (cached) {
    console.log('[NewsAPI] Redis cache hit');
    return cached;
  }

  // 2. Cache miss — fetch and process
  console.log('[NewsAPI] Redis cache miss, fetching fresh data...');
  const feeds = await fetchAllFeeds();

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = feeds.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  const articles = await analyzeArticles(unique);
  const { events, singleArticles } = await clusterArticles(articles);

  const result: CachedNewsData = { articles, events, singleArticles };

  // 3. Store in Redis (fire-and-forget — don't block response)
  setCached(REDIS_KEY, result, REDIS_TTL).catch((err) =>
    console.error('[NewsAPI] Redis setCached error:', err)
  );
  console.log(`[NewsAPI] Cached ${articles.length} articles, ${events.length} events`);

  return result;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = validateFormat(searchParams.get('format'));
    const timeRange = searchParams.get('timeRange') || '24h';
    const sourcesParam = searchParams.get('sources');
    const categoriesParam = searchParams.get('categories');
    const searchQuery = sanitizeSearch(searchParams.get('search'));

    const { articles: allArticles, events: allEvents, singleArticles: allSingles } = await getData();

    // Apply filters
    const cutoff = Date.now() - getTimeRangeMs(timeRange);
    const sources = sourcesParam ? sourcesParam.split(',') as NewsSource[] : null;
    const categories = categoriesParam ? categoriesParam.split(',') as NewsCategory[] : null;
    const query = searchQuery?.toLowerCase();

    function matchesFilters(a: NewsArticle): boolean {
      if (new Date(a.publishedAt).getTime() <= cutoff) return false;
      if (sources && !sources.includes(a.source)) return false;
      if (categories && !a.categories.some(c => categories.includes(c))) return false;
      if (query && !(
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.municipality?.toLowerCase().includes(query)
      )) return false;
      return true;
    }

    // Filter single articles
    const filteredSingles = allSingles.filter(matchesFilters);

    // Filter events: keep event if any article in the cluster matches
    const filteredEvents = allEvents.filter(evt =>
      evt.articles.some(matchesFilters)
    );

    // For raw JSON
    if (format === 'json') {
      const filteredArticles = allArticles.filter(matchesFilters);
      return NextResponse.json(
        {
          articles: filteredArticles,
          events: filteredEvents,
          metadata: {
            totalArticles: filteredArticles.length,
            eventCount: filteredEvents.length,
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

    // GeoJSON format (default) - combine events and single articles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features: any[] = [];

    // Add clustered events
    for (const evt of filteredEvents) {
      if (evt.lat === null || evt.lng === null) continue;
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [evt.lng, evt.lat] as [number, number],
        },
        properties: {
          id: evt.id,
          type: 'news',
          category: evt.categories[0] || 'muu',
          allCategories: evt.categories,
          title: evt.primaryArticle.title,
          description: evt.mergedSummary,
          source: evt.primaryArticle.source,
          sourceUrl: evt.primaryArticle.url,
          municipality: evt.municipality || '',
          timestamp: evt.primaryArticle.publishedAt instanceof Date
            ? evt.primaryArticle.publishedAt.toISOString()
            : evt.primaryArticle.publishedAt,
          severity: evt.severity,
          confidence: evt.confidence,
          locationName: evt.locationName,
          isCluster: true,
          sourceCount: evt.sources.length,
          allSources: evt.sources.join(','),
          mergedSummary: evt.mergedSummary,
          articleCount: evt.articles.length,
          articleUrls: JSON.stringify(evt.articles.map(a => ({
            source: a.source,
            title: a.title,
            url: a.url,
          }))),
        },
      });
    }

    // Add single articles
    for (const article of filteredSingles) {
      if (article.lat === null || article.lng === null) continue;
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [article.lng, article.lat] as [number, number],
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
          isCluster: false,
          sourceCount: 1,
          allSources: article.source,
          articleCount: 1,
        },
      });
    }

    const totalArticles = allArticles.filter(matchesFilters).length;

    const geojson = {
      type: 'FeatureCollection' as const,
      features,
      metadata: {
        totalArticles,
        geolocated: features.length,
        eventCount: filteredEvents.length,
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
