/**
 * Redis Cache Layer
 *
 * Käyttää Upstash Redis:iä cache-tasona.
 * Ratkaisu: Poistaa 95% API-kutsuja (polling bottleneck)
 *
 * Käyttö:
 *   const cached = await getCached('traffic:all');
 *   if (cached) return cached;
 *   const data = await fetchAPI();
 *   await setCached('traffic:all', data, 60); // 60s TTL
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  console.warn('⚠️  Redis cache disabled: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
}

/**
 * Hae arvo cachesta (avain, palaa null jos ei löydy)
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;

  try {
    const response = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data.result ?? data.value;
    if (!raw) return null;

    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
  } catch (error) {
    console.error(`Redis getCached error (${key}):`, error);
    return null;
  }
}

/**
 * Tallenna arvo cacheen TTL:llä (sekuntteina)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<boolean> {
  if (!REDIS_URL || !REDIS_TOKEN) return false;

  try {
    const serialized = JSON.stringify(value);
    const response = await fetch(REDIS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', key, serialized, 'EX', ttlSeconds]),
    });

    return response.ok;
  } catch (error) {
    console.error(`Redis setCached error (${key}):`, error);
    return false;
  }
}

/**
 * Poista avain cachesta
 */
export async function deleteCached(key: string): Promise<boolean> {
  if (!REDIS_URL || !REDIS_TOKEN) return false;

  try {
    const response = await fetch(`${REDIS_URL}/del/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error(`Redis deleteCached error (${key}):`, error);
    return false;
  }
}

/**
 * Yhdistetty haku + cache logiikka
 * Käyttö: const data = await getOrFetch('traffic:all', fetchFn, 60)
 */
export async function getOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // 1. Yritä hakea cachesta
  const cached = await getCached<T>(key);
  if (cached) {
    console.log(`✅ Cache hit: ${key}`);
    return cached;
  }

  // 2. Jos ei cachessa, hae ulkoisesta lähteestä
  console.log(`⏳ Cache miss: ${key}, fetching...`);
  const data = await fetchFn();

  // 3. Tallenna cacheen
  await setCached(key, data, ttlSeconds);

  return data;
}

/**
 * Cache statistics (debug)
 */
export function getCacheStats() {
  return {
    enabled: !!REDIS_URL && !!REDIS_TOKEN,
    url: REDIS_URL ? 'configured' : 'missing',
    token: REDIS_TOKEN ? 'configured' : 'missing',
  };
}
