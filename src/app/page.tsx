"use client";

import FloatingLines from "@/components/floating-lines";
import { ParticleField } from "@/components/particle-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronRight, Sparkles, Zap, BookOpen, Users, Clock, PenTool, Layers, Download, Play, Wand2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const NYX_GRADIENT = ["#1e1b4b", "#3730a3", "#6d28d9", "#8b5cf6", "#a78bfa"];

// 熱門題材數據
const HOT_TOPICS = [
  { title: "女上司", desc: "今晚加班的人只有你。", color: "from-purple-500/20 to-pink-500/20" },
  { title: "人妻誘惑", desc: "她望向我的眼神，帶著說不清的意味。", color: "from-rose-500/20 to-orange-500/20" },
  { title: "青梅竹馬", desc: "從小到大，我們之間總有些说不清。", color: "from-blue-500/20 to-cyan-500/20" },
  { title: "同學會重逢", desc: "多年不見，她變得不太一樣了。", color: "from-indigo-500/20 to-purple-500/20" },
  { title: "偶像邂逅", desc: "沒想到會在這裡遇見她。", color: "from-pink-500/20 to-rose-500/20" },
  { title: "鄰居姐姐", desc: "她總是在深夜才有空。", color: "from-amber-500/20 to-orange-500/20" },
  { title: "秘密戀情", desc: "這段關係，不能被任何人知道。", color: "from-red-500/20 to-pink-500/20" },
  { title: "酒店邂逅", desc: "電梯裡的偶遇改變了一切。", color: "from-violet-500/20 to-purple-500/20" },
];

// NyxAI 能力
const CAPABILITIES = [
  { icon: Zap, title: "輸入一句話生成完整故事", desc: "AI 自動延展劇情" },
  { icon: Layers, title: "AI 自動推進劇情", desc: "劇情自然流暢" },
  { icon: Users, title: "角色對話自然流暢", desc: "人物性格鮮明" },
  { icon: BookOpen, title: "預設題材與模板", desc: "熱門題材一鍵生成" },
  { icon: Clock, title: "保存歷史故事", desc: "隨時回顧續寫" },
];

// 3 步流程
const STEPS = [
  { step: "①", title: "輸入一句故事開頭", desc: "任何題材，任何風格" },
  { step: "②", title: "AI 生成完整故事", desc: "智能延展劇情" },
  { step: "③", title: "繼續創作你的劇情", desc: "隨心所欲發展" },
];

// 價格方案
const PRICING = [
  { words: "5萬字", price: "29.9", popular: false },
  { words: "10萬字", price: "39.9", popular: true },
  { words: "35萬字", price: "109", popular: false },
  { words: "100萬字", price: "249", popular: false },
  { words: "300萬字", price: "666", popular: false },
];

export default function Home() {
  const [demoInput] = useState("深夜加班時，女上司忽然鎖上辦公室的門");
  const [demoOutput] = useState(`她慢慢走向我桌前。

高跟鞋在地板上發出輕微的聲響。

「今晚加班的人只有你。」

她靠近我耳邊，聲音低得像是在說一個秘密。

「陪我多待一會，好嗎？」`);
  const [userPrompt, setUserPrompt] = useState("");

  const handleGenerate = () => {
    if (userPrompt.trim()) {
      window.location.href = `/app?prompt=${encodeURIComponent(userPrompt.trim())}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userPrompt.trim()) {
      handleGenerate();
    }
  };

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
          <div className="py-20 md:py-28 lg:py-36">
            <div className="relative mx-auto flex max-w-4xl flex-col px-6 lg:px-12">
              <div className="mx-auto max-w-3xl text-center">
                
                {/* Pill badge tagline */}
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/5 px-5 py-2 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-sm font-medium tracking-wider text-white/75">
                    每天都有數萬篇 AI 故事在 NyxAI 誕生
                  </span>
                </div>

                {/* Main headline - 藍圖優化版 */}
                <h1
                  className="mt-8 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem]"
                  style={{
                    color: "#FFFFFF",
                    textShadow: "0 4px 30px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  輸入一句話<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    AI 為你寫完整故事
                  </span>
                </h1>

                {/* Subheadline - 藍圖版 */}
                <div className="mx-auto mt-6 max-w-lg space-y-2">
                  <p className="text-pretty text-base leading-relaxed text-white/65 md:text-lg">
                    NyxAI 是一個 AI 故事生成器
                  </p>
                  <p className="text-pretty text-base leading-relaxed text-white/50 md:text-base">
                    輸入一句開頭，AI 立即生成完整劇情
                  </p>
                </div>

                {/* CTA Buttons - 藍圖版 */}
                <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
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
                      <span className="text-nowrap">立即免費開始</span>
                      <ChevronRight className="ml-1 h-5 w-5" />
                    </Link>
                  </Button>
                </div>

                {/* 即開即用提示 - 藍圖版 */}
                <p className="mt-4 text-sm font-medium text-white/50">
                  無需登入 · 立即免費體驗 8000 字
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 即時生成示例（轉化核心）==================== */}
        <section className="relative z-10 py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-3">
              看看 AI 怎樣寫故事
            </h2>
            <p className="text-center text-white/50 mb-10 max-w-xl mx-auto">
              輸入一句開場，AI 自動生成沉浸式劇情
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 左側：輸入 */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-sm text-white/40">輸入</span>
                </div>
                <div className="text-white/80 text-base leading-relaxed font-medium">
                  「{demoInput}」
                </div>
              </div>
              
              {/* 右側：生成 */}
              <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-black/40 p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    AI 生成
                  </Badge>
                </div>
                <div className="text-white/90 text-base leading-relaxed whitespace-pre-line font-mono">
                  {demoOutput}
                </div>
              </div>
            </div>
            
            {/* 即時輸入區 - 最強轉化點 */}
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-black/60 to-black/40 p-6 backdrop-blur-sm">
                <label className="block text-sm font-medium text-white/70 mb-3">
                  輸入一句故事開頭
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="text"
                    placeholder="例如：深夜加班時，女上司忽然鎖上辦公室的門..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-12 bg-black/40 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl"
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={!userPrompt.trim()}
                    className="h-12 px-8 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                      color: "#FFFFFF",
                    }}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    立即生成
                  </Button>
                </div>
                <p className="mt-3 text-xs text-white/40">
                  按下 Enter 或點擊按鈕，立即跳轉生成故事
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 熱門故事題材 ==================== */}
        <section className="relative z-10 py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-3">
              熱門故事題材
            </h2>
            <p className="text-center text-white/50 mb-10">
              點擊進入，自動填寫提示詞
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HOT_TOPICS.map((topic, idx) => (
                <Link
                  key={idx}
                  href={`/app?topic=${encodeURIComponent(topic.title)}&prompt=${encodeURIComponent(topic.desc)}`}
                  className="group"
                >
                  <div className={`rounded-xl border border-white/10 bg-gradient-to-br ${topic.color} p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:scale-[1.02] h-full`}>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      「{topic.desc}」
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== NyxAI 的能力 ==================== */}
        <section className="relative z-10 py-16 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
              NyxAI 可以做到
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAPABILITIES.map((cap, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm"
                >
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <cap.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {cap.title}
                    </h3>
                    <p className="text-sm text-white/50">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 使用流程（簡單）==================== */}
        <section className="relative z-10 py-16 px-4 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
              3 步開始創作
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative group"
                >
                  <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm text-center">
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

        {/* ==================== 免費體驗區 ==================== */}
        <section className="relative z-10 py-20 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-6 px-4 py-1.5">
              <Zap className="w-4 h-4 mr-1.5" />
              免費開始
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              免費開始你的第一篇故事
            </h2>
            <p className="text-white/60 mb-2 text-lg">
              每位用戶可免費生成約 8000 字故事
            </p>
            <p className="text-white/40 mb-8">
              打開即用 · 無需登入
            </p>
            
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full px-12 text-base font-semibold transition-all duration-300 hover:scale-[1.04] shadow-xl shadow-purple-500/30"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                color: "#FFFFFF",
              }}
            >
              <Link href="/app">
                <span>立即免費開始</span>
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ==================== 價格區 ==================== */}
        <section className="relative z-10 py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-3">
              字數充值
            </h2>
            <p className="text-center text-white/50 mb-10 text-sm">
              小字：首次充值半價
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {PRICING.map((plan, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl border p-5 text-center transition-all duration-300 ${
                    plan.popular
                      ? "border-purple-500/50 bg-purple-900/10"
                      : "border-white/10 bg-black/40 hover:border-white/20"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-purple-500 text-white border-0 text-xs">
                        最受歡迎
                      </Badge>
                    </div>
                  )}
                  <div className="text-2xl font-bold text-white mb-1">
                    {plan.words}
                  </div>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
                    ¥{plan.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 最後 CTA ==================== */}
        <section className="relative z-10 py-20 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              今晚開始你的第一篇故事
            </h2>
            
            <Button
              asChild
              size="lg"
              className="h-16 rounded-full px-14 text-lg font-semibold transition-all duration-300 hover:scale-[1.04] shadow-2xl shadow-purple-500/40"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                color: "#FFFFFF",
              }}
            >
              <Link href="/app">
                <span>免費生成故事</span>
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
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-lg font-bold text-white/80">NyxAI</p>
                <p className="text-sm text-white/40">AI Story Generator</p>
              </div>
              <div className="flex gap-6 text-sm text-white/40">
                <Link href="/privacy" className="hover:text-white/60 transition-colors">
                  隱私政策
                </Link>
                <Link href="/terms" className="hover:text-white/60 transition-colors">
                  服務條款
                </Link>
              </div>
            </div>
            <p className="text-xs text-white/20 text-center mt-6">
              © 2026 NyxAI · 每天都有數萬篇 AI 故事在此誕生
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
