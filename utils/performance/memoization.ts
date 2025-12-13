/**
 * Simple memoization for functions
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Memoization with TTL (time to live)
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  func: T,
  ttl: number,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<
    string,
    { value: ReturnType<T>; timestamp: number }
  >();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = func(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  }) as T;
}

/**
 * LRU (Least Recently Used) cache with max size
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoization with LRU cache
 */
export function memoizeWithLRU<T extends (...args: any[]) => any>(
  func: T,
  maxSize: number = 100,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Async memoization
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, Promise<Awaited<ReturnType<T>>>>();

  return (async (...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const promise = func(...args);
    cache.set(key, promise);

    try {
      return await promise;
    } catch (error) {
      // Remove failed promises from cache
      cache.delete(key);
      throw error;
    }
  }) as T;
}
