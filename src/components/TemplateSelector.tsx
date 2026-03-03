"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Plus, Trash2, BookOpen, Sparkles, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"

// 預設模板
export const PRESET_TEMPLATES = [
  {
    id: "preset-1",
    name: "霸道總裁",
    description: "冷酷總裁遇上倔強小秘書，辦公室的權力遊戲",
    storyInput: "她只是一個普通的助理，卻在一次加班時被總裁叫進辦公室...",
    topics: [{ category: "都市", subcategory: "", item: "辦公室" }, { category: "職業", subcategory: "", item: "上司" }],
    characters: [
      { id: "char-1", name: "冷傲天", description: "28歲，跨國集團總裁，冷酷霸道，對她卻有莫名的占有欲", traits: ["霸道", "冷酷", "占有欲強"] },
      { id: "char-2", name: "林小雅", description: "23歲，總裁助理，清純倔強，不願屈服於權勢", traits: ["清純", "倔強", "小白兔"] }
    ]
  },
  {
    id: "preset-2",
    name: "異世界後宮",
    description: "穿越異世界，成為龍傲天，收集各種族美女",
    storyInput: "我只是在玩遊戲時睡著了，醒來卻發現自己在一個陌生的房間，床上還躺著一個精靈族美少女...",
    topics: [{ category: "穿越", subcategory: "", item: "異世界轉生" }, { category: "幻想", subcategory: "", item: "龍族後宮" }],
    characters: [
      { id: "char-1", name: "艾莉婭", description: "精靈族公主，高傲但對主人絕對忠誠", traits: ["精靈", "高傲", "忠誠"] },
      { id: "char-2", name: "莉莉絲", description: "魅魔女僕，善於挑逗，總是想方設法誘惑主人", traits: ["魅魔", "淫蕩", "挑逗"] }
    ]
  },
  {
    id: "preset-3",
    name: "禁忌師生",
    description: "嚴厲教官與叛逆學生的秘密關係",
    storyInput: "軍訓結束那天，她故意留在教室等所有人都離開，因為她知道教官會來找她...",
    topics: [{ category: "禁忌", subcategory: "", item: "老師學生" }, { category: "職業", subcategory: "", item: "教官" }],
    characters: [
      { id: "char-1", name: "嚴鐵軍", description: "35歲，軍事教官，鐵血嚴厲，卻對她無法自拔", traits: ["嚴厲", "鐵血", "反差"] },
      { id: "char-2", name: "蘇可可", description: "19歲，大一新生，外表甜美內心叛逆，專門挑戰權威", traits: ["叛逆", "甜美", "誘惑"] }
    ]
  },
  {
    id: "preset-4",
    name: "鄰居誘惑",
    description: "隔壁搬來的美人妻，總是在陽台上對你微笑",
    storyInput: "新搬來的鄰居是個人妻，丈夫經常出差。每次我在陽台抽煙，她總會穿著睡衣出來晾衣服...",
    topics: [{ category: "禁忌", subcategory: "", item: "人妻" }, { category: "都市", subcategory: "", item: "鄰居誘惑" }],
    characters: [
      { id: "char-1", name: "王太太", description: "30歲，寂寞人妻，丈夫冷落，渴望被關注", traits: ["寂寞", "人妻", "主動"] }
    ]
  },
  {
    id: "preset-5",
    name: "醫院艷遇",
    description: "住院期間，美麗的護士小姐特別關照你",
    storyInput: "住院第三天，那位漂亮的護士又來查房了。這次她說要檢查一個特殊的地方...",
    topics: [{ category: "職業", subcategory: "", item: "護士" }, { category: "都市", subcategory: "", item: "醫生病人" }],
    characters: [
      { id: "char-1", name: "白小護", description: "26歲，護士，溫柔體貼，對病人有特殊的關懷方式", traits: ["護士", "溫柔", "體貼"] }
    ]
  }
]

interface StoryTemplate {
  id: string
  name: string
  description: string
  storyInput: string
  topics: Array<{ category: string; subcategory: string; item: string }>
  characters: Array<{ id: string; name: string; description: string; traits: string[] }>
}

export function TemplateSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"presets" | "saved">("presets")
  const [savedTemplates, setSavedTemplates] = useState<StoryTemplate[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveForm, setSaveForm] = useState({ name: "", description: "" })
  
  const { 
    setStoryInput, 
    setSelectedTopics, 
    characters, 
    addCharacter,
    storyInput,
    selectedTopics
  } = useAppStore()
  
  // 從 localStorage 載入儲存模板（只在客戶端執行）
  useEffect(() => {
    const saved = localStorage.getItem("nyx-ai-templates")
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load templates:", e)
      }
    }
  }, [])
  
  const handleApplyTemplate = (template: StoryTemplate) => {
    setStoryInput(template.storyInput)
    setSelectedTopics(template.topics)
    
    // 清除現有角色並添加模板角色
    template.characters.forEach(char => {
      addCharacter(char)
    })
    
    setIsOpen(false)
  }
  
  const handleSaveCurrent = () => {
    if (!storyInput.trim()) return
    
    const newTemplate: StoryTemplate = {
      id: `custom-${Date.now()}`,
      name: saveForm.name || "自定義模板",
      description: saveForm.description || "",
      storyInput,
      topics: selectedTopics,
      characters
    }
    
    const updated = [...savedTemplates, newTemplate]
    setSavedTemplates(updated)
    localStorage.setItem("nyx-ai-templates", JSON.stringify(updated))
    
    setShowSaveDialog(false)
    setSaveForm({ name: "", description: "" })
  }
  
  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id)
    setSavedTemplates(updated)
    localStorage.setItem("nyx-ai-templates", JSON.stringify(updated))
  }
  
  const templates = activeTab === "presets" ? PRESET_TEMPLATES : savedTemplates
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full nyx-border nyx-text-secondary hover:nyx-surface-2"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        套用模板
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="nyx-surface nyx-border nyx-text-primary max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" />
              故事模板
            </DialogTitle>
            <DialogDescription className="nyx-text-muted">
              選擇一個預設模板快速開始，或儲存當前設定為模板
            </DialogDescription>
          </DialogHeader>
          
          {/* 切換標籤 */}
          <div className="flex gap-2 border-b nyx-border pb-2">
            <Button
              variant={activeTab === "presets" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("presets")}
              className={activeTab === "presets" ? "bg-purple-600" : "nyx-text-muted"}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              預設模板
            </Button>
            <Button
              variant={activeTab === "saved" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("saved")}
              className={activeTab === "saved" ? "bg-purple-600" : "nyx-text-muted"}
            >
              <Save className="w-4 h-4 mr-1" />
              我的模板 ({savedTemplates.length})
            </Button>
          </div>
          
          {/* 儲存當前按鈕（只在「我的模板」頁顯示） */}
          {activeTab === "saved" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="w-full nyx-border nyx-text-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              儲存當前設定為模板
            </Button>
          )}
          
          {/* 模板列表 */}
          <div className="grid gap-3">
            {templates.map((template) => (
              <Card key={template.id} className="nyx-surface-2 nyx-border hover:border-purple-500/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm nyx-text-primary">{template.name}</CardTitle>
                      <p className="text-xs nyx-text-muted mt-1">{template.description}</p>
                    </div>
                    <div className="flex gap-1">
                      {activeTab === "saved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="h-7 w-7 p-0 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        套用
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs nyx-text-secondary line-clamp-2">{template.storyInput}</p>
                  {template.characters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.characters.map(char => (
                        <span key={char.id} className="text-xs px-1.5 py-0.5 nyx-surface-3 rounded nyx-text-muted">
                          {char.name}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 儲存模板對話框 */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="nyx-surface nyx-border nyx-text-primary">
          <DialogHeader>
            <DialogTitle>儲存模板</DialogTitle>
            <DialogDescription className="nyx-text-muted">
              為當前設定取個名字，方便下次使用
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm nyx-text-muted">模板名稱</label>
              <Input
                value={saveForm.name}
                onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                placeholder="例如：我的霸道總裁設定"
                className="nyx-input"
              />
            </div>
            <div>
              <label className="text-sm nyx-text-muted">描述（可選）</label>
              <Input
                value={saveForm.description}
                onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                placeholder="簡單描述這個模板的內容..."
                className="nyx-input"
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
    </>
  )
}
