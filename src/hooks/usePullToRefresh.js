import { useState, useRef, useCallback } from 'react';

/**
 * Mobile pull-to-refresh hook with smooth spring damping and haptic feedback.
 */
export function usePullToRefresh({ onRefresh, threshold = 65 }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e, scrollContainer) => {
    if (isRefreshing) return;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);
    if (scrollTop <= 1) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e, scrollContainer) => {
    if (!isPullingRef.current || isRefreshing) return;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);
    if (scrollTop > 5) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const rawDiff = currentY - startYRef.current;

    if (rawDiff > 0) {
      // Logarithmic spring damping
      const damped = Math.min(100, Math.round(Math.pow(rawDiff, 0.82) * 1.5));
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      // Gentle haptic feedback on supported mobile devices
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch (_) {}
      }

      try {
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        console.warn('Pull to refresh failed:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}

