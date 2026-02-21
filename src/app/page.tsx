"use client"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
        
        <div className="relative z-10 max-w-3xl">
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              五秒開展故事
            </span>
          </h1>
          
          <p className="mb-8 text-lg text-slate-400 md:text-xl">
            進入 NyxAI — 無審查、自由創作的 AI 故事生成世界
          </p>
          
          <Button 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            onClick={() => window.location.href = '/app'}
          >
            開始創作
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="mt-16 flex gap-4 text-slate-500">
          <span>✨ 無審查</span>
          <span>🚀 立即生成</span>
          <span>🎭 自由創作</span>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-2 text-xl font-semibold text-blue-400">快速啟動</h3>
            <p className="text-slate-400">五秒內開始你的創作之旅</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-2 text-xl font-semibold text-purple-400">AI 驅動</h3>
            <p className="text-slate-400">強大 AI 讓故事無限延伸</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-2 text-xl font-semibold text-pink-400">完全自由</h3>
            <p className="text-slate-400">無限制的創作空間</p>
          </div>
        </div>
      </section>
    </main>
  )
}
