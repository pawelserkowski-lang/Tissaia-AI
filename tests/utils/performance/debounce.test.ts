import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle, rafThrottle } from '../../../utils/performance/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call immediately when immediate flag is true', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100, true);

    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should limit function calls', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should allow call after limit period', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments correctly', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('test');
    expect(fn).toHaveBeenCalledWith('test');
  });
});

describe('rafThrottle', () => {
  it('should throttle using requestAnimationFrame', () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled();
    throttled();
    throttled();

    // RAF not yet executed
    expect(fn).not.toHaveBeenCalled();
  });
});
