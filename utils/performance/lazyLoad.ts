import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Lazy load component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3,
  interval: number = 1000
): LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }

            console.warn(
              `Failed to load component, retrying... (${retriesLeft} attempts left)`
            );

            setTimeout(() => {
              attemptImport(retriesLeft - 1);
            }, interval);
          });
      };

      attemptImport(retries);
    });
  });
}

/**
 * Preload component for faster subsequent loads
 */
export function preloadComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): void {
  componentImport().catch(() => {
    // Silently fail preload
  });
}

/**
 * Create lazy component with preload function
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): LazyExoticComponent<T> & { preload: () => void } {
  const LazyComponent = lazy(componentImport);

  return Object.assign(LazyComponent, {
    preload: () => preloadComponent(componentImport),
  });
}

/**
 * Intersection Observer based lazy loading for any element
 */
export function observeIntersection(
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
        observer.disconnect();
      }
    });
  }, options);

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Prefetch resources for better performance
 */
export function prefetchResource(
  url: string,
  type: 'script' | 'style' | 'font' | 'image' = 'script'
): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = type;
  document.head.appendChild(link);
}

/**
 * Preconnect to external domains
 */
export function preconnect(url: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(url: string): void {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = url;
  document.head.appendChild(link);
}
