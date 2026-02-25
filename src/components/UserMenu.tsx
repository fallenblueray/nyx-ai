"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { RechargeModal } from "@/components/RechargeModal"
import { getUserWordCount } from "@/app/actions/story"

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
  const [wordCount, setWordCount] = useState<number>(8000)
  const [isFirstPurchase, setIsFirstPurchase] = useState(true)
  const [rechargeOpen, setRechargeOpen] = useState(false)

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
        console.log('💰 Payment success detected, fetching new word count...')
        getUserWordCount().then(({ wordCount, isFirstPurchase }) => {
          console.log('💰 New word count:', wordCount)
          setWordCount(wordCount)
          setIsFirstPurchase(isFirstPurchase)
        })
        // 清除 URL 參數
        window.history.replaceState({}, '', '/app')
      }
    }
    
    // 立即檢查
    checkPayment()
    
    // 監聽 popstate 事件（瀏覽器導航）
    window.addEventListener('popstate', checkPayment)
    return () => window.removeEventListener('popstate', checkPayment)
  }, [])

  if (!mounted || status === "loading") {
    return <div className="w-20 h-8 bg-slate-800 animate-pulse rounded" />
  }

  if (session?.user) {
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/auth/signin")}
      className="border-slate-700 text-slate-300 hover:bg-slate-800"
    >
      <LogIn className="w-4 h-4" />
      <span className="ml-1">登入</span>
    </Button>
  )
}
