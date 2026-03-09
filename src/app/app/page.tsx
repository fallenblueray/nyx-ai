"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { officialTemplates } from "@/data/templates"
import type { Template } from "@/types/template"
import { useAppStore } from "@/store/useAppStore"
import { CharacterManager } from "@/components/CharacterManager"
import { PerspectiveSelector } from "@/components/PerspectiveSelector"
import { StoryOutput, GenerateButtons } from "@/components/StoryOutput"
import { HistoryDrawer } from "@/components/HistoryDrawer"
import { UserMenu } from "@/components/UserMenu"
import { TemplateSelector } from "@/components/TemplateSelector"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Menu, Save, History, Share2, Plus, Loader2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { saveStory, shareStory } from "@/app/actions/story"
import { useTranslation } from "@/components/TranslationContext"
import { RefreshCw, Users, BookOpen } from "lucide-react"

interface StoryData {
  id: string
  title: string
  content: string
  created_at?: string
}

export default function AppPage() {
  const translations = useTranslation() as { app?: Record<string, string> }
  const searchParams = useSearchParams()
  const { 
    isPanelCollapsed, 
    setPanelCollapsed, 
    storyInput, 
    setStoryInput,
    setStoryOutput,
    storyOutput,
    characters,
    setCharacters,
    setError,
    isGenerating,
    setSelectedTemplate,
    isGeneratingTemplate,
    setGeneratedOutline,
    selectedTemplate
  } = useAppStore()
  
  const [historyOpen, setHistoryOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [title, setTitle] = useState("")
  const [saved, setSaved] = useState(false)
  const [isRegeneratingCharacters, setIsRegeneratingCharacters] = useState(false)
  const [isRegeneratingOutline, setIsRegeneratingOutline] = useState(false)
  
  // ========== Phase 5: 從 URL 讀取模板參數 ==========
  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt')
    const templateId = searchParams.get('template')
    
    if (templateId && !storyInput) {
      // 查找模板
      const template = officialTemplates.find(t => t.id === templateId)
      if (template) {
        // 自動應用模板輸入
        const inputText = promptFromUrl || template.promptBuilder.baseScenario
        setStoryInput(inputText)
        
        // 記錄選中的模板（V5: Prompt Engine 使用）
        setSelectedTemplate(templateId)
        
        // 只有當沒有現有角色時才創建 URL 模板角色（避免覆蓋 AI 生成的角色）
        const currentState = useAppStore.getState()
        if (currentState.characters.length === 0 && template.characterConfig) {
          const char = {
            id: `${template.id}-char-${Date.now()}`,
            name: template.characterConfig.name,
            description: `${template.characterConfig.age}，${template.characterConfig.role}。${template.characterConfig.personality}。${template.characterConfig.appearance}`,
            traits: [template.characterConfig.role, ...(template.characterConfig.desireStyle ? template.characterConfig.desireStyle.split('、') : [])].filter(Boolean)
          }
          setCharacters([char])
        }
      }
    } else if (promptFromUrl && !storyInput) {
      setStoryInput(promptFromUrl)
    }
  }, [searchParams, setStoryInput, storyInput, setCharacters, setSelectedTemplate])
  
  const hasOutput = storyOutput.trim().length > 0
  
  const handleSaveDraft = () => {
    localStorage.setItem("nyx-ai-draft", storyInput)
    const t = translations as { app?: { draftSaved?: string } }
    alert(t.app?.draftSaved || "草稿已儲存！")
  }
  
  const handleLoadStory = (story: StoryData) => {
    setStoryOutput(story.content)
    setTitle(story.title || "")
  }
  
  const handleSave = async () => {
    if (!storyOutput) return
    
    setSaving(true)
    const result = await saveStory({
      title: title || "無標題",
      content: storyOutput,
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
    
    // 清空所有輸入內容
    setStoryInput("")
    useAppStore.getState().setCharacters([])
  }

  // ========== V6.6: 單獨刷新功能 ==========
  
  // 只換角色，保留現有劇情
  const handleRegenerateCharacters = async () => {
    if (!selectedTemplate) {
      setError("請先選擇一個模板")
      return
    }
    
    setIsRegeneratingCharacters(true)
    setError(null)
    
    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 1000000),
          mode: 'characters-only'
        })
      })
      
      if (!response.ok) throw new Error(`API ${response.status}`)
      
      const data = await response.json()
      if (!data.success || !data.data?.characters) throw new Error("生成失敗")
      
      const char1Text = data.data.characters.character1
      const char2Text = data.data.characters.character2
      
      // 更新角色
      const extractName = (text: string) => {
        const cleaned = text.replace(/^(?:角色[12][：:]?|[，。、\s]+)+/, '').trim()
        const match = cleaned.match(/^([^，,。\s]+)/)
        return match ? match[1].slice(0, 10) : '角色'
      }
      
      const cleanDesc = (text: string) => {
        return text.replace(/^(?:角色[12][：:]?|[，。、\s]+)+/, '').trim()
      }
      
      const storeCharacters = [
        {
          id: `char-${extractName(char1Text)}-${Date.now()}`,
          name: extractName(char1Text),
          description: cleanDesc(char1Text).slice(0, 100) + (char1Text.length > 100 ? '...' : ''),
          traits: ['角色一']
        },
        {
          id: `char-${extractName(char2Text)}-${Date.now()}`,
          name: extractName(char2Text),
          description: cleanDesc(char2Text).slice(0, 100) + (char2Text.length > 100 ? '...' : ''),
          traits: ['角色二']
        }
      ]
      
      setCharacters(storeCharacters)
      console.log('[Page] Characters regenerated')
      
    } catch (err) {
      console.error("[Page] Failed to regenerate characters:", err)
      setError("換角色失敗，請重試")
    } finally {
      setIsRegeneratingCharacters(false)
    }
  }
  
  // 只換劇情，保留現有角色
  const handleRegenerateOutline = async () => {
    if (!selectedTemplate) {
      setError("請先選擇一個模板")
      return
    }
    
    if (characters.length < 2) {
      setError("請先生成角色")
      return
    }
    
    setIsRegeneratingOutline(true)
    setError(null)
    
    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 1000000),
          mode: 'outline-only',
          existingCharacters: {
            character1: characters[0]?.description || '',
            character2: characters[1]?.description || ''
          }
        })
      })
      
      if (!response.ok) throw new Error(`API ${response.status}`)
      
      const data = await response.json()
      if (!data.success || !data.data?.outline) throw new Error("生成失敗")
      
      const outlineText = data.data.outline
      const template = officialTemplates.find(t => t.id === selectedTemplate)
      
      // 更新劇情
      const formattedOutline = `【模板：${template?.name || '自定義'}】

${outlineText || '故事即將開始...'}`
      
      setStoryInput(formattedOutline)
      setGeneratedOutline({ 
        beginning: outlineText.slice(0, 100) || '故事開始...',
        development: outlineText.slice(100, 200) || '',
        climax: outlineText.slice(200, 300) || '',
        preview: outlineText.slice(0, 50) || '精彩故事...'
      })
      
      console.log('[Page] Outline regenerated')
      
    } catch (err) {
      console.error("[Page] Failed to regenerate outline:", err)
      setError("換劇情失敗，請重試")
    } finally {
      setIsRegeneratingOutline(false)
    }
  }
  
  return (
    <main className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Top Bar */}
      <header className="nyx-header fixed top-0 left-0 right-0 h-14 border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPanelCollapsed(!isPanelCollapsed)}
            className="md:hidden nyx-text-muted hover:nyx-text-primary"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold nyx-text-primary">NyxAI</h1>
        </div>
        
        {/* 固定右側按鈕群 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="nyx-text-secondary hover:nyx-text-primary"
          >
            <History className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{translations.app?.history || "歷史"}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasOutput || saving}
            onClick={handleSave}
            className={cn(
              "nyx-text-secondary hover:nyx-text-primary",
              !hasOutput && "opacity-50 cursor-not-allowed"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            <span className="hidden sm:inline">{saved ? (translations.app?.saved || "已儲存") : (translations.app?.save || "儲存")}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasOutput || sharing}
            onClick={handleShare}
            className={cn(
              "nyx-text-secondary hover:nyx-text-primary",
              !hasOutput && "opacity-50 cursor-not-allowed"
            )}
          >
            {sharing || saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : shareCopied ? (
              <Share2 className="w-4 h-4 mr-1 text-green-500" />
            ) : (
              <Share2 className="w-4 h-4 mr-1" />
            )}
            <span className="hidden sm:inline">{shareCopied ? (translations.app?.copied || "已複製") : "分享"}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasOutput || isGenerating}
            onClick={handleNewStory}
            className={cn(
              "nyx-text-secondary hover:nyx-text-primary",
              !hasOutput && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{translations.app?.new || "新建"}</span>
          </Button>
          
          <Link href="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="nyx-text-secondary hover:nyx-text-primary"
              title={translations.app?.settings || "設定"}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Link>

          <UserMenu />
        </div>
      </header>
      
      <HistoryDrawer 
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadStory={handleLoadStory}
      />
      
      <div className="flex pt-14 min-h-screen">
        {/* 手機遮罩 */}
        {!isPanelCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setPanelCollapsed(true)}
          />
        )}
        <aside
          className={cn(
            "nyx-sidebar fixed left-0 top-14 bottom-0 w-80 border-r overflow-y-auto transition-transform duration-300 z-40",
            isPanelCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
          )}
        >
          <div className="p-4 space-y-4">
            {hasOutput && (
              <div className="space-y-2">
                <label className="text-sm font-medium nyx-text-secondary">
                  故事標題
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="輸入標題..."
                  className="nyx-input"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium nyx-text-secondary">
                {translations.app?.storyStart || "劇情起點"}
              </label>
              <TemplateSelector />
              {/* V5.2: 模板生成載入提示 */}
              {isGeneratingTemplate && (
                <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在生成角色與劇情大綱...</span>
                </div>
              )}
              <Textarea
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                placeholder={translations.app?.inputPlaceholder || "輸入你的劇情起點或靈感..."}
                className="min-h-[120px] nyx-input resize-none"
                disabled={isGeneratingTemplate}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="w-full nyx-border nyx-text-secondary hover:nyx-surface-2"
              >
                <Save className="w-4 h-4 mr-2" />
                {translations.app?.saveDraft || "儲存草稿"}
              </Button>
              
              {/* V6.6: 單獨刷新按鈕 */}
              {selectedTemplate && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateCharacters}
                    disabled={isRegeneratingCharacters || isRegeneratingOutline}
                    className="flex-1 nyx-border nyx-text-secondary hover:nyx-surface-2"
                    title="換角色（保留劇情）"
                  >
                    {isRegeneratingCharacters ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4 mr-1" />
                    )}
                    換角色
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateOutline}
                    disabled={isRegeneratingOutline || isRegeneratingCharacters || characters.length < 2}
                    className="flex-1 nyx-border nyx-text-secondary hover:nyx-surface-2"
                    title="換劇情（保留角色）"
                  >
                    {isRegeneratingOutline ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <BookOpen className="w-4 h-4 mr-1" />
                    )}
                    換劇情
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium nyx-text-secondary">
                {translations.app?.characterCard || "角色卡"}
              </label>
              <CharacterManager />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium nyx-text-secondary">
                敘述視角
              </label>
              <PerspectiveSelector />
            </div>
            
            <div className="pt-4 border-t nyx-border">
              <GenerateButtons />
            </div>
          </div>
        </aside>
        
        {/* Main Workspace */}
        <main className="flex-1 p-4 md:p-6 ml-0 md:ml-80">
          {/* 手機：面板關閉時全高；桌面：固定高度 */}
          <div className="h-[calc(100vh-5rem)] story-output-mobile">
            <StoryOutput />
          </div>
          
          {/* 手機版底部快速操作欄（面板收合時顯示） */}
          {isPanelCollapsed && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 nyx-header border-t px-4 py-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => setPanelCollapsed(false)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs"
              >
                ✍️ 設定故事
              </Button>
            </div>
          )}
        </main>
      </div>
    </main>
  )
}
