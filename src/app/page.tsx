"use client";

import FloatingLines from "@/components/floating-lines";
import { ParticleField } from "@/components/particle-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronRight, Sparkles, Zap, BookOpen, Users, Clock, PenTool, Layers, Download } from "lucide-react";

const NYX_GRADIENT = ["#1e1b4b", "#3730a3", "#6d28d9", "#8b5cf6", "#a78bfa"];

// Feature 數據
const FEATURES = [
  {
    icon: Zap,
    title: "⚡ 一句生成故事",
    bullets: [
      "輸入一句話即可開始",
      "AI 自動延展完整劇情",
      "5 秒內展開故事"
    ],
    color: "text-yellow-400"
  },
  {
    icon: Layers,
    title: "📚 海量題材 + 模板",
    bullets: [
      "多種預設成人題材",
      "熱門故事模板可選",
      "支援自定劇情方向"
    ],
    color: "text-purple-400"
  },
  {
    icon: Users,
    title: "🎭 角色卡系統",
    bullets: [
      "建立專屬人物設定",
      "持續延伸劇情發展",
      "登入後可保存成長"
    ],
    color: "text-blue-400"
  },
  {
    icon: PenTool,
    title: "🔓 無需登入體驗",
    bullets: [
      "立即獲得 8000 字",
      "打開即創作",
      "註冊後可保存歷史"
    ],
    color: "text-green-400"
  },
  {
    icon: Clock,
    title: "🕒 歷史記錄保存",
    bullets: [
      "隨時回顧與續寫",
      "支援下載分享",
      "作品永久保存"
    ],
    color: "text-pink-400"
  },
  {
    icon: Download,
    title: "📥 Word 導出",
    bullets: [
      "一鍵導出 Word 文檔",
      "格式完整保留",
      "方便存檔與分享"
    ],
    color: "text-cyan-400"
  }
];

// 3 步流程
const STEPS = [
  { step: "①", title: "輸入一句靈感", desc: "任何題材，任何風格" },
  { step: "②", title: "選擇 1–3 段生成", desc: "預設 3 段，沉浸體驗" },
  { step: "③", title: "即刻展開沉浸式劇情", desc: "AI 自動延展完整故事" }
];

export default function Home() {
  return (
    <div className="relative min-h-dvh w-full bg-slate-950 overflow-hidden">
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

      {/* ==================== HERO SECTION ==================== */}
      <main className="relative z-10 overflow-x-hidden">
        <section>
          <div className="py-24 md:py-32 lg:py-40">
            <div className="relative mx-auto flex max-w-4xl flex-col px-6 lg:px-12">
              <div className="mx-auto max-w-3xl text-center">
                
                {/* Pill badge tagline */}
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/5 px-5 py-2 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-sm font-medium tracking-wider text-white/75">
                    夜色AI · 無限制 AI 劇情生成
                  </span>
                </div>

                {/* Main headline - 優化版本 */}
                <h1
                  className="mt-8 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.5rem]"
                  style={{
                    color: "#FFFFFF",
                    textShadow: "0 4px 30px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  一句話，立即展開你的專屬劇情。
                </h1>

                {/* Subheadline */}
                <div className="mx-auto mt-6 max-w-lg space-y-1">
                  <p className="text-pretty text-base leading-relaxed text-white/65 md:text-lg">
                    專為成人打造的 AI 劇情生成平台。
                  </p>
                </div>

                {/* 🔥 8000 字免費標籤 */}
                <div className="mt-8 flex justify-center">
                  <Badge 
                    className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white border-0 px-6 py-2 text-base font-bold shadow-lg shadow-orange-500/25 animate-pulse"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    無需登入，立即獲得 8000 字免費創作額度
                  </Badge>
                </div>

                {/* CTAs - 強化版本 */}
                <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 rounded-full px-10 text-base font-semibold transition-all duration-300 hover:scale-[1.04] shadow-lg shadow-purple-500/30"
                    style={{
                      background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                      color: "#FFFFFF",
                    }}
                  >
                    <Link href="/app">
                      <span className="text-nowrap">🔥 立即免費生成</span>
                      <ChevronRight className="ml-1 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-14 rounded-full border border-white/[0.1] bg-white/5 px-10 text-base font-medium text-white/70 backdrop-blur-lg transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white/90"
                  >
                    <Link href="/app">
                      <span className="text-nowrap">直接體驗 8000 字</span>
                    </Link>
                  </Button>
                </div>

                {/* 即開即用提示 */}
                <p className="mt-4 text-sm font-medium text-white/50">
                  ⚡ 打開即用 · 無需註冊
                </p>

                {/* 社會證明 - 強化 */}
                <div className="mt-6 flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex -space-x-2">
                      {[0.7, 0.6, 0.5, 0.55, 0.65].map((opacity, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full border-2 border-slate-950"
                          style={{
                            background: `linear-gradient(135deg, rgba(${120 + i * 20}, ${60 + i * 15}, ${220 + i * 10}, ${opacity}), rgba(${80 + i * 30}, ${40 + i * 20}, ${180 + i * 15}, ${opacity}))`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-white/60">
                      <span className="font-bold text-white">已生成數萬篇</span> 沉浸式故事
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 3 步流程區 ==================== */}
        <section className="relative z-10 py-16 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
              🚀 3 步開始創作
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative group"
                >
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm text-center transition-all duration-300 group-hover:bg-white/[0.06] group-hover:border-white/20">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/50">
                      {item.desc}
                    </p>
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-white/20">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FEATURES SECTION - 2欄高密度 ==================== */}
        <section className="relative z-10 py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-4">
              強大功能，沉浸創作
            </h2>
            <p className="text-center text-white/50 mb-10 max-w-2xl mx-auto">
              專為成人內容優化的 AI 故事生成平台
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURES.map((feature, idx) => (
                <div 
                  key={idx}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg bg-white/5 ${feature.color}`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <ul className="space-y-1">
                        {feature.bullets.map((bullet, bidx) => (
                          <li key={bidx} className="text-sm text-white/50 flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5">•</span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 轉化推動區 ==================== */}
        <section className="relative z-10 py-20 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xl md:text-2xl font-medium text-white/80 mb-2">
              你的故事還未結束。
            </p>
            <p className="text-white/50 mb-8">
              超過 23,000+ 篇故事已在此誕生
            </p>
            
            <Button
              asChild
              size="lg"
              className="h-16 rounded-full px-12 text-lg font-semibold transition-all duration-300 hover:scale-[1.04] shadow-xl shadow-purple-500/30"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                color: "#FFFFFF",
              }}
            >
              <Link href="/app">
                <span>🔥 立即開始創作</span>
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <p className="mt-4 text-sm text-white/40">
              無需信用卡 · 無需註冊 · 8000 字免費
            </p>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="relative z-10 py-8 px-4 border-t border-white/5">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm text-white/30">
              © 2026 NyxAI · 夜色AI · 無限制 AI 劇情生成平台
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
