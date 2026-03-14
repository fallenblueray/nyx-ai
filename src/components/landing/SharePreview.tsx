"use client";

import { Share2, Download, Smartphone } from "lucide-react";

export function SharePreview() {
  return (
    <section className="py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* 標題 */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            一鍵分享你的故事
          </h2>
          <p className="mt-2 text-white/50">
            生成精美分享卡，支持 WhatsApp、X、微信
          </p>
        </div>

        {/* 分享卡預覽 */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
          {/* 手機 mockup */}
          <div className="relative">
            <div className="h-[400px] w-[220px] rounded-[2rem] border-4 border-white/20 bg-black p-2 shadow-2xl">
              <div className="h-full w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
                {/* 分享卡內容 */}
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <p className="text-xs text-white/80">NyxAI 故事</p>
                    <h3 className="mt-2 text-lg font-bold leading-tight text-white">
                      冷艷女上司
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/90">
                      「今晚加班的人只剩你。」
                      <br />
                      她靠近我耳邊，聲音低得像是在說一個秘密...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20" />
                    <span className="text-xs text-white/80">@nyxai_user</span>
                  </div>
                </div>
              </div>
            </div>
            {/* 裝飾 */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-purple-500/20 blur-xl" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-pink-500/20 blur-xl" />
          </div>

          {/* 功能說明 */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Share2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">WhatsApp 直接分享</h3>
                <p className="text-sm text-white/50">點擊直接打開 WhatsApp</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Smartphone className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">X/Twitter 分享</h3>
                <p className="text-sm text-white/50">一鍵跳轉發布推文</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Download className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">保存分享圖</h3>
                <p className="text-sm text-white/50">下載高清分享卡片</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
