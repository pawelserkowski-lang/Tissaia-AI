import { describe, it, expect, vi } from 'vitest';
import { memoize, memoizeWithTTL, LRUCache } from '../../../utils/performance/memoization';

describe('memoize', () => {
  it('should cache function results', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use custom resolver', () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 2);
    const memoized = memoize(fn, (obj) => String(obj.id));

    const obj1 = { id: 1 };
    const obj2 = { id: 1 };

    expect(memoized(obj1)).toBe(2);
    expect(memoized(obj2)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cache different arguments separately', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(10)).toBe(20);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('memoizeWithTTL', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should cache results with TTL', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoizeWithTTL(fn, 1000);

    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should expire cache after TTL', () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoizeWithTTL(fn, 1000);

    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1001);

    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('LRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache<string, number>(3);

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('should evict least recently used item', () => {
    const cache = new LRUCache<string, number>(3);

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('d')).toBe(4);
  });

  it('should update LRU order on get', () => {
    const cache = new LRUCache<string, number>(3);

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    cache.get('a'); // 'a' is now most recently used

    cache.set('d', 4);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('should return correct size', () => {
    const cache = new LRUCache<string, number>(5);

    expect(cache.size).toBe(0);

    cache.set('a', 1);
    cache.set('b', 2);

    expect(cache.size).toBe(2);
  });

  it('should clear cache', () => {
    const cache = new LRUCache<string, number>(3);

    cache.set('a', 1);
    cache.set('b', 2);

    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });
});
