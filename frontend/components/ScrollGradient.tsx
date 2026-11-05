"use client";

import { useEffect, useRef } from "react";

/** Background whose gradient hue drifts as the page scrolls. */
export default function ScrollGradient({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight || 1;
      ref.current?.style.setProperty("--p", String(Math.min(window.scrollY / max, 1)));
    };
    const onScroll = () => (frame ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{
        // hue sweeps blue (220) → purple (270) → pink (320) with scroll
        background:
          "linear-gradient(160deg, hsl(calc(220 + var(--p, 0) * 100) 90% 97%), hsl(calc(260 + var(--p, 0) * 60) 85% 93%))",
      }}
    >
      {children}
    </div>
  );
}
