/**
 * Event Clusterer - AI-powered news event grouping
 * Groups articles about the same event from different sources
 */

import type { NewsArticle, NewsEvent, NewsCategory, NewsSource } from './types';

/**
 * Compute Jaccard similarity between two title word sets
 */
function computeTitleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\wäöåÄÖÅ]/g, ' ').split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().replace(/[^\wäöåÄÖÅ]/g, ' ').split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Fallback clustering using title similarity + municipality match
 */
function fallbackCluster(articles: NewsArticle[]): number[][] {
  const assigned = new Set<number>();
  const clusters: number[][] = [];

  for (let i = 0; i < articles.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = [i];
    assigned.add(i);

    for (let j = i + 1; j < articles.length; j++) {
      if (assigned.has(j)) continue;

      const sameMunicipality = articles[i].municipality && articles[j].municipality
        && articles[i].municipality === articles[j].municipality;
      const titleSim = computeTitleSimilarity(articles[i].title, articles[j].title);

      // Same municipality + >30% title similarity, or >50% title similarity alone
      if ((sameMunicipality && titleSim > 0.3) || titleSim > 0.5) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * AI-powered clustering using Claude Haiku
 */
async function aiCluster(articles: NewsArticle[]): Promise<{ clusters: number[][]; summaries: Record<string, string> }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || articles.length < 2 || process.env.VERCEL) {
    return { clusters: articles.map((_, i) => [i]), summaries: {} };
  }

  // Group by municipality to reduce batch sizes
  const byMunicipality = new Map<string, number[]>();
  for (let i = 0; i < articles.length; i++) {
    const key = articles[i].municipality || '__none__';
    if (!byMunicipality.has(key)) byMunicipality.set(key, []);
    byMunicipality.get(key)!.push(i);
  }

  const allClusters: number[][] = [];
  const allSummaries: Record<string, string> = {};

  for (const [muni, indices] of byMunicipality) {
    // Only AI-cluster groups with 2+ articles in the same municipality
    if (indices.length < 2 || muni === '__none__') {
      for (const idx of indices) allClusters.push([idx]);
      continue;
    }

    // Cap at 50 per batch
    const batch = indices.slice(0, 50);
    const articlesText = batch.map((idx, localIdx) =>
      `[${localIdx}] ${articles[idx].source.toUpperCase()}: ${articles[idx].title}\n   ${articles[idx].summary.slice(0, 200)}`
    ).join('\n\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Analysoi nämä suomalaiset uutisartikkelit ja ryhmittele ne tapahtumien mukaan.
Jos 2+ artikkelia kertovat SAMASTA tapahtumasta, ryhmittele ne.
Luo myös yhteenveto jokaiselle klusterille jossa on 2+ artikkelia.

Palauta VAIN JSON (ei muuta tekstiä):
{
  "clusters": [[0,3,7], [1,5], [2], [4], [6]],
  "summaries": { "0": "Yhdistetty tiivistelmä klusterille 0...", "1": "..." }
}

summaries-avain = klusterin ensimmäinen indeksi. Vain klustereille joissa 2+ artikkelia.

ARTIKKELIT (kunta: ${muni}):
${articlesText}`,
          }],
        }),
      });

      if (!response.ok) {
        console.error(`[EventClusterer] AI error: ${response.status}`);
        for (const idx of batch) allClusters.push([idx]);
        continue;
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        for (const idx of batch) allClusters.push([idx]);
        continue;
      }

      const result: { clusters: number[][]; summaries: Record<string, string> } = JSON.parse(jsonMatch[0]);

      // Map local indices back to global
      for (const cluster of result.clusters) {
        const globalCluster = cluster.map(localIdx => batch[localIdx]).filter(idx => idx !== undefined);
        allClusters.push(globalCluster);
      }

      // Map summaries with first global index as key
      for (const [localKey, summary] of Object.entries(result.summaries || {})) {
        const localIdx = parseInt(localKey, 10);
        const globalIdx = batch[localIdx];
        if (globalIdx !== undefined) {
          allSummaries[String(globalIdx)] = summary;
        }
      }

      // Handle remaining indices (beyond batch of 50)
      for (const idx of indices.slice(50)) allClusters.push([idx]);

    } catch (error) {
      console.error(`[EventClusterer] AI cluster error for ${muni}:`, error);
      for (const idx of batch) allClusters.push([idx]);
    }
  }

  return { clusters: allClusters, summaries: allSummaries };
}

/**
 * Merge a cluster of articles into a single NewsEvent
 */
function mergeCluster(articles: NewsArticle[], clusterArticles: NewsArticle[], summary?: string): NewsEvent {
  // Primary = longest summary or highest confidence
  const primary = clusterArticles.reduce((best, a) =>
    a.summary.length > best.summary.length ? a : best
  , clusterArticles[0]);

  const sources = [...new Set(clusterArticles.map(a => a.source))] as NewsSource[];
  const categories = getMostCommonCategories(clusterArticles);
  const highestSeverity = getHighestSeverity(clusterArticles);
  const highestConfidence = Math.max(...clusterArticles.map(a => a.confidence));

  return {
    id: `evt_${primary.id}`,
    primaryArticle: primary,
    articles: clusterArticles,
    sources,
    mergedSummary: summary || primary.summary,
    municipality: primary.municipality,
    lat: primary.lat,
    lng: primary.lng,
    categories,
    severity: highestSeverity,
    confidence: highestConfidence,
    locationName: primary.locationName,
  };
}

function getMostCommonCategories(articles: NewsArticle[]): NewsCategory[] {
  const counts = new Map<NewsCategory, number>();
  for (const a of articles) {
    for (const c of a.categories) {
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat);
}

function getHighestSeverity(articles: NewsArticle[]): 'low' | 'medium' | 'high' {
  const order = { high: 3, medium: 2, low: 1 };
  let max: 'low' | 'medium' | 'high' = 'low';
  for (const a of articles) {
    if (order[a.severity] > order[max]) max = a.severity;
  }
  return max;
}

/**
 * Main entry point: cluster articles into events
 */
export async function clusterArticles(articles: NewsArticle[]): Promise<{
  events: NewsEvent[];
  singleArticles: NewsArticle[];
}> {
  if (articles.length === 0) return { events: [], singleArticles: [] };

  let clusterResult: { clusters: number[][]; summaries: Record<string, string> };

  try {
    clusterResult = await aiCluster(articles);
  } catch (error) {
    console.error('[EventClusterer] AI clustering failed, using fallback:', error);
    const fallbackClusters = fallbackCluster(articles);
    clusterResult = { clusters: fallbackClusters, summaries: {} };
  }

  const events: NewsEvent[] = [];
  const singleArticles: NewsArticle[] = [];

  for (const cluster of clusterResult.clusters) {
    if (cluster.length >= 2) {
      const clusterArts = cluster.map(i => articles[i]).filter(Boolean);
      const summaryKey = String(cluster[0]);
      const summary = clusterResult.summaries[summaryKey];
      events.push(mergeCluster(articles, clusterArts, summary));
    } else if (cluster.length === 1) {
      singleArticles.push(articles[cluster[0]]);
    }
  }

  console.log(`[EventClusterer] ${events.length} events (${events.reduce((sum, e) => sum + e.articles.length, 0)} articles merged), ${singleArticles.length} singles`);
  return { events, singleArticles };
}
