"use client";

import { useEffect, useRef, useState } from "react";

interface UseMorphOptions {
  /** Transition length in ms. Default 320. */
  duration?: number;
}

// easeInOutCubic — gentle acceleration/deceleration.
function ease(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Drives a morph progress value `t` in [0, 1] toward 1 when `active`, toward 0
 * when not. Animates from the current value on each flip (interruptible), and
 * snaps instantly when the user prefers reduced motion.
 */
export function useMorph(active: boolean, { duration = 320 }: UseMorphOptions = {}): number {
  const [t, setT] = useState(active ? 1 : 0);
  const tRef = useRef(t);
  tRef.current = t;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const target = active ? 1 : 0;

    if (prefersReducedMotion() || duration <= 0) {
      setT(target);
      return;
    }

    const from = tRef.current;
    if (from === target) return;

    let startTime: number | null = null;
    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const p = Math.min(1, (now - startTime) / duration);
      setT(from + (target - from) * ease(p));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, duration]);

  return t;
}
