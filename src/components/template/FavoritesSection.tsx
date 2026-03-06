"use client"

import { useState, useEffect } from "react"
import { Heart, Bookmark } from "lucide-react"
import type { Template } from "@/types/template"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface FavoriteTemplate extends Template {
  favoritedAt: string
}

interface FavoritesSectionProps {
  onSelectTemplate: (template: Template) => void
  className?: string
}

export function FavoritesSection({
  onSelectTemplate,
  className,
}: FavoritesSectionProps) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<FavoriteTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setFavorites([])
      setIsLoading(false)
      return
    }

    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/user/favorites")
        if (response.ok) {
          const data = await response.json()
          setFavorites(data.templates || [])
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFavorites()
  }, [session])

  // 未登入時顯示提示
  if (!session?.user) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium text-muted-foreground">我的收藏</h3>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">登入後可收藏常用模板</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium text-muted-foreground">我的收藏</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-40 flex-shrink-0 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // 如果沒有收藏，顯示提示
  if (favorites.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium text-muted-foreground">我的收藏</h3>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">還沒有收藏模板</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            點擊模板上的 ♡ 收藏
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium text-muted-foreground">我的收藏</h3>
          <span className="text-xs text-muted-foreground/70">
            ({favorites.length})
          </span>
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {favorites.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="group relative flex-shrink-0 text-left"
          >
            <div className="w-40 p-3 rounded-lg border bg-blue-50/50 border-blue-200 hover:border-blue-300 transition-all duration-200">
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
              
              {/* 收藏標識 */}
              <div className="absolute top-2 right-2">
                <Heart className="h-3 w-3 text-red-500 fill-current" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
