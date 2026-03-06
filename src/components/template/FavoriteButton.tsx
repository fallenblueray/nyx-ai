"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  templateId: string
  initialFavorited?: boolean
  onToggle?: (favorited: boolean) => void
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function FavoriteButton({
  templateId,
  initialFavorited = false,
  onToggle,
  size = "md",
  showLabel = false,
  className,
}: FavoriteButtonProps) {
  const { data: session } = useSession()
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isLoading, setIsLoading] = useState(false)

  // 檢查是否已收藏
  useEffect(() => {
    if (!session?.user) {
      setIsFavorited(false)
      return
    }

    // 可選：初始化時檢查收藏狀態
    // 暫時使用 initialFavorited，實際由父組件傳入
  }, [session, initialFavorited])

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!session?.user) {
      // 未登入：可以觸發登入提示
      return
    }

    if (isLoading) return

    setIsLoading(true)
    
    try {
      if (isFavorited) {
        // 取消收藏
        const response = await fetch(`/api/user/favorites?templateId=${templateId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setIsFavorited(false)
          onToggle?.(false)
        }
      } else {
        // 添加收藏
        const response = await fetch("/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        })

        if (response.ok || response.status === 409) {
          setIsFavorited(true)
          onToggle?.(true)
        }
      }
    } catch (error) {
      console.error("Favorite toggle error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  // 未登入時顯示禁用狀態
  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        className={cn(
          "opacity-0 group-hover:opacity-50 transition-opacity",
          sizeClasses[size],
          className
        )}
        title="登入後可收藏"
      >
        <Heart size={iconSizes[size]} className="text-muted-foreground" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        showLabel ? "gap-2" : sizeClasses[size],
        isFavorited 
          ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
          : "text-muted-foreground hover:text-red-500 hover:bg-red-50",
        className
      )}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          "transition-all duration-200",
          isFavorited && "fill-current"
        )}
      />
      {showLabel && (
        <span>{isFavorited ? "已收藏" : "收藏"}</span>
      )}
    </Button>
  )
}
