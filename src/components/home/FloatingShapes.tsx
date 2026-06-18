"use client";

import { useMemo } from "react";

const GRADIENT_COLORS = [
  ["#ff6b6b", "#feca57"],   // red → yellow
  ["#48dbfb", "#0abde3"],   // light blue → cyan
  ["#ff9ff3", "#f368e0"],   // pink → magenta
  ["#54a0ff", "#2e86de"],   // blue → dark blue
  ["#5f27cd", "#341f97"],   // purple → deep purple
  ["#1dd1a1", "#10ac84"],   // mint → green
  ["#ff6348", "#ee5a24"],   // orange → red-orange
  ["#ffc048", "#ff9f43"],   // gold → amber
  ["#a29bfe", "#6c5ce7"],   // lavender → violet
  ["#00cec9", "#00b894"],   // teal → emerald
];

interface Shape {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
  type: "circle" | "square" | "triangle";
  gradient: [string, string];
  gradientId: string;
}

// Deterministic pseudo-random generator (mulberry32).
// Seeded randomness keeps server and client renders identical (no hydration
// mismatch) and satisfies React's purity rules, unlike Math.random().
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FloatingShapes() {
  const shapes = useMemo<Shape[]>(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: rand() * 60 + 20,
      left: rand() * 100,
      delay: rand() * 8,
      duration: rand() * 10 + 15,
      opacity: rand() * 0.25 + 0.15,
      type: (["circle", "square", "triangle"] as const)[i % 3],
      gradient: GRADIENT_COLORS[Math.floor(rand() * GRADIENT_COLORS.length)] as [string, string],
      gradientId: `grad-${i}`,
    }));
  }, []);

  if (shapes.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-0 h-0">
        <defs>
          {shapes.map((shape) => (
            <linearGradient
              key={shape.gradientId}
              id={shape.gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={shape.gradient[0]} />
              <stop offset="100%" stopColor={shape.gradient[1]} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute animate-[float_linear_infinite]"
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.left}%`,
            bottom: "-10%",
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
            opacity: shape.opacity,
          }}
        >
          {shape.type === "circle" && (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill={`url(#${shape.gradientId})`}
                opacity="0.6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={`url(#${shape.gradientId})`}
                strokeWidth="3"
              />
            </svg>
          )}
          {shape.type === "square" && (
            <svg viewBox="0 0 100 100" className="w-full h-full rotate-45">
              <rect
                x="10"
                y="10"
                width="80"
                height="80"
                rx="12"
                fill={`url(#${shape.gradientId})`}
                opacity="0.6"
              />
              <rect
                x="10"
                y="10"
                width="80"
                height="80"
                rx="12"
                fill="none"
                stroke={`url(#${shape.gradientId})`}
                strokeWidth="3"
              />
            </svg>
          )}
          {shape.type === "triangle" && (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon
                points="50,5 95,95 5,95"
                fill={`url(#${shape.gradientId})`}
                opacity="0.6"
              />
              <polygon
                points="50,5 95,95 5,95"
                fill="none"
                stroke={`url(#${shape.gradientId})`}
                strokeWidth="3"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
