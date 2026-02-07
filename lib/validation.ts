/**
 * Input validation utilities for API routes
 */

export function validateYear(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 2000 || num > 2030) return fallback;
  return String(num);
}

const VALID_FORMATS = ['geojson', 'json'] as const;
type ValidFormat = typeof VALID_FORMATS[number];

export function validateFormat(value: string | null, fallback: ValidFormat = 'geojson'): ValidFormat {
  if (!value) return fallback;
  const lower = value.toLowerCase() as ValidFormat;
  return VALID_FORMATS.includes(lower) ? lower : fallback;
}

export function sanitizeSearch(value: string | null): string {
  if (!value) return '';
  return value
    .slice(0, 200)
    .replace(/<[^>]*>/g, '');
}
