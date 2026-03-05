'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { storyThemes } from '@/lib/themes'
import { Moon, Heart, Waves, TreePine, Cpu, Cherry, Crown, Leaf, Flame, Gem, Palette, Check } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Moon,
  Heart,
  Waves,
  TreePine,
  Cpu,
  Cherry,
  Crown,
  Leaf,
  Flame,
  Gem
}

interface ThemeSelectorProps {
  value: string
  onChange: (themeId: string) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(value || storyThemes[0].id)

  useEffect(() => {
    setSelectedTheme(value)
  }, [value])

  const handleSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    onChange(themeId)
  }

  // 獲取強度標籤
  const getIntensityLabel = (intensity: number) => {
    const labels = ['含蓄', '溫柔', '熱情', '激情', '狂熱']
    return labels[intensity - 1] || '適中'
  }

  // 獲取節奏標籤
  const getPacingLabel = (pacing: string) => {
    const labels: Record<string, string> = {
      slow: '緩慢',
      moderate: '適中',
      fast: '快速'
    }
    return labels[pacing] || pacing
  }

  return (
    <Card className="nyx-surface nyx-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-[var(--text-primary)] flex items-center gap-2 text-base">
          <Palette className="w-4 h-4 text-purple-400" />
          故事風格
        </CardTitle>
        <CardDescription className="text-[var(--text-secondary)] text-sm">
          選擇寫作風格，AI 會根據風格調整文筆和氛圍
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {storyThemes.map((theme) => {
            const Icon = iconMap[theme.icon] || Moon
            const isSelected = selectedTheme === theme.id

            return (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`relative p-4 rounded-lg border text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {/* 選中標記 */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* 主題內容 */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: theme.colorPalette.gradient }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--text-primary)] truncate">
                      {theme.nameZh}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      {theme.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-[var(--border)]"
                      >
                        {getIntensityLabel(theme.writingStyle.intensity)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-[var(--border)]"
                      >
                        {getPacingLabel(theme.writingStyle.pacing)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 選中主題詳情 */}
        {selectedTheme && (
          <div className="mt-4 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            {(() => {
              const theme = storyThemes.find(t => t.id === selectedTheme)
              if (!theme) return null
              return (
                <>
                  <h5 className="font-medium text-[var(--text-primary)] mb-2">
                    {theme.nameZh} 特點
                  </h5>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                    <li>• 語調：{theme.writingStyle.tone}</li>
                    <li>• 節奏：{getPacingLabel(theme.writingStyle.pacing)}</li>
                    <li>• 氛圍：{theme.writingStyle.atmosphere}</li>
                    <li className="mt-2 pt-2 border-t border-[var(--border)] text-[var(--text-muted)]">
                      {theme.systemPromptAddon.slice(0, 60)}...
                    </li>
                  </ul>
                </>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
