import React, { useRef } from "react";

interface UseMonthSwipeOptions {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  enabled?: boolean;
}

function shouldIgnoreSwipeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  if (
    target.closest(
      'input, select, textarea, [contenteditable="true"], .recharts-wrapper, [role="dialog"], [data-no-swipe="true"]',
    )
  ) {
    return true;
  }

  let el: Element | null = target;
  while (el) {
    if (el.tagName === "TABLE") return true;
    const style = window.getComputedStyle(el);
    const overflowX = style.overflowX;
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 2
    ) {
      return true;
    }
    el = el.parentElement;
  }

  return false;
}

export function useMonthSwipe({
  year,
  month,
  onChange,
  enabled = true,
}: UseMonthSwipeOptions) {
  const startRef = useRef<{ x: number; y: number; ignored: boolean } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || e.touches.length !== 1) {
      startRef.current = null;
      return;
    }
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      ignored: shouldIgnoreSwipeTarget(e.target),
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!enabled || !startRef.current || startRef.current.ignored) {
      startRef.current = null;
      return;
    }
    if (e.changedTouches.length !== 1) {
      startRef.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    startRef.current = null;

    if (Math.abs(dx) <= 60) return;
    if (Math.abs(dx) <= 1.5 * Math.abs(dy)) return;

    if (dx < 0) {
      if (month >= 12) onChange(year + 1, 1);
      else onChange(year, month + 1);
    } else {
      if (month <= 1) onChange(year - 1, 12);
      else onChange(year, month - 1);
    }
  };

  const onTouchCancel = () => {
    startRef.current = null;
  };

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
