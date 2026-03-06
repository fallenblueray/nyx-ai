"use client"

/**
 * 記憶層設定 UI
 * 讓用戶查看、調整、重置 AI 學習到的偏好
 */
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Brain, RotateCcw, Check, Loader2, BookOpen, Palette, AlignLeft
} from "lucide-react"
import { updatePreferredStyles, updatePreferredWordLength, updateStyleNotes, resetPreferences } from "@/app/actions/preferences"
import { updatePreferredTheme } from "@/app/actions/preferences-theme"
import type { UserPreferences } from "@/app/actions/preferences"
import { ThemeSelector } from "./ThemeSelector"
import { cn } from "@/lib/utils"

const STYLE_OPTIONS = [
  { id: "romantic", label: "浪漫" },
  { id: "dark", label: "黑暗" },
  { id: "action", label: "動作" },
  { id: "slow_burn", label: "慢熱" },
  { id: "explicit", label: "露骨" },
  { id: "fantasy", label: "奇幻" },
  { id: "modern", label: "現代" },
  { id: "dominant", label: "支配" },
]

const WORD_LENGTH_OPTIONS = [
  { value: 500, label: "短篇 (~500字)" },
  { value: 1000, label: "中篇 (~1000字)" },
  { value: 2000, label: "長篇 (~2000字)" },
  { value: 3000, label: "超長 (~3000字)" },
]

interface MemorySettingsProps {
  initialPreferences: UserPreferences
}

export function MemorySettings({ initialPreferences }: MemorySettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    initialPreferences.preferred_styles || []
  )
  const [wordLength, setWordLength] = useState<number>(
    initialPreferences.preferred_word_length || 1000
  )
  const [selectedTheme, setSelectedTheme] = useState<string>(
    initialPreferences.preferred_theme || 'midnight-passion'
  )
  const [styleNotes, setStyleNotes] = useState(
    initialPreferences.writing_style_notes || ""
  )

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId)
    startTransition(async () => {
      await updatePreferredTheme(themeId)
      showSaved("主題偏好已更新")
    })
  }

  const showSaved = (msg: string) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(null), 2000)
  }

  const toggleStyle = (styleId: string) => {
    const next = selectedStyles.includes(styleId)
      ? selectedStyles.filter(s => s !== styleId)
      : [...selectedStyles, styleId]
    setSelectedStyles(next)

    startTransition(async () => {
      await updatePreferredStyles(next)
      showSaved("風格偏好已更新")
    })
  }

  const handleWordLength = (length: number) => {
    setWordLength(length)
    startTransition(async () => {
      await updatePreferredWordLength(length)
      showSaved("字數偏好已更新")
    })
  }

  const handleStyleNotes = () => {
    startTransition(async () => {
      await updateStyleNotes(styleNotes)
      showSaved("個性化指令已儲存")
    })
  }

  const handleReset = () => {
    if (!confirm("確定要清除所有 AI 記憶嗎？這不可復原。")) return
    startTransition(async () => {
      await resetPreferences()
      setSelectedStyles([])
      setWordLength(1000)
      setStyleNotes("")
      showSaved("記憶已清除")
    })
  }

  const { total_stories_generated, total_words_generated } = initialPreferences

  return (
    <div className="space-y-6">
      {/* 統計摘要 */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[var(--text-primary)] flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-purple-400" />
            AI 記憶摘要
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)] text-sm">
            AI 透過你的創作歷史自動學習偏好
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{total_stories_generated}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">已生成故事</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{total_words_generated.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">累計生成字數</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{selectedStyles.length}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">設定風格偏好</p>
          </div>
        </CardContent>
      </Card>

      {/* 風格偏好 */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[var(--text-primary)] flex items-center gap-2 text-base">
            <Palette className="w-4 h-4 text-blue-400" />
            風格偏好
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)] text-sm">
            選取後 AI 會自動在生成時注入這些偏好
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map(style => (
              <Badge
                key={style.id}
                variant={selectedStyles.includes(style.id) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all select-none text-sm px-3 py-1",
                  selectedStyles.includes(style.id)
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
                onClick={() => toggleStyle(style.id)}
              >
                {style.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 字數偏好 */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[var(--text-primary)] flex items-center gap-2 text-base">
            <AlignLeft className="w-4 h-4 text-green-400" />
            預設字數長度
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)] text-sm">
            AI 生成時的目標字數
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {WORD_LENGTH_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={wordLength === opt.value ? "default" : "outline"}
                size="sm"
                className={cn(
                  "justify-start",
                  wordLength === opt.value
                    ? "bg-green-700 hover:bg-green-800 text-white border-green-600"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                )}
                onClick={() => handleWordLength(opt.value)}
                disabled={isPending}
              >
                {wordLength === opt.value && <Check className="w-3 h-3 mr-1" />}
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* V2.9: 主題偏好 */}
      <ThemeSelector value={selectedTheme} onChange={handleThemeChange} />

      {/* 個性化指令 */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[var(--text-primary)] flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-yellow-400" />
            個性化指令
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)] text-sm">
            直接告訴 AI 你的特殊要求（每次生成都會注入）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={styleNotes}
            onChange={e => setStyleNotes(e.target.value)}
            placeholder="例如：故事要包含..., 角色性格要..., 喜歡..."
            className="bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-h-[100px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">{styleNotes.length}/500</span>
            <Button
              size="sm"
              onClick={handleStyleNotes}
              disabled={isPending}
              className="bg-yellow-700 hover:bg-yellow-800 text-white"
            >
              {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              儲存
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 成功提示 */}
      {savedMsg && (
        <div className="rounded-lg bg-green-900/30 border border-green-700 p-3 text-green-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {savedMsg}
        </div>
      )}

      {/* 重置記憶 */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isPending}
          className="border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300"
        >
          {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />}
          清除所有 AI 記憶
        </Button>
        <p className="text-xs text-[var(--text-muted)] mt-2">清除後 AI 會忘記你的所有偏好設定</p>
      </div>
    </div>
  )
}
