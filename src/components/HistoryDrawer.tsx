"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getUserStories, type StoryData } from "@/app/actions/story"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, X, ExternalLink } from "lucide-react"

interface HistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  onLoadStory: (story: StoryData & { id: string }) => void
}

export function HistoryDrawer({ isOpen, onClose, onLoadStory }: HistoryDrawerProps) {
  const [stories, setStories] = useState<(StoryData & { id: string; created_at: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const shouldLoad = isOpen && isLoggedIn && stories.length === 0 && !loading

  useEffect(() => {
    if (shouldLoad) {
      const fetchStories = async () => {
        setLoading(true)
        setError("")
        
        const result = await getUserStories()
        
        if (result.error) {
          setError(result.error)
        } else {
          setStories(result.stories || [])
        }
        
        setLoading(false)
      }
      fetchStories()
    }
  }, [shouldLoad])

  const handleLoad = (story: StoryData & { id: string }) => {
    onLoadStory(story)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l nyx-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b nyx-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 nyx-text-muted" />
            <h2 className="text-lg font-bold text-white">歷史故事</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="nyx-text-muted hover:nyx-text-primary"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {!isLoggedIn && (
            <div className="text-center py-8 nyx-text-muted">
              🔒 登入後查看歷史
            </div>
          )}

          {isLoggedIn && loading && (
            <div className="text-center py-8 nyx-text-muted">
              載入中...
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {isLoggedIn && !loading && !error && stories.length === 0 && (
            <div className="text-center py-8 nyx-text-muted">
              還沒有儲存的故事
            </div>
          )}
          
          <div className="space-y-3">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                className="nyx-surface-2 nyx-border cursor-pointer hover:nyx-surface-2 transition-colors"
                onClick={() => handleLoad(story)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm nyx-text-primary flex items-center justify-between">
                    {story.title || "無標題"}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/share/${story.id}`, '_blank')
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs nyx-text-muted line-clamp-2">
                    {story.content?.slice(0, 150)}...
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    {new Date(story.created_at).toLocaleDateString("zh-TW")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
