/**
 * i18n utilities exports
 */

export { translations, en, es, fr, de } from './translations';
export type { Language, TranslationKey } from './translations';

export {
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  formatDuration,
  pluralize,
  formatPercentage,
  formatList,
} from './formatters';
