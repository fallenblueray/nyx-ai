"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ChevronRight, Sparkles, Wand2 } from "lucide-react";

export function Hero() {
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
    <section className="py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-sm font-medium text-white/70">
            AI 故事生成平台
          </span>
        </div>

        {/* Headline - 藍圖版 */}
        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          今晚想發生什麼故事？
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-4 max-w-lg text-lg text-white/60">
          選一個場景，AI 為你寫完整故事
        </p>

        {/* 即時輸入框 - 核心轉化點 */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-black/60 to-black/40 p-5 backdrop-blur-sm">
            <Input
              placeholder="深夜加班，女上司突然鎖上了辦公室的門..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-14 bg-black/40 border-2 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500/50 rounded-xl text-base"
            />
            <Button
              onClick={handleGenerate}
              disabled={!userPrompt.trim()}
              className="mt-4 h-12 w-full rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                color: "#FFFFFF",
              }}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              立即生成故事
            </Button>
          </div>
        </div>

        {/* 次 CTA */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link 
            href="#trending"
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            看看別人的故事 →
          </Link>
        </div>
      </div>
    </section>
  );
}
