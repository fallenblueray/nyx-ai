"use client";

import FloatingLines from "@/components/floating-lines";
import { ParticleField } from "@/components/particle-field";
import {
  Hero,
  SceneCards,
  AiDemo,
  TrendingStoriesScroll,
  SharePreview,
  FinalCTA,
  Footer,
} from "@/components/landing";

const NYX_GRADIENT = ["#1e1b4b", "#3730a3", "#6d28d9", "#8b5cf6", "#a78bfa"];

export default function Home() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-slate-950">
      {/* Deep gradient overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 25%, rgba(79, 55, 180, 0.14) 0%, transparent 65%), radial-gradient(ellipse 50% 45% at 85% 75%, rgba(99, 48, 199, 0.08) 0%, transparent 55%), radial-gradient(ellipse 40% 35% at 15% 80%, rgba(59, 48, 163, 0.06) 0%, transparent 50%)",
        }}
      />

      {/* Animated Background Lines */}
      <div className="fixed inset-0 z-0">
        <FloatingLines
          linesGradient={NYX_GRADIENT}
          enabledWaves={["bottom", "middle", "top"]}
          lineCount={[5, 7, 4]}
          lineDistance={[7, 4, 9]}
          animationSpeed={0.6}
          interactive={true}
          bendRadius={4.0}
          bendStrength={-0.4}
          mouseDamping={0.04}
          parallax={true}
          parallaxStrength={0.12}
          mixBlendMode="screen"
        />
      </div>

      {/* Floating Particles */}
      <ParticleField />

      {/* Main Content */}
      <main className="relative z-10">
        {/* 1. Hero - 幻想入口 */}
        <Hero />

        {/* 2. 場景入口（核心轉化區） */}
        <SceneCards />

        {/* 3. AI 生成 Demo */}
        <AiDemo />

        {/* 4. 熱門故事（可滾動卡片） */}
        <TrendingStoriesScroll />

        {/* 5. 分享卡展示 */}
        <SharePreview />

        {/* 6. 最終 CTA */}
        <FinalCTA />

        {/* 7. Footer */}
        <Footer />
      </main>
    </div>
  );
}
