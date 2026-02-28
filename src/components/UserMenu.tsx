"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User, Zap, Gift } from "lucide-react"
import { useRouter } from "next/navigation"
import { RechargeModal } from "@/components/RechargeModal"
import { getUserWordCount } from "@/app/actions/story"
import { useAppStore } from "@/store/useAppStore"

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])
  return mounted
}

export function UserMenu() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const mounted = useMounted()
  const [wordCount, setWordCount] = useState<number>(0)
  const [isFirstPurchase, setIsFirstPurchase] = useState(true)
  const [rechargeOpen, setRechargeOpen] = useState(false)

  // 從 store 獲取匿名用戶字數
  const { anonymousWordsLeft } = useAppStore()

  const isLoggedIn = !!session?.user

  // 已登入用戶：獲取字數
  useEffect(() => {
    if (session?.user) {
      getUserWordCount().then(({ wordCount, isFirstPurchase }) => {
        setWordCount(wordCount)
        setIsFirstPurchase(isFirstPurchase)
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
          setWordCount(wordCount)
          setIsFirstPurchase(isFirstPurchase)
        })
        window.history.replaceState({}, '', '/app')
      }
    }

    checkPayment()
    window.addEventListener('popstate', checkPayment)
    return () => window.removeEventListener('popstate', checkPayment)
  }, [])

  if (!mounted || status === "loading") {
    return <div className="w-20 h-8 bg-slate-800 animate-pulse rounded" />
  }

  // =============================================
  // 已登入用戶：顯示字數 + 充值
  // =============================================
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        {/* 剩餘字數 + 充值按鈕 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRechargeOpen(true)}
          className="text-yellow-400 hover:text-yellow-300 hover:bg-slate-800 px-2"
          title="點擊充值"
        >
          <Zap className="w-4 h-4 mr-1" />
          <span className="text-sm">{wordCount.toLocaleString()} 字</span>
        </Button>

        <div className="flex items-center gap-2 text-sm text-slate-300">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{session.user.email}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
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
      <span className="text-xs text-slate-500 hidden sm:inline">
        <Gift className="w-3 h-3 inline mr-1" />
        免費 {anonymousWordsLeft.toLocaleString()} 字
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/auth/signin")}
        className="border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        <LogIn className="w-4 h-4" />
        <span className="ml-1">登入</span>
      </Button>
    </div>
  )
}
