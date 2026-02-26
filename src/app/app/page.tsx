"use client"

import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { TopicSelector } from "@/components/TopicSelector"
import { CharacterManager } from "@/components/CharacterManager"
import { StoryOutput, GenerateButtons } from "@/components/StoryOutput"
import { HistoryDrawer } from "@/components/HistoryDrawer"
import { UserMenu } from "@/components/UserMenu"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Menu, Save, History, Share2, Plus, Loader2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { saveStory, shareStory } from "@/app/actions/story"
import { useTranslation } from "@/components/TranslationContext"

interface StoryData {
  id: string
  title: string
  content: string
  created_at?: string
  topics?: Array<{ category: string; item: string }>
}

export default function AppPage() {
  const translations = useTranslation()
  const { 
    isPanelCollapsed, 
    setPanelCollapsed, 
    storyInput, 
    setStoryInput,
    setStoryOutput,
    storyOutput,
    selectedTopics,
    characters,
    setError,
    isGenerating
  } = useAppStore()
  
  const [historyOpen, setHistoryOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [title, setTitle] = useState("")
  const [saved, setSaved] = useState(false)
  
  const hasOutput = storyOutput.trim().length > 0
  
  const handleSaveDraft = () => {
    localStorage.setItem("nyx-ai-draft", storyInput)
    alert(translations.app?.draftSaved || "草稿已儲存！")
  }
  
  const handleLoadStory = (story: StoryData) => {
    setStoryOutput(story.content)
    setTitle(story.title || "")
    if (story.topics) {
      // Load topics if needed
    }
  }
  
  const handleSave = async () => {
    if (!storyOutput) return
    
    setSaving(true)
    const result = await saveStory({
      title: title || "無標題",
      content: storyOutput,
      topics: selectedTopics,
      roles: characters
    })
    
    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }
  
  const handleShare = async () => {
    if (!storyOutput) return
    
    // First save the story
    setSaving(true)
    const saveResult = await saveStory({
      title: title || "無標題",
      content: storyOutput,
      topics: selectedTopics,
      roles: characters,
      is_public: true
    })
    
    if (saveResult.error) {
      setError(saveResult.error)
      setSaving(false)
      return
    }
    
    // Then share
    setSharing(true)
    const result = await shareStory(saveResult.story?.id || "")
    
    if (result.error) {
      setError(result.error)
    } else if (result.shareId) {
      const shareUrl = `${window.location.origin}/share/${result.shareId}`
      navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
    setSaving(false)
    setSharing(false)
  }
  
  const handleNewStory = () => {
    setStoryOutput("")
    setTitle("")
    setSaved(false)
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
            {translations.app?.tagline || "無審查 · 自由創作"}
          </span>
        </div>
        
        {/* 固定右側按鈕群 */}
        <div className="flex items-center gap-1">
          {/* 歷史按鈕 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="text-slate-300 hover:text-white"
          >
            <History className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{translations.app?.history || "歷史"}</span>
          </Button>
          
          {/* 儲存按鈕 */}
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasOutput || saving}
            onClick={handleSave}
            className={cn(
              "text-slate-300 hover:text-white",
              !hasOutput && "opacity-50 cursor-not-allowed"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            <span className="hidden sm:inline">{saved ? (translations.app?.saved || "已儲存") : "儲存"}</span>
          </Button>
          
          {/* 分享按鈕 */}
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasOutput || sharing}
            onClick={handleShare}
            className={cn(
              "text-slate-300 hover:text-white",
              !hasOutput && "opacity-50 cursor-not-allowed"
            )}
          >
            {sharing || saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : shareCopied ? (
              <Share2 className="w-4 h-4 mr-1 text-green-400" />
            ) : (
              <Share2 className="w-4 h-4 mr-1" />
            )}
            <span className="hidden sm:inline">{shareCopied ? (translations.app?.copied || "已複製") : "分享"}</span>
          </Button>
          
          {/* 新建按鈕 */}
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasOutput || isGenerating}
            onClick={handleNewStory}
            className={cn(
              "text-slate-300 hover:text-white",
              !hasOutput && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{translations.app?.new || "新建"}</span>
          </Button>
          
          {/* 設定按鈕 */}
          <Link href="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              title={translations.app?.settings || "設定"}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Link>

          {/* 登入/登出 */}
          <UserMenu />
        </div>
      </header>
      
      {/* History Drawer */}
      <HistoryDrawer 
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadStory={handleLoadStory}
      />
      
      <div className="flex pt-14 min-h-screen">
        {/* Left Panel */}
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
          <div className="p-4 space-y-4">
            {/* 標題輸入 - 永遠顯示 */}
            {hasOutput && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  故事標題
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="輸入標題..."
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>
            )}
            
            {/* Story Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {translations.app?.storyStart || "劇情起點"}
              </label>
              <Textarea
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                placeholder={translations.app?.inputPlaceholder || "輸入你的劇情起點或靈感..."}
                className="min-h-[120px] bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {translations.app?.saveDraft || "儲存草稿"}
              </Button>
            </div>
            
            {/* Topic Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {translations.app?.topicSelection || "題材選擇"}
              </label>
              <TopicSelector />
            </div>
            
            {/* Character Manager */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {translations.app?.characterCard || "角色卡"}
              </label>
              <CharacterManager />
            </div>
            
            {/* Generate Buttons - 固定在左側面板底部 */}
            <div className="pt-4 border-t border-slate-800">
              <GenerateButtons />
            </div>
          </div>
        </aside>
        
        {/* Main Workspace */}
        <main
          className="flex-1 p-4 md:p-6 ml-0 md:ml-80"
        >
          <div className="h-[calc(100vh-5rem)]">
            <StoryOutput />
          </div>
        </main>
      </div>
    </main>
  )
}
