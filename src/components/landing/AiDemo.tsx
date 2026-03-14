"use client";

import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const DEMO_STEPS = [
  "AI 正在構思角色...",
  "AI 正在設計情節...",
  "AI 正在寫第一段故事...",
  "AI 正在潤色文字...",
];

export function AiDemo() {
  const [loadingStep, setLoadingStep] = useState(0);
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOutput(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showOutput) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % DEMO_STEPS.length);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showOutput]);

  return (
    <section className="py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* 標題 */}
        <h2 className="text-center text-2xl font-bold text-white md:text-3xl">
          看看 AI 怎樣寫故事
        </h2>

        {/* 左右對比 */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 左側：輸入 */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-white/40">輸入</span>
            </div>
            <p className="text-base leading-relaxed text-white/80">
              「深夜加班，女上司突然鎖上了辦公室的門」
            </p>
          </div>

          {/* 右側：輸出 */}
          <div className="relative min-h-[160px] rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-black/40 p-5 backdrop-blur-sm">
            <div className="absolute right-3 top-3">
              <Badge className="border-purple-500/30 bg-purple-500/20 text-xs text-purple-300">
                AI 生成
              </Badge>
            </div>

            {!showOutput ? (
              <div className="flex h-full flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-400" />
                </div>
                <p className="mt-3 text-sm text-purple-300/80">
                  {DEMO_STEPS[loadingStep]}
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 text-sm leading-relaxed text-white/90">
                <p>她慢慢走到我面前。</p>
                <p className="mt-2">高跟鞋在地板上發出輕微的聲響。</p>
                <p className="mt-2">「今晚加班的人只剩你。」</p>
                <p className="mt-2">她靠近我耳邊，聲音低得像是在說一個秘密。</p>
                <p className="mt-2">「陪我多待一會，好嗎？」</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
