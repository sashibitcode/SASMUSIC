import { useRef, useCallback } from 'react';

/**
 * Custom touch swipe gesture hook for mobile interactions.
 * Supports swipeLeft, swipeRight, swipeDown, swipeUp with velocity and delta thresholds.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  onSwipeUp,
  threshold = 50,
  preventScroll = false
} = {}) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchCurrentRef = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    if (preventScroll) {
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      if (deltaX > deltaY) {
        e.preventDefault();
      }
    }
  }, [preventScroll]);

  const onTouchEnd = useCallback(() => {
    const { x: startX, y: startY, time: startTime } = touchStartRef.current;
    const { x: endX, y: endY } = touchCurrentRef.current;
    const duration = Date.now() - startTime;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Fast flick or passed threshold
    const isFlick = duration < 300 && (absX > 30 || absY > 30);

    if (absX > absY && (absX >= threshold || isFlick)) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY >= absX && (absY >= threshold || isFlick)) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    touchStartRef.current = { x: 0, y: 0, time: 0 };
    touchCurrentRef.current = { x: 0, y: 0 };
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}

