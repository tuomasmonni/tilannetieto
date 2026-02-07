/**
 * Environment variable validation
 * Called at startup to catch missing configuration early
 */

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_MAPBOX_TOKEN',
] as const;

const OPTIONAL_ENV = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ANTHROPIC_API_KEY',
  'FINGRID_API_KEY',
] as const;

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_ENV) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`[ENV] Missing required env vars: ${missing.join(', ')}`);
  }
  if (warnings.length > 0) {
    console.warn(`[ENV] Missing optional env vars: ${warnings.join(', ')}`);
  }

  return { valid: missing.length === 0, missing, warnings };
}
