import { useEffect, useRef, useCallback } from 'react';

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

export interface PinchGesture {
  scale: number;
  delta: number;
}

export interface TouchGestureOptions {
  onSwipe?: (direction: SwipeDirection) => void;
  onPinch?: (gesture: PinchGesture) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
}

/**
 * Hook for handling touch gestures on mobile devices
 */
export const useTouchGestures = <T extends HTMLElement>(
  options: TouchGestureOptions = {}
) => {
  const {
    onSwipe,
    onPinch,
    onDoubleTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
  } = options;

  const elementRef = useRef<T>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);

  /**
   * Calculate distance between two touch points
   */
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];

      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };

        // Long press detection
        if (onLongPress) {
          longPressTimerRef.current = setTimeout(() => {
            onLongPress();
          }, longPressDelay);
        }
      } else if (e.touches.length === 2 && onPinch) {
        // Pinch gesture start
        initialPinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      }
    },
    [onLongPress, onPinch, longPressDelay, getTouchDistance]
  );

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      // Clear long press timer on move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Handle pinch
      if (e.touches.length === 2 && onPinch && initialPinchDistanceRef.current) {
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialPinchDistanceRef.current;
        const delta = currentDistance - initialPinchDistanceRef.current;

        onPinch({ scale, delta });
      }
    },
    [onPinch, getTouchDistance]
  );

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Reset pinch
      initialPinchDistanceRef.current = null;

      if (!touchStartRef.current || e.touches.length > 0) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - touchStartRef.current.x;
      const deltaY = endY - touchStartRef.current.y;
      const deltaTime = endTime - touchStartRef.current.time;

      // Double tap detection
      if (onDoubleTap) {
        const timeSinceLastTap = endTime - lastTapRef.current;
        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
          onDoubleTap();
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = endTime;
      }

      // Swipe detection
      if (onSwipe) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > swipeThreshold || absY > swipeThreshold) {
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const velocity = distance / deltaTime;

          let direction: SwipeDirection['direction'];

          if (absX > absY) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }

          onSwipe({ direction, distance, velocity });
        }
      }

      touchStartRef.current = null;
    },
    [onSwipe, onDoubleTap, swipeThreshold]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
};

/**
 * Hook for preventing scroll on touch devices
 */
export const usePreventScroll = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const preventDefault = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [enabled]);
};

/**
 * Hook for pull-to-refresh functionality
 */
export const usePullToRefresh = (onRefresh: () => void | Promise<void>) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current) return;

    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - startYRef.current;

    if (pullDistance > 80 && window.scrollY === 0) {
      // Show pull indicator
      // This could trigger a visual indicator component
    }
  }, []);

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!isPullingRef.current) return;

    const endY = e.changedTouches[0].clientY;
    const pullDistance = endY - startYRef.current;

    if (pullDistance > 80 && window.scrollY === 0) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    isPullingRef.current = false;
  }, [onRefresh]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { elementRef, isRefreshing };
};
