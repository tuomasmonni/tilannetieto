/**
 * News Analyzer - AI-powered analysis with Claude Haiku
 * Fallback: keyword-based analysis
 */

import type {
  ParsedFeedItem,
  NewsArticle,
  NewsCategory,
  NewsAnalysis,
} from './types';

// Municipality data cache
let municipalitiesCache: Array<{ name: string; lat: number; lng: number }> | null = null;

async function loadMunicipalities(): Promise<Array<{ name: string; lat: number; lng: number }>> {
  if (municipalitiesCache) return municipalitiesCache;

  try {
    const data = await import('@/data/static/municipalities.json');
    municipalitiesCache = data.default || data;
    return municipalitiesCache!;
  } catch {
    console.error('[NewsAnalyzer] Failed to load municipalities');
    return [];
  }
}

// Keyword-based fallback categorization
const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  liikenne: ['onnettomuus', 'kolari', 'liikenne', 'ruuhka', 'tie', 'auto', 'moottoritie', 'bussiliikenne', 'junaliikenne', 'lento', 'lautta'],
  rikos: ['rikos', 'pahoinpitely', 'varkaus', 'poliisi', 'tuomio', 'pid\u00e4tetty', 'syytetty', 'murha', 'hy\u00f6kk\u00e4ys', 'huume', 'k\u00e4r\u00e4j\u00e4oikeus', 'hovioikeus'],
  politiikka: ['hallitus', 'eduskunta', 'ministeri', 'budjetti', 'laki', '\u00e4\u00e4nestys', 'puolue', 'presidentti', 'kansanedustaja', 'EU', 'NATO'],
  terveys: ['sairaus', 'epidemia', 'terveys', 'sairaala', 'potilas', 'rokote', 'influenssa', 'terveyskeskus', 'l\u00e4\u00e4ke', 'koronavirus'],
  ymparisto: ['ilmasto', 'saaste', 'luonto', 'myrsky', 'tulva', 'ymp\u00e4rist\u00f6', 's\u00e4\u00e4varoitus', 'ukkosmyrsky', 'j\u00e4te', 'p\u00e4\u00e4st\u00f6'],
  talous: ['talous', 'ty\u00f6tt\u00f6myys', 'p\u00f6rssi', 'konkurssi', 'inflaatio', 'kasvu', 'bruttokansantuote', 'BKT', 'lomautus', 'yt-neuvottelut', 'investointi'],
  urheilu: ['ottelu', 'mestaruus', 'liiga', 'joukkue', 'peli', 'turnaus', 'j\u00e4\u00e4kiekko', 'jalkapallo', 'olympia', 'urheilija'],
  onnettomuus: ['tulipalo', 'h\u00e4t\u00e4', 'pelastus', 'kuolema', 'r\u00e4j\u00e4hdys', 'turma', 'pelastuslaitos', 'kuollut', 'loukkaantunut', 'hukkunut'],
  muu: [],
};

function fallbackCategorize(title: string, summary: string): NewsCategory[] {
  const text = `${title} ${summary}`.toLowerCase();
  const scores: [NewsCategory, number][] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'muu') continue;
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > 0) scores.push([category as NewsCategory, score]);
  }

  scores.sort((a, b) => b[1] - a[1]);

  if (scores.length === 0) return ['muu'];
  return scores.slice(0, 2).map(([cat]) => cat);
}

// Yleisimpien kaupunkien erikoistaivutukset joita ei voi johtaa perusmuodosta
const SPECIAL_INFLECTIONS: Record<string, string> = {
  'Helsingissä': 'Helsinki', 'Helsinkiin': 'Helsinki', 'Helsingistä': 'Helsinki', 'Helsingin': 'Helsinki',
  'Tampereella': 'Tampere', 'Tampereelle': 'Tampere', 'Tampereelta': 'Tampere', 'Tampereen': 'Tampere',
  'Turussa': 'Turku', 'Turkuun': 'Turku', 'Turusta': 'Turku', 'Turun': 'Turku',
  'Oulussa': 'Oulu', 'Ouluun': 'Oulu', 'Oulusta': 'Oulu', 'Oulun': 'Oulu',
  'Jyväskylässä': 'Jyväskylä', 'Jyväskylään': 'Jyväskylä', 'Jyväskylästä': 'Jyväskylä', 'Jyväskylän': 'Jyväskylä',
  'Kuopiossa': 'Kuopio', 'Kuopioon': 'Kuopio', 'Kuopiosta': 'Kuopio', 'Kuopion': 'Kuopio',
  'Lahdessa': 'Lahti', 'Lahteen': 'Lahti', 'Lahdesta': 'Lahti', 'Lahden': 'Lahti',
  'Porissa': 'Pori', 'Poriin': 'Pori', 'Porista': 'Pori', 'Porin': 'Pori',
  'Joensuussa': 'Joensuu', 'Joensuuhun': 'Joensuu', 'Joensuusta': 'Joensuu', 'Joensuun': 'Joensuu',
  'Lappeenrannassa': 'Lappeenranta', 'Lappeenrantaan': 'Lappeenranta', 'Lappeenrannasta': 'Lappeenranta', 'Lappeenrannan': 'Lappeenranta',
  'Vaasassa': 'Vaasa', 'Vaasaan': 'Vaasa', 'Vaasasta': 'Vaasa', 'Vaasan': 'Vaasa',
  'Kotkassa': 'Kotka', 'Kotkaan': 'Kotka', 'Kotkasta': 'Kotka', 'Kotkan': 'Kotka',
  'Mikkelissä': 'Mikkeli', 'Mikkeliin': 'Mikkeli', 'Mikkelistä': 'Mikkeli', 'Mikkelin': 'Mikkeli',
  'Seinäjoella': 'Seinäjoki', 'Seinäjoelle': 'Seinäjoki', 'Seinäjoelta': 'Seinäjoki', 'Seinäjoen': 'Seinäjoki',
  'Rovaniemellä': 'Rovaniemi', 'Rovaniemelle': 'Rovaniemi', 'Rovaniemeltä': 'Rovaniemi', 'Rovaniemen': 'Rovaniemi',
  'Kouvola': 'Kouvola', 'Kouvolassa': 'Kouvola', 'Kouvolaan': 'Kouvola', 'Kouvolasta': 'Kouvola', 'Kouvolan': 'Kouvola',
  'Hämeenlinnassa': 'Hämeenlinna', 'Hämeenlinnaan': 'Hämeenlinna', 'Hämeenlinnasta': 'Hämeenlinna', 'Hämeenlinnan': 'Hämeenlinna',
  'Salossa': 'Salo', 'Saloon': 'Salo', 'Salosta': 'Salo', 'Salon': 'Salo',
  'Raahessa': 'Raahe', 'Raaheen': 'Raahe', 'Raahesta': 'Raahe', 'Raahen': 'Raahe',
};

function fallbackFindMunicipality(
  title: string,
  summary: string,
  municipalities: Array<{ name: string; lat: number; lng: number }>
): { name: string; lat: number; lng: number } | null {
  const text = `${title} ${summary}`;

  // 1. Tarkista erikoistaivutukset ensin (esim. "Helsingissä" → Helsinki)
  for (const [inflected, baseName] of Object.entries(SPECIAL_INFLECTIONS)) {
    if (text.includes(inflected)) {
      const muni = municipalities.find(m => m.name === baseName);
      if (muni) return muni;
    }
  }

  // Common Finnish suffixes for municipality names
  const suffixes = ['ssa', 'ssä', 'lla', 'llä', 'n', 'sta', 'stä', 'lta', 'ltä', 'lle', 'seen', 'hun', 'hin'];

  for (const muni of municipalities) {
    // Exact match
    if (text.includes(muni.name)) return muni;

    // Match with suffixes (e.g., "Espoossa", "Vantaalla")
    for (const suffix of suffixes) {
      if (text.includes(muni.name + suffix)) return muni;
      // Handle names ending in vowel where suffix replaces it
      const nameBase = muni.name.replace(/[aeiouäö]$/i, '');
      if (nameBase.length >= 3 && text.includes(nameBase + suffix)) return muni;
    }
  }

  return null;
}

function fallbackAnalysis(
  item: ParsedFeedItem,
  municipalities: Array<{ name: string; lat: number; lng: number }>
): NewsAnalysis {
  const categories = fallbackCategorize(item.title, item.summary);
  const muni = fallbackFindMunicipality(item.title, item.summary, municipalities);

  const severityCategories: NewsCategory[] = ['rikos', 'onnettomuus'];
  const severity = categories.some((c) => severityCategories.includes(c))
    ? 'medium'
    : 'low';

  return {
    municipality: muni?.name || null,
    categories,
    severity,
    summary: item.summary.slice(0, 200),
    confidence: muni ? 0.6 : 0.3,
  };
}

async function analyzeWithAI(
  items: ParsedFeedItem[],
  municipalities: Array<{ name: string; lat: number; lng: number }>
): Promise<NewsAnalysis[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('[NewsAnalyzer] No API key, using fallback');
    return items.map((item) => fallbackAnalysis(item, municipalities));
  }

  const muniNames = municipalities.map((m) => m.name).join(', ');

  // Process in batches of 20
  const BATCH_SIZE = 20;
  const allResults: NewsAnalysis[] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const articlesText = batch
      .map(
        (item, idx) =>
          `[${idx}] OTSIKKO: ${item.title}\nTIIVISTELM\u00c4: ${item.summary.slice(0, 300)}\nL\u00c4HDE: ${item.source}`
      )
      .join('\n\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `Analysoi seuraavat suomalaiset uutisartikkelit. Palauta JSON-taulukko.

Jokainen elementti:
{
  "index": numero,
  "municipality": "kunnan nimi tai null",
  "categories": ["kategoria1", "kategoria2"],
  "severity": "low" | "medium" | "high",
  "summary": "1 lause yhteenveto",
  "confidence": 0.0-1.0
}

Kategoriat: liikenne, rikos, politiikka, terveys, ymparisto, talous, urheilu, onnettomuus, muu

Kunnat (valitse VAIN n\u00e4ist\u00e4): ${muniNames.slice(0, 3000)}

S\u00e4\u00e4nn\u00f6t:
- municipality: tunnista kunta otsikosta/tiivistelm\u00e4st\u00e4. Jos ei selke\u00e4\u00e4 kuntaa, null.
- categories: 1-2 parhaiten sopivaa kategoriaa
- severity: "high" = kuolema/vakava onnettomuus/henkil\u00f6vahinko, "medium" = merkitt\u00e4v\u00e4 tapahtuma, "low" = normaali uutinen
- Palauta VAIN JSON-taulukko, ei muuta teksti\u00e4

ARTIKKELIT:
${articlesText}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error(`[NewsAnalyzer] AI API error: ${response.status}`);
        allResults.push(...batch.map((item) => fallbackAnalysis(item, municipalities)));
        continue;
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('[NewsAnalyzer] No JSON in AI response');
        allResults.push(...batch.map((item) => fallbackAnalysis(item, municipalities)));
        continue;
      }

      const analyses: Array<{
        index: number;
        municipality: string | null;
        categories: string[];
        severity: string;
        summary: string;
        confidence: number;
      }> = JSON.parse(jsonMatch[0]);

      // Map AI results back to batch items
      for (let j = 0; j < batch.length; j++) {
        const aiResult = analyses.find((a) => a.index === j);
        if (aiResult) {
          const validCategories = (aiResult.categories || ['muu']).filter((c) =>
            ['liikenne', 'rikos', 'politiikka', 'terveys', 'ymparisto', 'talous', 'urheilu', 'onnettomuus', 'muu'].includes(c)
          ) as NewsCategory[];

          allResults.push({
            municipality: aiResult.municipality || null,
            categories: validCategories.length > 0 ? validCategories : ['muu'],
            severity: (['low', 'medium', 'high'].includes(aiResult.severity) ? aiResult.severity : 'low') as 'low' | 'medium' | 'high',
            summary: aiResult.summary || batch[j].summary.slice(0, 200),
            confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : 0.5,
          });
        } else {
          allResults.push(fallbackAnalysis(batch[j], municipalities));
        }
      }
    } catch (error) {
      console.error('[NewsAnalyzer] AI batch error:', error);
      allResults.push(...batch.map((item) => fallbackAnalysis(item, municipalities)));
    }
  }

  return allResults;
}

function resolveCoordinates(
  municipalityName: string | null,
  municipalities: Array<{ name: string; lat: number; lng: number }>
): { lat: number | null; lng: number | null; locationName: string } {
  if (!municipalityName) {
    return { lat: null, lng: null, locationName: 'Suomi' };
  }

  const muni = municipalities.find(
    (m) => m.name.toLowerCase() === municipalityName.toLowerCase()
  );

  if (muni) {
    return { lat: muni.lat, lng: muni.lng, locationName: muni.name };
  }

  return { lat: null, lng: null, locationName: municipalityName };
}

export async function analyzeArticles(
  items: ParsedFeedItem[]
): Promise<NewsArticle[]> {
  if (items.length === 0) return [];

  const municipalities = await loadMunicipalities();
  const analyses = await analyzeWithAI(items, municipalities);

  const articles: NewsArticle[] = items.map((item, i) => {
    const analysis = analyses[i] || fallbackAnalysis(item, municipalities);
    const coords = resolveCoordinates(analysis.municipality, municipalities);

    return {
      id: Buffer.from(item.url).toString('base64').slice(0, 32),
      source: item.source,
      title: item.title,
      url: item.url,
      summary: analysis.summary || item.summary.slice(0, 200),
      publishedAt: item.publishedAt,
      categories: analysis.categories,
      municipality: analysis.municipality,
      lat: coords.lat,
      lng: coords.lng,
      severity: analysis.severity,
      confidence: analysis.confidence,
      locationName: coords.locationName,
    };
  });

  const geolocated = articles.filter((a) => a.lat !== null);
  console.log(
    `[NewsAnalyzer] ${geolocated.length}/${articles.length} articles geolocated`
  );

  return articles;
}
