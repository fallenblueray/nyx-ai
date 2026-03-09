"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Save, Plus, Trash2, Crown, Flame, Star, Search, X, User, Sparkles, Check, TrendingUp, Loader2 } from "lucide-react"
import { TrendingSection } from "./template/TrendingSection"
import { FavoritesSection } from "./template/FavoritesSection"
import { FavoriteButton } from "./template/FavoriteButton"
import { cn } from "@/lib/utils"
import { officialTemplates, CATEGORY_CONFIG } from "@/data/templates"
import type { Template, TemplateCategory } from "@/types/template"
import { buildSystemPromptFromTemplate, buildUserPromptFromTemplate } from "@/lib/prompt-builder"

// ========== 舊版相容類型（給 useAppStore 用）==========
interface LegacyTemplate {
  id: string
  name: string
  description: string
  storyInput: string
  characters: Array<{ id: string; name: string; description: string; traits: string[] }>
}

// ========== 模板轉換：新格式 → 舊格式（回填 store）==========
function convertToLegacy(template: Template, userInput?: string): LegacyTemplate {
  const char = template.characterConfig
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    storyInput: userInput || template.promptBuilder.baseScenario,
    characters: char ? [{
      id: `${template.id}-char`,
      name: char.name,
      description: `${char.age}，${char.role}。${char.personality}`,
      traits: [char.role, char.desireStyle.split('，')[0]]
    }] : []
  }
}

// ========== 分類標籤 ==========
function CategoryTab({
  label, emoji, active, onClick
}: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
        active
          ? "bg-[var(--accent)] text-[var(--surface)]"
          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

// ========== 模板卡片 ==========
function TemplateCard({
  template, onSelect, isFavorite, onToggleFavorite
}: {
  template: Template
  onSelect: (t: Template) => void
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border p-4 cursor-pointer transition-all duration-200",
        "bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border-[var(--border)] hover:border-[var(--accent-border)]"
      )}
      onClick={() => onSelect(template)}
    >
      {/* Premium 標識 */}
      {template.isPremium && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
          <Crown className="w-3 h-3 text-yellow-400" />
          <span className="text-xs text-yellow-400">高級</span>
        </div>
      )}

      {/* 收藏按鈕 */}
      <div className={cn(
        "absolute top-3 right-3 transition-all",
        template.isPremium && "right-16"
      )}>
        <FavoriteButton
          templateId={template.id}
          initialFavorited={isFavorite}
          size="sm"
          onToggle={(favorited) => onToggleFavorite(template.id)}
        />
      </div>

      {/* 內容 */}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] pr-8">{template.name}</h3>
      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{template.description}</p>

      {/* 角色名稱 */}
      {template.characterConfig && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
            {template.characterConfig.name} · {template.characterConfig.role}
          </span>
        </div>
      )}

      {/* 字數倍率 */}
      {template.wordCostMultiplier > 1 && (
        <p className="text-xs text-yellow-400/70 mt-1.5">
          消耗 {template.wordCostMultiplier}x 字數
        </p>
      )}

      {/* 套用按鈕（hover 顯示）*/}
      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-full text-xs py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
          套用此模板
        </button>
      </div>
    </div>
  )
}

// ========== Trending 區塊 ==========
const TRENDING_ITEMS = [
  { text: "女上司深夜叫我留下加班", category: "career" },
  { text: "鄰居人妻穿著睡衣敲門求助", category: "mature" },
  { text: "女老師的秘密補習課", category: "campus" },
  { text: "青梅竹馬突然告白了", category: "classic" },
  { text: "校花學姐主動找我聊天", category: "campus" },
  { text: "離婚少婦入住我家", category: "mature" },
]

// ========== 主組件 ==========
export function TemplateSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all' | 'favorite' | 'trending'>('all')
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [savedTemplates, setSavedTemplates] = useState<LegacyTemplate[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveForm, setSaveForm] = useState({ name: "", description: "" })
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false)

  // Load templates from API
  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setTemplates(data.data)
        }
      })
      .catch(err => console.error('[TemplateSelector] Failed to load templates:', err))
      .finally(() => setLoading(false))
  }, [])

  const {
    setStoryInput,
    addCharacter,
    setCharacters,
    storyInput,
    characters,
    setSelectedTemplate,
    setGeneratedCharacters,
    setGeneratedOutline,
    setIsGenerating,
    setError,
    setIsGeneratingTemplate
  } = useAppStore()

  // 載入收藏和儲存模板
  useEffect(() => {
    try {
      const favs = localStorage.getItem("nyx-template-favorites")
      const saved = localStorage.getItem("nyx-ai-templates")
      queueMicrotask(() => {
        if (favs) setFavorites(JSON.parse(favs))
        if (saved) setSavedTemplates(JSON.parse(saved))
      })
    } catch (e) { /* ignore */ }
  }, [])

  // 過濾模板
  const filteredTemplates = templates.filter(t => {
    if (!t.isActive) return false
    if (activeCategory === 'favorite') return favorites.includes(t.id)
    if (activeCategory === 'trending') return false // trending 在單獨區塊顯示
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return t.name.includes(q) || t.description.includes(q) || t.tags.some(tag => tag.includes(q))
    }
    return true
  })

  // ========== Phase 4: 角色卡預覽 ==========
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editedCharacter, setEditedCharacter] = useState<{
    name: string
    age: string
    personality: string
    appearance: string
    role: string
  } | null>(null)

  // V5.2: 統一的角色+大綱生成函數（所有模板使用）
  const generateCharactersAndOutlineUnified = async (template: Template) => {
    console.log('[TemplateSelector] V5.2: Generating characters and outline for:', template.id)
    setIsGeneratingCharacters(true)
    setIsGeneratingTemplate(true)
    setError(null)
    
    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          templateId: template.id,
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 1000000)
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[TemplateSelector] API error:", response.status, errorText)
        setError(`生成失敗 (${response.status})：${errorText.substring(0, 100)}`)
        setStoryInput(template.promptBuilder?.baseScenario || template.description)
        return
      }
      
      const data = await response.json()
      
      if (!data.success || !data.data) {
        console.warn("[TemplateSelector] Invalid response:", data)
        setError(data.error || "生成失敗，請重試")
        setStoryInput(template.promptBuilder?.baseScenario || template.description)
        return
      }
      
      // V6.0: 支持純文本格式
      const char1Text = data.data.characters.character1
      const char2Text = data.data.characters.character2
      const outlineText = data.data.outline
      
      // 驗證數據
      if (!char1Text || !char2Text) {
        console.error("[TemplateSelector] Invalid character data:", { char1Text, char2Text })
        setError("角色生成失敗，請重試")
        setStoryInput(template.promptBuilder?.baseScenario || template.description)
        return
      }
      
      // V6: 從描述文本提取名字用於ID
      const extractName = (text: string) => {
        // 清理開頭的標點和「角色1/2」等標記
        const cleaned = text.replace(/^(?:角色[12][：:]?|[，。、\s]+)+/, '').trim()
        const match = cleaned.match(/^([^，,。\s]+)/)
        return match ? match[1].slice(0, 10) : '角色'
      }
      
      // 寫入角色到 store（純文本描述）
      console.log('[TemplateSelector] V6 characters:', { char1Text, char2Text })
      
      // 清理角色描述（移除開頭標記）
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
      console.log('[TemplateSelector] Setting characters:', storeCharacters)
      setCharacters(storeCharacters)
      
      // 格式化大綱並寫入 storyInput (只顯示劇情大綱)
      const formattedOutline = `【模板：${template.name}】

${outlineText || '故事即將開始...'}`
      
      setStoryInput(formattedOutline)
      setGeneratedOutline({ 
        beginning: outlineText.slice(0, 100) || '故事開始...',
        development: outlineText.slice(100, 200) || '',
        climax: outlineText.slice(200, 300) || '',
        preview: outlineText.slice(0, 50) || '精彩故事...'
      })
      
      console.log('[TemplateSelector] V6: Characters and outline generated')
      
    } catch (err) {
      console.error("[TemplateSelector] Failed to generate:", err)
      setError("網絡錯誤，請檢查連接後重試")
      setStoryInput(template.promptBuilder?.baseScenario || template.description)
    } finally {
      setIsGeneratingCharacters(false)
      setIsGeneratingTemplate(false)
    }
  }
  
  // ========== V6.5: 單獨刷新功能 ==========
  
  // 只換角色，保留現有劇情
  const regenerateCharactersOnly = async () => {
    const templateId = useAppStore.getState().selectedTemplate
    if (!templateId) {
      setError("請先選擇一個模板")
      return
    }
    
    const template = templates.find(t => t.id === templateId)
    if (!template) {
      setError("找不到模板")
      return
    }
    
    console.log('[TemplateSelector] Regenerating characters only...')
    setIsGeneratingCharacters(true)
    setError(null)
    
    try {
      // 保存現有劇情
      const currentOutline = useAppStore.getState().storyInput
      
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          templateId: template.id,
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 1000000),
          mode: 'characters-only' // 告訴 API 只生成角色
        })
      })
      
      if (!response.ok) throw new Error(`API ${response.status}`)
      
      const data = await response.json()
      if (!data.success || !data.data?.characters) throw new Error("生成失敗")
      
      const char1Text = data.data.characters.character1
      const char2Text = data.data.characters.character2
      
      // 更新角色但保留原劇情
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
      console.log('[TemplateSelector] Characters regenerated, outline preserved')
      
    } catch (err) {
      console.error("[TemplateSelector] Failed to regenerate characters:", err)
      setError("換角色失敗，請重試")
    } finally {
      setIsGeneratingCharacters(false)
    }
  }
  
  // 只換劇情，保留現有角色
  const regenerateOutlineOnly = async () => {
    const templateId = useAppStore.getState().selectedTemplate
    if (!templateId) {
      setError("請先選擇一個模板")
      return
    }
    
    const template = templates.find(t => t.id === templateId)
    if (!template) {
      setError("找不到模板")
      return
    }
    
    const currentCharacters = useAppStore.getState().characters
    if (currentCharacters.length < 2) {
      setError("請先生成角色")
      return
    }
    
    console.log('[TemplateSelector] Regenerating outline only...')
    setIsGeneratingTemplate(true)
    setError(null)
    
    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          templateId: template.id,
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 1000000),
          mode: 'outline-only', // 告訴 API 只生成劇情
          // 傳入現有角色描述
          existingCharacters: {
            character1: currentCharacters[0]?.description || '',
            character2: currentCharacters[1]?.description || ''
          }
        })
      })
      
      if (!response.ok) throw new Error(`API ${response.status}`)
      
      const data = await response.json()
      if (!data.success || !data.data?.outline) throw new Error("生成失敗")
      
      const outlineText = data.data.outline
      
      // 只更新劇情，保留原角色
      const formattedOutline = `【模板：${template.name}】

${outlineText || '故事即將開始...'}`
      
      setStoryInput(formattedOutline)
      setGeneratedOutline({ 
        beginning: outlineText.slice(0, 100) || '故事開始...',
        development: outlineText.slice(100, 200) || '',
        climax: outlineText.slice(200, 300) || '',
        preview: outlineText.slice(0, 50) || '精彩故事...'
      })
      
      console.log('[TemplateSelector] Outline regenerated, characters preserved')
      
    } catch (err) {
      console.error("[TemplateSelector] Failed to regenerate outline:", err)
      setError("換劇情失敗，請重試")
    } finally {
      setIsGeneratingTemplate(false)
    }
  }

  // 套用模板（入口）- V5.2: 所有模板統一調用 AI 生成角色+大綱
  const handleSelectTemplate = async (template: Template) => {
    // 設置選中的模板 ID
    setSelectedTemplate(template.id)
    // 關閉選擇器
    setIsOpen(false)
    // 調用 AI 生成角色和大綱（所有模板都走這條路）
    await generateCharactersAndOutlineUnified(template)
  }

  // 套用 Trending
  const handleTrendingClick = (text: string) => {
    setStoryInput(text)
    setIsOpen(false)
  }

  // 切換收藏
  const handleToggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id]
    setFavorites(updated)
    localStorage.setItem("nyx-template-favorites", JSON.stringify(updated))
  }

  // 儲存當前設定
  const handleSaveCurrent = () => {
    if (!storyInput.trim()) return
    const newTemplate: LegacyTemplate = {
      id: `custom-${Date.now()}`,
      name: saveForm.name || "自定義模板",
      description: saveForm.description || "",
      storyInput,
      characters
    }
    const updated = [...savedTemplates, newTemplate]
    setSavedTemplates(updated)
    localStorage.setItem("nyx-ai-templates", JSON.stringify(updated))
    setShowSaveDialog(false)
    setSaveForm({ name: "", description: "" })
  }

  const handleDeleteSaved = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id)
    setSavedTemplates(updated)
    localStorage.setItem("nyx-ai-templates", JSON.stringify(updated))
  }

  const handleApplySaved = (template: LegacyTemplate) => {
    setStoryInput(template.storyInput)
    setCharacters([])
    template.characters.forEach(char => addCharacter(char))
    setIsOpen(false)
  }

  return (
    <>
      {/* 觸發按鈕 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full nyx-border nyx-text-secondary hover:nyx-surface-2"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        故事模板
      </Button>

      {/* 主對話框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="nyx-surface nyx-border nyx-text-primary max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-xl font-bold text-white">
              選擇故事模板
            </DialogTitle>
          </DialogHeader>

          {/* 搜索框 */}
          <div className="px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-white/40 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* 分類導航 */}
          <div className="px-6 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <CategoryTab label="全部" emoji="🔥" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
              <CategoryTab label="熱門" emoji="📈" active={activeCategory === 'trending'} onClick={() => setActiveCategory('trending')} />
              {CATEGORY_CONFIG.map(cat => (
                <CategoryTab
                  key={cat.id}
                  label={cat.name}
                  emoji={cat.emoji}
                  active={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                />
              ))}
              <CategoryTab
                label={`收藏 (${favorites.length})`}
                emoji="⭐"
                active={activeCategory === 'favorite'}
                onClick={() => setActiveCategory('favorite')}
              />
            </div>
          </div>

          {/* 主內容區 */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">

            {/* Trending & Favorites（只在全部頁顯示）*/}
            {activeCategory === 'all' && !searchQuery && (
              <>
                {/* 熱門模板區塊 */}
                <TrendingSection
                  onSelectTemplate={handleSelectTemplate}
                  limit={5}
                />
                
                {/* 我的收藏區塊 */}
                <FavoritesSection
                  onSelectTemplate={handleSelectTemplate}
                />
                
                {/* 舊版 Trending（保留作為快捷輸入）*/}
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2 flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    熱門話題
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_ITEMS.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleTrendingClick(item.text)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-white transition-all"
                      >
                        🔥 {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* 熱門分類頁 */}
            {activeCategory === 'trending' && !searchQuery && (
              <>
                <TrendingSection
                  onSelectTemplate={handleSelectTemplate}
                  limit={10}
                  className="mb-6"
                />
                <h3 className="text-sm font-semibold text-white/70 mb-3">更多熱門模板</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates
                    .filter(t => t.isActive)
                    .slice(0, 10)
                    .map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={handleSelectTemplate}
                        isFavorite={favorites.includes(template.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                </div>
              </>
            )}

            {/* 官方模板網格 */}
            {filteredTemplates.length > 0 ? (
              <div>
                {activeCategory === 'all' && !searchQuery && (
                  <h3 className="text-sm font-semibold text-white/70 mb-3">官方模板 ({filteredTemplates.length})</h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleSelectTemplate}
                      isFavorite={favorites.includes(template.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-white/40 py-8">
                {activeCategory === 'favorite' ? '還沒有收藏的模板' : '沒有找到相關模板'}
              </p>
            )}

            {/* 我的收藏模板 */}
            {savedTemplates.length > 0 && activeCategory === 'all' && !searchQuery && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white/70 flex items-center gap-1">
                    <Save className="w-4 h-4" />
                    我的模板 ({savedTemplates.length})
                  </h3>
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    儲存當前
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedTemplates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.name}</p>
                        <p className="text-xs text-white/40 truncate">{t.description || t.storyInput.slice(0, 30) + '...'}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => handleApplySaved(t)} className="text-xs px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors">套用</button>
                        <button onClick={() => handleDeleteSaved(t.id)} className="p-1 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 儲存按鈕（當沒有我的模板時） */}
            {savedTemplates.length === 0 && activeCategory === 'all' && !searchQuery && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/60 hover:border-white/30 text-sm transition-all"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                儲存當前設定為我的模板
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 儲存模板對話框 */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="nyx-surface nyx-border nyx-text-primary max-w-sm">
          <DialogHeader>
            <DialogTitle>儲存為我的模板</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-white/60">模板名稱</label>
              <Input
                value={saveForm.name}
                onChange={e => setSaveForm({ ...saveForm, name: e.target.value })}
                placeholder="例如：我的女上司設定"
                className="nyx-input mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-white/60">描述（可選）</label>
              <Input
                value={saveForm.description}
                onChange={e => setSaveForm({ ...saveForm, description: e.target.value })}
                placeholder="簡單描述..."
                className="nyx-input mt-1"
              />
            </div>
            <Button
              onClick={handleSaveCurrent}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={!saveForm.name.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phase 4: 角色卡預覽對話框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="nyx-surface nyx-border nyx-text-primary max-w-lg max-h-[90vh] overflow-y-auto">
          {previewTemplate && editedCharacter && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  預覽角色卡
                  {previewTemplate.isPremium && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      高級模板
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* 模板信息 */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-white">{previewTemplate.name}</h4>
                  <p className="text-xs text-white/50 mt-1">{previewTemplate.description}</p>
                </div>

                {/* 角色卡編輯區 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <User className="w-4 h-4" />
                    <span>角色設定（可編輯）</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/50">名字</label>
                      <Input
                        value={editedCharacter.name}
                        onChange={e => setEditedCharacter({ ...editedCharacter, name: e.target.value })}
                        className="nyx-input mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50">年齡</label>
                      <Input
                        value={editedCharacter.age}
                        onChange={e => setEditedCharacter({ ...editedCharacter, age: e.target.value })}
                        className="nyx-input mt-1 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50">身份 / 角色</label>
                    <Input
                      value={editedCharacter.role}
                      onChange={e => setEditedCharacter({ ...editedCharacter, role: e.target.value })}
                      className="nyx-input mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50">性格特質</label>
                    <Textarea
                      value={editedCharacter.personality}
                      onChange={e => setEditedCharacter({ ...editedCharacter, personality: e.target.value })}
                      rows={2}
                      className="nyx-input mt-1 text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50">外貌描述</label>
                    <Textarea
                      value={editedCharacter.appearance}
                      onChange={e => setEditedCharacter({ ...editedCharacter, appearance: e.target.value })}
                      rows={2}
                      className="nyx-input mt-1 text-sm resize-none"
                    />
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsPreviewOpen(false)}
                    className="flex-1 border-white/20 text-white/70 hover:bg-white/5"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={async () => {
                      if (previewTemplate) {
                        setIsPreviewOpen(false)
                        await generateCharactersAndOutlineUnified(previewTemplate)
                        // 如果用戶編輯了角色，更新第一個角色
                        if (editedCharacter) {
                          const currentChars = useAppStore.getState().characters
                          const updatedChars = [
                            {
                              id: `${previewTemplate.id}-char-${Date.now()}`,
                              name: editedCharacter.name,
                              description: `${editedCharacter.age}歲，${editedCharacter.role}。${editedCharacter.personality}。${editedCharacter.appearance}`,
                              traits: [editedCharacter.role]
                            },
                            ...currentChars.slice(1)
                          ]
                          setCharacters(updatedChars)
                        }
                      }
                    }}
                    disabled={isGeneratingCharacters}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                  >
                    {isGeneratingCharacters ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</>
                    ) : (
                      <><Check className="w-4 h-4 mr-2" />確認使用</>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ========== 向後相容：舊版 PRESET_TEMPLATES 導出 ==========
export const PRESET_TEMPLATES = officialTemplates.slice(0, 5).map(t => ({
  id: t.id,
  name: t.name,
  description: t.description,
  storyInput: t.promptBuilder.baseScenario,
  topics: [{ category: t.category, subcategory: "", item: t.name }],
  characters: t.characterConfig ? [{
    id: `${t.id}-char`,
    name: t.characterConfig.name,
    description: `${t.characterConfig.age}，${t.characterConfig.personality}`,
    traits: [t.characterConfig.role]
  }] : []
}))
