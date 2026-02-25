"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserDefaultTopics, saveUserDefaultTopics } from "@/app/actions/settings"

const POPULAR_TOPICS = [
  "女僕", "OL", "教師", "護士",
  "武俠", "異世界轉生", "末世生存",
  "辦公室", "校園師生", "制服誘惑",
  "人妻", "熟女", "NTR",
  "囚禁", "調教", "SM",
  "後宮", "末世", "科幻",
]

export function DefaultTopicsSelector() {
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getUserDefaultTopics().then((topics) => {
      setSelected(topics)
      setLoading(false)
    })
  }, [])

  function toggleTopic(topic: string) {
    setSelected((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await saveUserDefaultTopics(selected)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400">
        選擇預設題材（最多 6 個）
      </h3>
      <div className="flex flex-wrap gap-2">
        {POPULAR_TOPICS.map((topic) => {
          const isSelected = selected.includes(topic)
          const isDisabled = !isSelected && selected.length >= 6
          return (
            <Button
              key={topic}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              disabled={isDisabled}
              onClick={() => toggleTopic(topic)}
              className={cn(
                "text-xs",
                isSelected
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              )}
            >
              {topic}
            </Button>
          )
        })}
      </div>
      <p className="text-xs text-slate-500">
        已選 {selected.length}/6 個題材，會在生成時自動加入提示詞。
      </p>
      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-purple-600 hover:bg-purple-700"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4 mr-2" />
        ) : null}
        {saved ? "已儲存" : "儲存設定"}
      </Button>
    </div>
  )
}
