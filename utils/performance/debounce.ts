/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
}

/**
 * Advanced debounce with leading and trailing edge options
 */
export function advancedDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true, maxWait } = options;

  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let lastCallTime: number = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    const invokeFunc = () => {
      lastCallTime = now;
      func(...args);
    };

    const clearTimers = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (maxTimeout) {
        clearTimeout(maxTimeout);
        maxTimeout = null;
      }
    };

    // Leading edge
    if (leading && !timeout) {
      invokeFunc();
    }

    // Clear existing timers
    clearTimers();

    // Trailing edge
    if (trailing) {
      timeout = setTimeout(() => {
        invokeFunc();
        clearTimers();
      }, wait);
    }

    // Max wait
    if (maxWait && timeSinceLastCall < maxWait) {
      maxTimeout = setTimeout(() => {
        invokeFunc();
        clearTimers();
      }, maxWait - timeSinceLastCall);
    }
  };
}

/**
 * Request animation frame throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}
