import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatFileSize,
  formatDuration,
  pluralize,
} from '../../../utils/i18n/formatters';

describe('formatNumber', () => {
  it('should format numbers according to locale', () => {
    expect(formatNumber(1234.56, 'en')).toContain('1,234');
    expect(formatNumber(1234.56, 'de')).toContain('1.234');
  });

  it('should respect formatting options', () => {
    const result = formatNumber(1234.567, 'en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(result).toContain('1,234.57');
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(100, 'en')).toBe('100 B');
    expect(formatFileSize(1024, 'en')).toBe('1 KB');
    expect(formatFileSize(1024 * 1024, 'en')).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024, 'en')).toBe('1 GB');
  });

  it('should handle decimal values', () => {
    const result = formatFileSize(1536, 'en');
    expect(result).toBe('1.5 KB');
  });
});

describe('formatDuration', () => {
  it('should format milliseconds correctly', () => {
    expect(formatDuration(5000)).toBe('5s');
    expect(formatDuration(65000)).toBe('1m 5s');
    expect(formatDuration(3665000)).toBe('1h 1m');
  });

  it('should handle zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('pluralize', () => {
  it('should return singular for count of 1', () => {
    expect(pluralize(1, 'item', 'items', 'en')).toBe('item');
  });

  it('should return plural for other counts', () => {
    expect(pluralize(0, 'item', 'items', 'en')).toBe('items');
    expect(pluralize(2, 'item', 'items', 'en')).toBe('items');
    expect(pluralize(10, 'item', 'items', 'en')).toBe('items');
  });
});
