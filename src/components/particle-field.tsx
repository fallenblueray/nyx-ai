/* eslint-disable */
"use client";

import { useMemo } from "react";

export function ParticleField() {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ // eslint-disable-line
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 15 + 12,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.1,
  })), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="animate-float-particle absolute rounded-full bg-primary/40"
          style={{
            left: p.left,
            bottom: "-4px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            ["--duration" as string]: `${p.duration}s`,
            ["--delay" as string]: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
