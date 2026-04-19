"use client";

import { useEffect } from "react";

/**
 * Tracks the pointer and writes its position as CSS vars (--mx / --my)
 * onto every `.glass` element it intersects with. Paired with the
 * `.glass::after` radial-gradient in globals.css to produce an
 * Apple-style "light-you-hold" highlight.
 *
 * Cheap: one rAF-throttled listener, localCoords computed only for the
 * element the pointer is over.
 */
export function GlassLightTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    let last: { x: number; y: number } | null = null;
    let lastTarget: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!last) return;
        const el = document.elementFromPoint(last.x, last.y);
        const glass = el?.closest<HTMLElement>(".glass, .glass-strong");
        if (lastTarget && lastTarget !== glass) {
          lastTarget.style.removeProperty("--mx");
          lastTarget.style.removeProperty("--my");
        }
        if (glass) {
          const r = glass.getBoundingClientRect();
          const mx = ((last.x - r.left) / r.width) * 100;
          const my = ((last.y - r.top) / r.height) * 100;
          glass.style.setProperty("--mx", `${mx}%`);
          glass.style.setProperty("--my", `${my}%`);
        }
        lastTarget = glass ?? null;
      });
    };

    const onLeave = () => {
      if (lastTarget) {
        lastTarget.style.removeProperty("--mx");
        lastTarget.style.removeProperty("--my");
        lastTarget = null;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
