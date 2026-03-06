"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User, Zap, Gift, BookOpen, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { RechargeModal } from "@/components/RechargeModal"
import { getUserWordCount } from "@/app/actions/story"
import { useAppStore } from "@/store/useAppStore"

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])
  return mounted
}

// 用戶創作統計（Phase 4：沉沒成本系統）
interface UserStats {
  totalStories: number
  totalCharacters: number
  totalWordsWritten: number
}

export function UserMenu() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const mounted = useMounted()
  const [wordCount, setWordCount] = useState<number>(0)
  const [isFirstPurchase, setIsFirstPurchase] = useState(true)
  const [rechargeOpen, setRechargeOpen] = useState(false)
  
  // 創作統計（用於沉沒成本心理）
  const [stats, setStats] = useState<UserStats>({
    totalStories: 0,
    totalCharacters: 0,
    totalWordsWritten: 0
  })

  // 從 store 獲取匿名用戶字數
  const { anonymousWordsLeft } = useAppStore()

  const isLoggedIn = !!session?.user

  // 已登入用戶：獲取字數與統計
  useEffect(() => {
    if (session?.user) {
      getUserWordCount().then(({ wordCount, isFirstPurchase }) => {
        queueMicrotask(() => {
          setWordCount(wordCount)
          setIsFirstPurchase(isFirstPurchase)
        })
      })
      
      // TODO: Phase 4 完整實現時，從 Supabase 獲取真實統計
      // 現階段從 localStorage 讀取已創作故事數量
      const savedStories = localStorage.getItem('nyx-ai-stories-count')
      const savedCharacters = localStorage.getItem('nyx-ai-characters-count')
      
      queueMicrotask(() => {
        setStats({
          totalStories: savedStories ? parseInt(savedStories) : 0,
          totalCharacters: savedCharacters ? parseInt(savedCharacters) : 0,
          totalWordsWritten: 0 // 待 API 實現
        })
      })
    }
  }, [session])

  // 監聽支付成功後刷新字數
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkPayment = () => {
      const params = new URLSearchParams(window.location.search)
      if (params.get('payment') === 'success') {
        getUserWordCount().then(({ wordCount, isFirstPurchase }) => {
          queueMicrotask(() => {
            setWordCount(wordCount)
            setIsFirstPurchase(isFirstPurchase)
          })
        })
        window.history.replaceState({}, '', '/app')
      }
    }

    checkPayment()
    window.addEventListener('popstate', checkPayment)
    return () => window.removeEventListener('popstate', checkPayment)
  }, [])

  if (!mounted || status === "loading") {
    return <div className="w-20 h-8 bg-[var(--surface-2)] animate-pulse rounded" />
  }

  // =============================================
  // 已登入用戶：顯示字數 + 充值 + 創作統計
  // =============================================
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        {/* Phase 4: 創作成就統計（沉沒成本） */}
        {(stats.totalStories > 0 || stats.totalCharacters > 0) && (
          <div className="hidden md:flex items-center gap-3 text-xs px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">
            {stats.totalStories > 0 && (
              <span className="text-purple-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {stats.totalStories} 部作品
              </span>
            )}
            {stats.totalCharacters > 0 && (
              <span className="text-blue-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {stats.totalCharacters} 個角色
              </span>
            )}
          </div>
        )}

        {/* 剩餘字數 + 充值按鈕 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRechargeOpen(true)}
          className="text-yellow-400 hover:text-yellow-300 hover:bg-[var(--surface-2)] px-2"
          title="點擊充值"
        >
          <Zap className="w-4 h-4 mr-1" />
          <span className="text-sm">{wordCount.toLocaleString()} 字</span>
        </Button>

        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{session.user.email}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-1 hidden sm:inline">登出</span>
        </Button>

        <RechargeModal
          open={rechargeOpen}
          onClose={() => setRechargeOpen(false)}
          isFirstPurchase={isFirstPurchase}
          wordCount={wordCount}
        />
      </div>
    )
  }

  // =============================================
  // 未登入用戶：顯示免費剩餘字數（不顯示充值）
  // =============================================
  return (
    <div className="flex items-center gap-2">
      {/* 免費剩餘字數提示（不突出，避免焦慮） */}
      <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
        <Gift className="w-3 h-3 inline mr-1" />
        免費 {anonymousWordsLeft.toLocaleString()} 字
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/auth/signin")}
        className="border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
      >
        <LogIn className="w-4 h-4" />
        <span className="ml-1">登入</span>
      </Button>
    </div>
  )
}
