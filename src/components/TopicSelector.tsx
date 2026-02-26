"use client"

import { useState } from "react"
import { useAppStore, type Topic } from "@/store/useAppStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/components/TranslationContext"

// 題材數據（來自設計稿）
const TOPICS = [
  {
    category: "職業",
    items: ["女僕", "OL", "教師", "護士", "上司", "教官", "學生", "醫生", "記者", "特工", "應召女郎", "情侶"]
  },
  {
    category: "幻想",
    items: ["武俠", "魔女", "女騎士", "地牢冒險", "異世界轉生", "龍族後宮", "精靈奴隸", "末世生存", "魔法少女", "怪物觸手"]
  },
  {
    category: "都市",
    items: ["辦公室", "富豪玩物", "鄰居誘惑", "校園師生", "學園欺凌", "明星AV", "醫生病人", "警察罪犯", "健身房艷遇", "網紅直播", "職場復仇", "按摩店", "制服誘惑", "公車痴漢"]
  },
  {
    category: "禁忌",
    items: ["人妻", "熟女", "NTR", "綠帽", "輪姦", "上司", "寡婦", "離婚", "閨蜜", "老師學生", "醫護", "鄰居", "群P", "旅遊", "網戀", "母子", "姐弟", "兄妹"]
  },
  {
    category: "特殊",
    items: ["囚禁", "調教", "SM", "催眠", "強暴", "群交", "偷窺", "道具", "露出", "角色扮演", "媚藥"]
  },
  {
    category: "穿越",
    items: ["後宮", "末世", "遊戲", "歷史", "宮鬥", "科幻", "虛擬", "時間", "動物", "機器人", "平行宇宙"]
  },
]

export function TopicSelector() {
  const translations = useTranslation()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(0)
  const { selectedTopics, addTopic, removeTopic } = useAppStore()
  
  // 獲取翻譯後的分類名稱
  const getCategoryName = (category: string) => {
    return translations.topics?.[category] || category
  }
  
  // 過濾結果
  const filteredTopics = search
    ? TOPICS.map(cat => ({
        ...cat,
        items: cat.items.filter(item => 
          item.toLowerCase().includes(search.toLowerCase())
        )
      })).filter(cat => cat.items.length > 0)
    : TOPICS
  
  const isSelected = (item: string) => 
    selectedTopics.some(t => t.item === item)
  
  const toggleTopic = (item: string) => {
    const topic: Topic = {
      category: TOPICS[activeCategory].category,
      subcategory: "",
      item
    }
    if (isSelected(item)) {
      removeTopic(topic)
    } else {
      addTopic(topic)
    }
  }
  
  return (
    <div className="space-y-3">
      <Input
        placeholder={translations.app?.searchTopics || "搜尋題材..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
      />
      
      {/* 分類標籤 */}
      <div className="flex flex-wrap gap-1">
        {TOPICS.map((cat, idx) => (
          <Button
            key={cat.category}
            variant={activeCategory === idx ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory(idx)}
            className={cn(
              "text-xs",
              activeCategory === idx 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            {getCategoryName(cat.category)}
          </Button>
        ))}
      </div>
      
      {/* 題材列表 */}
      <div className="flex flex-wrap gap-2 min-h-[100px]">
        {filteredTopics[activeCategory]?.items.map((item) => (
          <Button
            key={item}
            variant={isSelected(item) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleTopic(item)}
            className={cn(
              "text-xs",
              isSelected(item)
                ? "bg-purple-600 hover:bg-purple-700"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            )}
          >
            {item}
          </Button>
        ))}
      </div>
      
      {/* 已選題材 */}
      {selectedTopics.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-2">{translations.app?.selected || "已選"}：</p>
          <div className="flex flex-wrap gap-1">
            {selectedTopics.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
              >
                {getCategoryName(t.category)}: {t.item}
                <button
                  onClick={() => removeTopic(t)}
                  className="text-slate-500 hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
