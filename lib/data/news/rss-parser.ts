/**
 * RSS Feed Parser - 8 suomalaista mediaa
 */

import { parseStringPromise } from 'xml2js';
import type { NewsSource, ParsedFeedItem, RawRSSItem } from './types';

const RSS_FEEDS: Record<NewsSource, string> = {
  yle: 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET',
  iltalehti: 'https://www.iltalehti.fi/rss.xml',
  mtv: 'https://www.mtvuutiset.fi/api/feed/rss/uutiset',
  hs: 'https://www.hs.fi/rss/tuoreimmat.xml',
  is: 'https://www.is.fi/rss/tuoreimmat.xml',
  kauppalehti: 'https://www.kauppalehti.fi/rss',
  maaseuduntulevaisuus: 'https://www.maaseuduntulevaisuus.fi/feed',
  suomenkuvalehti: 'https://suomenkuvalehti.fi/feed-uusimmat/',
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeed(source: NewsSource): Promise<ParsedFeedItem[]> {
  const url = RSS_FEEDS[source];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Tilannetieto.fi/1.0 (uutisvalvonta)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${source}`);
    }

    const xml = await response.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const channel = parsed?.rss?.channel;
    if (!channel?.item) return [];

    const items: RawRSSItem[] = Array.isArray(channel.item)
      ? channel.item
      : [channel.item];

    return items.slice(0, 30).map((item) => {
      const summary =
        stripHtml(item.description || item['content:encoded'] || '').slice(
          0,
          500
        );

      const rawCategories = item.category
        ? Array.isArray(item.category)
          ? item.category.map((c: any) => (typeof c === 'string' ? c : c._ || String(c)))
          : [typeof item.category === 'string' ? item.category : (item.category as any)._ || String(item.category)]
        : [];

      return {
        title: stripHtml(item.title || ''),
        url: item.link || item.guid || '',
        summary,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source,
        rawCategories,
      };
    });
  } catch (error) {
    console.error(`[RSS] Failed to fetch ${source}:`, error);
    return [];
  }
}

export async function fetchAllFeeds(): Promise<ParsedFeedItem[]> {
  const sources = Object.keys(RSS_FEEDS) as NewsSource[];
  const results = await Promise.allSettled(
    sources.map((s) => fetchFeed(s))
  );

  const allItems: ParsedFeedItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  // Sort by date descending
  allItems.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );

  console.log(`[RSS] Fetched ${allItems.length} articles total`);
  return allItems;
}
