import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  name: string;
  status: 'ok' | 'error';
  message?: string;
}

async function checkRedis(): Promise<HealthCheck> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return { name: 'redis', status: 'error', message: 'Not configured' };
  }

  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    return { name: 'redis', status: res.ok ? 'ok' : 'error' };
  } catch {
    return { name: 'redis', status: 'error', message: 'Connection failed' };
  }
}

async function checkSupabase(): Promise<HealthCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { name: 'supabase', status: 'error', message: 'Not configured' };
  }

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    return { name: 'supabase', status: res.ok ? 'ok' : 'error' };
  } catch {
    return { name: 'supabase', status: 'error', message: 'Connection failed' };
  }
}

function checkEnvVars(): HealthCheck {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_MAPBOX_TOKEN',
  ];
  const missing = required.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    return { name: 'env', status: 'error', message: `Missing: ${missing.join(', ')}` };
  }
  return { name: 'env', status: 'ok' };
}

export async function GET() {
  const checks = await Promise.all([
    checkRedis(),
    checkSupabase(),
    Promise.resolve(checkEnvVars()),
  ]);

  const hasError = checks.some((c) => c.status === 'error');
  const allError = checks.every((c) => c.status === 'error');

  const status = allError ? 'error' : hasError ? 'degraded' : 'ok';

  return NextResponse.json(
    {
      status,
      checks: Object.fromEntries(checks.map((c) => [c.name, c])),
      timestamp: new Date().toISOString(),
    },
    {
      status: status === 'error' ? 503 : 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
