/**
 * Performance optimization utilities
 * Exports all performance-related utilities for improved app performance
 */

// Debounce and throttle
export {
  debounce,
  throttle,
  advancedDebounce,
  rafThrottle,
} from './debounce';

// Memoization
export {
  memoize,
  memoizeWithTTL,
  memoizeWithLRU,
  memoizeAsync,
  LRUCache,
} from './memoization';

// Image optimization
export {
  optimizeImage,
  convertToWebP,
  generateResponsiveImages,
  createThumbnail,
  lazyLoadImage,
  preloadImages,
  getImageDimensions,
  dataURLtoBlob,
  blobToDataURL,
} from './imageOptimization';

export type { ImageOptimizationOptions } from './imageOptimization';

// Lazy loading
export {
  lazyWithRetry,
  preloadComponent,
  lazyWithPreload,
  observeIntersection,
  prefetchResource,
  preconnect,
  dnsPrefetch,
} from './lazyLoad';
