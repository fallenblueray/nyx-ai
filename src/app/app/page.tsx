"use client"

import { useAppStore } from "@/store/useAppStore"
import { TopicSelector } from "@/components/TopicSelector"
import { CharacterManager } from "@/components/CharacterManager"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Menu, Save, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AppPage() {
  const { 
    isPanelCollapsed, 
    setPanelCollapsed, 
    storyInput, 
    setStoryInput 
  } = useAppStore()
  
  const handleSaveDraft = () => {
    localStorage.setItem("nyx-ai-draft", storyInput)
    alert("草稿已儲存！")
  }
  
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelCollapsed(!isPanelCollapsed)}
            className="md:hidden text-slate-400 hover:text-slate-200"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">NyxAI</h1>
          <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full border border-purple-600/30">
            無審查 · 自由創作
          </span>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Sparkles className="w-4 h-4 mr-2" />
          開始創作
        </Button>
      </header>
      
      <div className="flex pt-14 min-h-screen">
        {/* Left Panel */}
        {/* Overlay for mobile */}
        {!isPanelCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setPanelCollapsed(true)}
          />
        )}
        <aside
          className={cn(
            "fixed left-0 top-14 bottom-0 w-80 bg-slate-900 border-r border-slate-800 overflow-y-auto transition-transform duration-300 z-40",
            isPanelCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
          )}
        >
          <div className="p-4 space-y-6">
            {/* Story Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                劇情起點
              </label>
              <Textarea
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                placeholder="輸入你的劇情起點或靈感..."
                className="min-h-[120px] bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Save className="w-4 h-4 mr-2" />
                儲存草稿
              </Button>
            </div>
            
            {/* Topic Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                題材選擇
              </label>
              <TopicSelector />
            </div>
            
            {/* Character Manager */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                角色卡
              </label>
              <CharacterManager />
            </div>
          </div>
        </aside>
        
        {/* Main Workspace */}
        <main
          className="flex-1 p-6 ml-0 md:ml-80"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-500 mb-2">
                準備開始創作
              </h2>
              <p className="text-slate-600">
                在左側面板輸入劇情起點，選擇題材和角色
              </p>
            </div>
          </div>
        </main>
      </div>
    </main>
  )
}
