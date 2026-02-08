import { describe, it, expect } from 'vitest';
import { validateYear, validateFormat, sanitizeSearch } from '../validation';

describe('validateYear', () => {
  it('returns fallback when value is null', () => {
    expect(validateYear(null, '2024')).toBe('2024');
  });

  it('returns valid year as string', () => {
    expect(validateYear('2023', '2024')).toBe('2023');
  });

  it('returns fallback for year below 2000', () => {
    expect(validateYear('1999', '2024')).toBe('2024');
  });

  it('returns fallback for year above 2030', () => {
    expect(validateYear('2031', '2024')).toBe('2024');
  });

  it('returns fallback for non-numeric input', () => {
    expect(validateYear('abc', '2024')).toBe('2024');
  });

  it('returns fallback for empty string', () => {
    expect(validateYear('', '2024')).toBe('2024');
  });

  it('accepts boundary year 2000', () => {
    expect(validateYear('2000', '2024')).toBe('2000');
  });

  it('accepts boundary year 2030', () => {
    expect(validateYear('2030', '2024')).toBe('2030');
  });
});

describe('validateFormat', () => {
  it('returns fallback when value is null', () => {
    expect(validateFormat(null)).toBe('geojson');
  });

  it('accepts geojson', () => {
    expect(validateFormat('geojson')).toBe('geojson');
  });

  it('accepts json', () => {
    expect(validateFormat('json')).toBe('json');
  });

  it('is case-insensitive', () => {
    expect(validateFormat('GeoJSON')).toBe('geojson');
    expect(validateFormat('JSON')).toBe('json');
  });

  it('returns fallback for invalid format', () => {
    expect(validateFormat('xml')).toBe('geojson');
  });

  it('uses custom fallback', () => {
    expect(validateFormat(null, 'json')).toBe('json');
  });
});

describe('sanitizeSearch', () => {
  it('returns empty string for null', () => {
    expect(sanitizeSearch(null)).toBe('');
  });

  it('passes through normal text', () => {
    expect(sanitizeSearch('Helsinki')).toBe('Helsinki');
  });

  it('strips HTML tags', () => {
    expect(sanitizeSearch('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('truncates to 200 characters', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeSearch(long)).toHaveLength(200);
  });

  it('strips nested HTML tags', () => {
    expect(sanitizeSearch('<div><b>bold</b></div>')).toBe('bold');
  });

  it('handles empty string', () => {
    expect(sanitizeSearch('')).toBe('');
  });
});
