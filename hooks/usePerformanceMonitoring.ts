import { useEffect } from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

/**
 * Performance thresholds based on Web Vitals
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

/**
 * Get rating for a metric
 */
const getRating = (
  name: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

/**
 * Custom hook to monitor Web Vitals performance
 */
export const usePerformanceMonitoring = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const metrics: PerformanceMetric[] = [];

    // Observe Largest Contentful Paint (LCP)
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          const metric: PerformanceMetric = {
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
            timestamp: Date.now(),
          };
          metrics.push(metric);
          logMetric(metric);
        }
      });

      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('LCP observation not supported');
      }

      return observer;
    };

    // Observe First Input Delay (FID)
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const metric: PerformanceMetric = {
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            rating: getRating('FID', entry.processingStart - entry.startTime),
            timestamp: Date.now(),
          };
          metrics.push(metric);
          logMetric(metric);
        });
      });

      try {
        observer.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('FID observation not supported');
      }

      return observer;
    };

    // Observe Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        const metric: PerformanceMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          timestamp: Date.now(),
        };
        metrics.push(metric);
        logMetric(metric);
      });

      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('CLS observation not supported');
      }

      return observer;
    };

    // Observe Navigation Timing
    const observeNavigationTiming = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

        if (navEntries.length > 0) {
          const navEntry = navEntries[0];

          // First Contentful Paint
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');

          if (fcpEntry) {
            const metric: PerformanceMetric = {
              name: 'FCP',
              value: fcpEntry.startTime,
              rating: getRating('FCP', fcpEntry.startTime),
              timestamp: Date.now(),
            };
            metrics.push(metric);
            logMetric(metric);
          }

          // Time to First Byte
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          const ttfbMetric: PerformanceMetric = {
            name: 'TTFB',
            value: ttfb,
            rating: getRating('TTFB', ttfb),
            timestamp: Date.now(),
          };
          metrics.push(ttfbMetric);
          logMetric(ttfbMetric);
        }
      }
    };

    // Log metric to console (can be extended to send to analytics)
    const logMetric = (metric: PerformanceMetric) => {
      const emoji = {
        good: '✅',
        'needs-improvement': '⚠️',
        poor: '❌',
      }[metric.rating];

      console.log(
        `[Performance] ${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`
      );

      // Store in localStorage for analysis
      try {
        const stored = JSON.parse(localStorage.getItem('tissaia-performance-metrics') || '[]');
        stored.push(metric);
        // Keep only last 100 metrics
        if (stored.length > 100) stored.shift();
        localStorage.setItem('tissaia-performance-metrics', JSON.stringify(stored));
      } catch (e) {
        // Ignore storage errors
      }
    };

    // Start observing
    const observers = [
      observeLCP(),
      observeFID(),
      observeCLS(),
    ];

    observeNavigationTiming();

    // Cleanup
    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [enabled]);
};

/**
 * Get stored performance metrics
 */
export const getPerformanceMetrics = (): PerformanceMetric[] => {
  try {
    return JSON.parse(localStorage.getItem('tissaia-performance-metrics') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored performance metrics
 */
export const clearPerformanceMetrics = (): void => {
  try {
    localStorage.removeItem('tissaia-performance-metrics');
  } catch {
    // Ignore errors
  }
};

/**
 * Get performance summary
 */
export const getPerformanceSummary = (): {
  averages: Record<string, number>;
  ratings: Record<string, Record<string, number>>;
} => {
  const metrics = getPerformanceMetrics();
  const summary: {
    averages: Record<string, number>;
    ratings: Record<string, Record<string, number>>;
  } = {
    averages: {},
    ratings: {},
  };

  metrics.forEach((metric) => {
    // Calculate averages
    if (!summary.averages[metric.name]) {
      summary.averages[metric.name] = 0;
    }
    summary.averages[metric.name] += metric.value;

    // Count ratings
    if (!summary.ratings[metric.name]) {
      summary.ratings[metric.name] = { good: 0, 'needs-improvement': 0, poor: 0 };
    }
    summary.ratings[metric.name][metric.rating]++;
  });

  // Calculate final averages
  Object.keys(summary.averages).forEach((key) => {
    const count = metrics.filter((m) => m.name === key).length;
    summary.averages[key] /= count;
  });

  return summary;
};
