/**
 * Formatting utilities for i18n
 */

import { Language } from './translations';

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(language, options).format(value);
}

/**
 * Format currency
 */
export function formatCurrency(
  value: number,
  language: Language,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | number,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(language, options).format(date);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: Date | number,
  language: Language
): string {
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const now = Date.now();
  const then = typeof date === 'number' ? date : date.getTime();
  const diffInSeconds = Math.floor((then - now) / 1000);

  const times = [
    { seconds: 31536000, unit: 'year' },
    { seconds: 2592000, unit: 'month' },
    { seconds: 86400, unit: 'day' },
    { seconds: 3600, unit: 'hour' },
    { seconds: 60, unit: 'minute' },
    { seconds: 1, unit: 'second' },
  ] as const;

  for (const { seconds, unit } of times) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (Math.abs(interval) >= 1) {
      return rtf.format(interval, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number, language: Language = 'en'): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${formatNumber(size, language, { maximumFractionDigits: 2 })} ${units[unitIndex]}`;
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number, language: Language = 'en'): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Pluralize based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  language: Language = 'en'
): string {
  const rules = new Intl.PluralRules(language);
  const rule = rules.select(count);

  return rule === 'one' ? singular : plural;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  language: Language,
  decimals: number = 0
): string {
  return new Intl.NumberFormat(language, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * List formatter
 */
export function formatList(
  items: string[],
  language: Language,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(language, { type }).format(items);
}
