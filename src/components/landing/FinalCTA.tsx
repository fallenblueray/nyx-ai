"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-20 px-4">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-white/70">免費開始</span>
        </div>

        <h2 className="mt-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          今晚開始你的第一篇故事
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-lg text-white/60">
          無需登入 · 立即免費體驗 8000 字
        </p>

        <div className="mt-8">
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
              <span>免費生成故事</span>
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-white/40">
          無需信用卡 · 無需註冊 · 8000 字免費
        </p>
      </div>
    </section>
  );
}
