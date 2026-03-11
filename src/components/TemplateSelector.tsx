"use client"

import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Save, Plus, Trash2, Search, X, Star, BookOpen, Sparkles } from "lucide-react"
import type { Template } from "@/types/template"
import { officialTemplates } from "@/data/templates"

interface SavedTemplate {
  id: string
  name: string
  description: string
  storyInput: string
  characters: Array<{
    id: string
    name: string
    description: string
    traits: string[]
  }>
}

export function TemplateSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveForm, setSaveForm] = useState({ name: "", description: "" })

  const {
    storyInput,
    setStoryInput,
    setCharacters,
    setSelectedTemplate,
    setGeneratedCharacters,
    setGeneratedOutline,
    setIsGeneratingTemplate,
    setError
  } = useAppStore()

  // 過濾模板
  const filteredTemplates = officialTemplates.filter(t => {
    if (!t.isActive) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return t.name.toLowerCase().includes(q) || 
             t.description.toLowerCase().includes(q) ||
             t.tags.some(tag => tag.includes(q))
    }
    return true
  })

  // 套用模板並生成角色+大綱
  const handleSelectTemplate = async (template: Template) => {
    console.log('[TemplateSelector] V5.2: Generating for:', template.id)
    
    setSelectedTemplate(template.id)
    setIsOpen(false)
    setIsGeneratingTemplate(true)
    setError(null)
    
    try {
      const uniqueSeed = Math.floor(Math.random() * 1000000)
      
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          templateId: template.id,
          timestamp: Date.now(),
          randomSeed: uniqueSeed
        })
      })
      
      if (!response.ok) {
        throw new Error(`API ${response.status}`)
      }
      
      const data = await response.json()
      if (!data.success || !data.data) {
        throw new Error(data.error || "生成失敗")
      }
      
      const char1Text = data.data.characters.character1
      const char2Text = data.data.characters.character2
      const outlineText = data.data.outline || data.data.openingScene
      
      // 解析角色文本
      const parseCharacter = (text: string) => {
        const cleanDesc = text.replace(/^(?:角色[12][：:]?|[，。、\s]+)+/, '').trim()
        const nameMatch = cleanDesc.match(/^([^，,。\s]+)/)
        return {
          name: nameMatch ? nameMatch[1].slice(0, 10) : '角色',
          description: cleanDesc.slice(0, 100) + (cleanDesc.length > 100 ? '...' : ''),
          traits: ['角色']
        }
      }
      
      // V7.1: 同時保存兩種格式的角色數據
      
      // 1. 簡單格式（給 CharacterManager 顯示）
      const storeCharacters = [
        { id: `char-${Date.now()}-1`, ...parseCharacter(char1Text), traits: ['角色一'] },
        { id: `char-${Date.now()}-2`, ...parseCharacter(char2Text), traits: ['角色二'] }
      ]
      setCharacters(storeCharacters)
      
      // 2. 完整格式（給 StoryOutput 使用）
      const parseFullCharacter = (text: string) => {
        const nameMatch = text.match(/^[^，,\s]+/)
        const name = nameMatch ? nameMatch[0].trim() : '角色'
        const ageMatch = text.match(/(\d{1,2})\s*[歲岁]/)
        const age = ageMatch ? ageMatch[1] : ''
        const roleMatch = text.match(/\d{1,2}\s*[歲岁]，([^，。]+)/)
        const role = roleMatch ? roleMatch[1].trim() : ''
        const personalityMatch = text.match(/[她他][是性格]*([^，。]{2,20})/)
        const personality = personalityMatch ? personalityMatch[1].trim() : text.slice(0, 50)
        const parts = text.split(/[，。]/).filter(p => p.trim())
        const appearance = parts.length > 2 ? parts[parts.length - 2].trim() : ''
        const desireStyle = parts.length > 1 ? parts[parts.length - 1].trim() : ''
        return { name, age, role, personality, appearance, desireStyle, traits: [role].filter(Boolean) }
      }
      
      const fullCharacters = [parseFullCharacter(char1Text), parseFullCharacter(char2Text)]
      console.log('[TemplateSelector] Setting generatedCharacters:', fullCharacters.map(c => c.name))
      setGeneratedCharacters(fullCharacters)
      
      // 格式化大綱並寫入 storyInput
      const formattedOutline = `【模板：${template.name}】

${outlineText || '故事即將開始...'}`
      
      setStoryInput(formattedOutline)
      
      // V7.1: 同時保存字符串格式的 outline（給 StoryOutput 使用）
      setGeneratedOutline(outlineText || '故事即將開始...')
      
      console.log('[TemplateSelector] V6: Characters and outline generated')
      
    } catch (err: any) {
      console.error("[TemplateSelector] Failed:", err)
      setError(err.message || "生成失敗，請重試")
      setStoryInput(template.promptBuilder?.baseScenario || template.description)
    } finally {
      setIsGeneratingTemplate(false)
    }
  }

  // 切換收藏
  const handleToggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id]
    setFavorites(updated)
    localStorage.setItem("nyx-template-favorites", JSON.stringify(updated))
  }

  return (
    <>
      {/* 觸發按鈕 */}
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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

          {/* 主內容區 */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border-[var(--border)] hover:border-[var(--accent-border)]"
                  onClick={() => handleSelectTemplate(template)}
                >
                  {/* Premium 標識 */}
                  {template.isPremium && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-yellow-400">高級</span>
                    </div>
                  )}

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

                  {/* 套用按（hover 顯示）*/}
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full text-xs py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
                      套用此模板
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TemplateSelector
