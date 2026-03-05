"use client"

import { useAppStore } from "@/store/useAppStore"
import { cn } from "@/lib/utils"

type Perspective = 'first-person' | 'third-person'

interface PerspectiveOption {
  id: Perspective
  label: string
  description: string
}

const PERSPECTIVE_OPTIONS: PerspectiveOption[] = [
  {
    id: 'first-person',
    label: '第一人稱',
    description: '以主角視角敘述，代入感更強'
  },
  {
    id: 'third-person',
    label: '第三人稱',
    description: '全知視角，更宏觀的故事呈現'
  }
]

export function PerspectiveSelector() {
  const { perspective, setPerspective } = useAppStore()

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {PERSPECTIVE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setPerspective(option.id)}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg border text-left transition-all",
              perspective === option.id
                ? "bg-purple-600/20 border-purple-500/50 text-purple-200"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <div className="text-sm font-medium">{option.label}</div>
            <div className="text-xs opacity-70 mt-0.5">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
