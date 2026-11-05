"use client";

import { useEffect, useRef } from "react";

// [left%, top%, size vw, hue, delay s]; sizes in vw so phones get the same look.
const PUFFS = [
  [-10, 5, 70, 230, 0],
  [55, 15, 60, 275, -4],
  [10, 45, 80, 300, -8],
  [60, 60, 65, 250, -12],
  [-5, 80, 75, 320, -6],
  [45, 95, 70, 265, -14],
] as const;

/** Soft smoke that drifts on its own and rises as the page scrolls. */
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
    <div ref={ref} className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50 to-purple-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ transform: "translateY(calc(var(--p, 0) * -25%))" }}
      >
        {PUFFS.map(([left, top, size, hue, delay], i) => (
          <span
            key={i}
            className="smoke-puff"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}vw`,
              height: `${size}vw`,
              background: `radial-gradient(circle, hsl(${hue} 85% 70% / 0.75), transparent 68%)`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
