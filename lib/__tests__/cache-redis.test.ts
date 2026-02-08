import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env vars before importing the module
vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://fake-redis.upstash.io');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fake-token');

// Must dynamically import after env setup
const { getCached, setCached, deleteCached, getCacheStats } = await import('../cache/redis');

describe('getCacheStats', () => {
  it('reports enabled when env vars are set', () => {
    const stats = getCacheStats();
    expect(stats.enabled).toBe(true);
    expect(stats.url).toBe('configured');
    expect(stats.token).toBe('configured');
  });
});

describe('getCached', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed data on cache hit', async () => {
    const mockData = { count: 42, items: ['a', 'b'] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(mockData) }),
      })
    );

    const result = await getCached('test-key');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('https://fake-redis.upstash.io/get/test-key', {
      headers: { Authorization: 'Bearer fake-token' },
    });
  });

  it('returns null when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await getCached('missing-key');
    expect(result).toBeNull();
  });

  it('returns null when result is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: null }),
      })
    );

    const result = await getCached('empty-key');
    expect(result).toBeNull();
  });

  it('returns null on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await getCached('error-key');
    expect(result).toBeNull();
  });
});

describe('setCached', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends SET command with TTL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const result = await setCached('my-key', { data: 'hello' }, 60);
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://fake-redis.upstash.io', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', 'my-key', JSON.stringify({ data: 'hello' }), 'EX', 60]),
    });
  });

  it('returns false on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await setCached('fail-key', 'data', 30);
    expect(result).toBe(false);
  });
});

describe('deleteCached', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends DELETE request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const result = await deleteCached('del-key');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://fake-redis.upstash.io/del/del-key', {
      method: 'POST',
      headers: { Authorization: 'Bearer fake-token' },
    });
  });

  it('returns false on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    const result = await deleteCached('err-key');
    expect(result).toBe(false);
  });
});
