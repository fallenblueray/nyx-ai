"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-lg font-bold text-white/80">NyxAI</p>
            <p className="text-sm text-white/40">AI 故事生成平台</p>
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy" className="transition-colors hover:text-white/60">
              隱私政策
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white/60">
              服務條款
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-white/20">
          © 2026 NyxAI · 每天都有數萬篇 AI 故事在此誕生
        </p>
      </div>
    </footer>
  );
}
