"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Flame } from "lucide-react"
import type { Template } from "@/types/template"

interface TrendingTemplate extends Template {
  usageCount: number
}

interface TrendingSectionProps {
  onSelectTemplate: (template: Template) => void
  limit?: number
  className?: string
}

export function TrendingSection({
  onSelectTemplate,
  limit = 5,
  className,
}: TrendingSectionProps) {
  const [trending, setTrending] = useState<TrendingTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch(`/api/templates/trending?limit=${limit}&hours=24`)
        if (response.ok) {
          const data = await response.json()
          setTrending(data.templates || [])
        }
      } catch (error) {
        console.error("Failed to fetch trending:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrending()
  }, [limit])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Flame className="h-4 w-4 text-orange-500" />
          <span>今天熱門</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-40 flex-shrink-0 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // 如果沒有數據，不顯示此區塊
  if (trending.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-medium text-muted-foreground">今天熱門</h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {trending.map((template, index) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="group relative flex-shrink-0 text-left"
          >
            <div className={`
              relative w-40 p-3 rounded-lg border transition-all duration-200
              ${index < 3 
                ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300" 
                : "bg-muted/50 border-border hover:border-border/80"
              }
            `}>
              {/* 排名標識 */}
              {index < 3 && (
                <div className={`
                  absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? "bg-orange-500 text-white" : ""}
                  ${index === 1 ? "bg-amber-400 text-white" : ""}
                  ${index === 2 ? "bg-amber-300 text-white" : ""}
                `}>
                  {index + 1}
                </div>
              )}
              
              {/* 模板名稱 */}
              <p className="font-medium text-sm line-clamp-1 mb-1">
                {template.name}
              </p>
              
              {/* 描述 */}
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {template.description}
              </p>
              
              {/* 標籤 */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* 熱門標識 */}
              {template.usageCount > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] text-orange-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>熱門</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
