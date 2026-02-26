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

interface StoryData {
  id: string
  title: string
  content: string
  created_at?: string
  topics?: Array<{ category: string; item: string }>
}

interface AppClientProps {
  children: React.ReactNode
  translations: any
}

export default function AppClient({ children, translations }: AppClientProps) {
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
      title: title || translations.app?.untitled || "無標題",
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
    
    setSharing(true)
    const result = await shareStory({
      title: title || translations.app?.untitled || "無標題",
      content: storyOutput,
      topics: selectedTopics,
      roles: characters
    })
    
    if (result.error) {
      setError(result.error)
    } else if (result.shareUrl) {
      await navigator.clipboard.writeText(result.shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
    setSharing(false)
  }
  
  const handleNew = () => {
    setStoryInput("")
    setStoryOutput("")
    setTitle("")
  }
  
  const togglePanel = () => {
    setPanelCollapsed(!isPanelCollapsed)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                NyxAI
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {translations.app?.tagline || "無審查 · 自由創作"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="text-slate-600 dark:text-slate-300"
              >
                <History className="h-4 w-4 mr-1" />
                {translations.app?.history || "歷史"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSave}
                disabled={!hasOutput || saving}
                className="text-slate-600 dark:text-slate-300"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? (translations.app?.saving || "儲存中...") : (translations.app?.save || "儲存")}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleShare}
                disabled={!hasOutput || sharing}
                className="text-slate-600 dark:text-slate-300"
              >
                <Share2 className="h-4 w-4 mr-1" />
                {shareCopied ? (translations.app?.copied || "已複製!") : (translations.app?.share || "分享")}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleNew}
                disabled={!hasOutput}
                className="text-slate-600 dark:text-slate-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                {translations.app?.new || "新建"}
              </Button>
              <Link href="/settings">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-600 dark:text-slate-300"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {translations.app?.settings || "設定"}
                </Button>
              </Link>
              <UserMenu 
                translations={translations} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Left sidebar */}
          <aside className={cn(
            "w-80 flex-shrink-0 transition-all duration-300",
            isPanelCollapsed && "w-0 overflow-hidden"
          )}>
            <div className="space-y-6">
              {/* Story input */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {translations.app?.storyStart || "劇情起點"}
                </label>
                <Textarea
                  placeholder={translations.app?.inputPlaceholder || "輸入你的劇情起點或靈感..."}
                  value={storyInput}
                  onChange={(e) => setStoryInput(e.target.value)}
                  className="min-h-[120px] resize-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleSaveDraft}
                >
                  {translations.app?.saveDraft || "儲存草稿"}
                </Button>
              </div>

              {/* Topic selector */}
              <TopicSelector translations={translations} />

              {/* Character manager */}
              <CharacterManager translations={translations} />
            </div>
          </aside>

          {/* Toggle button */}
          <button
            onClick={togglePanel}
            className="flex items-center justify-center w-6 h-12 -ml-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <Menu className={cn("h-4 w-4 transition-transform", isPanelCollapsed && "rotate-180")} />
          </button>

          {/* Main output area */}
          <main className="flex-1">
            <StoryOutput translations={translations} />
          </main>
        </div>
      </div>

      {/* History drawer */}
      <HistoryDrawer 
        open={historyOpen} 
        onOpenChange={setHistoryOpen}
        onSelectStory={handleLoadStory}
        translations={translations}
      />
    </div>
  )
}
