"use client";

import { motion } from "framer-motion";

/**
 * ScoreRing — liquid-glass halo + animated stroke ring.
 * - Outer translucent glass disc as the "well"
 * - Faint track ring (5% white)
 * - Colored progress ring with glow
 * - Big mono number, tiny /100 suffix
 */
export function ScoreRing({
  score,
  size = 88,
  stroke = 5,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - stroke) / 2 - 2; // leave 2px breathing room for glow
  const c = 2 * Math.PI * r;
  const pct = clamped / 100;

  // Aurora palette with smoother thresholds
  const color =
    clamped >= 85
      ? "#00F5A0" // jade
      : clamped >= 70
      ? "#8B7FEA" // indigo
      : clamped >= 50
      ? "#FBBF24" // amber
      : "#F87171"; // rose

  const numberSize = size * 0.34;
  const suffixSize = size * 0.11;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Score ${Math.round(clamped)} out of 100`}
    >
      {/* Glass well */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px) saturate(140%)",
          WebkitBackdropFilter: "blur(12px) saturate(140%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 30px -12px rgba(0,0,0,0.6)",
        }}
      />
      {/* Colored glow halo */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(60% 60% at 50% 50%, ${color}26 0%, transparent 70%)`,
          filter: "blur(2px)",
        }}
      />

      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke="rgba(255,255,255,0.06)"
          fill="transparent"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}AA)` }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center leading-none">
          <span
            className="font-mono font-semibold tabular-nums"
            style={{
              fontSize: numberSize,
              color: "#fff",
              letterSpacing: "-0.02em",
              textShadow: `0 0 12px ${color}33`,
            }}
          >
            {Math.round(clamped)}
          </span>
          <span
            className="font-mono text-white/35 mt-0.5"
            style={{ fontSize: suffixSize, letterSpacing: "0.05em" }}
          >
            /100
          </span>
        </div>
      </div>
    </div>
  );
}
