"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { DefaultTopicsSelector } from "@/components/DefaultTopicsSelector"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // 未登入 → 跳轉
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/app")}
            className="text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Settings className="w-5 h-5 text-slate-400" />
          <h1 className="text-lg font-semibold text-white">設定</h1>
        </div>
        <span className="text-sm text-slate-400">{session.user?.email}</span>
      </header>

      {/* Content */}
      <div className="pt-14 max-w-2xl mx-auto px-4 py-8">
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700 mb-6 w-full">
            <TabsTrigger
              value="theme"
              className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            >
              主題
            </TabsTrigger>
            <TabsTrigger
              value="language"
              className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            >
              語言
            </TabsTrigger>
            <TabsTrigger
              value="topics"
              className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            >
              預設題材
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <ThemeSwitcher />
            </div>
          </TabsContent>

          <TabsContent value="language">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <LanguageSwitcher />
            </div>
          </TabsContent>

          <TabsContent value="topics">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <DefaultTopicsSelector />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
