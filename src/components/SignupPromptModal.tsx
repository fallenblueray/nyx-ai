"use client"

/**
 * 匿名用戶字數用完 → 彈出註冊提醒（高轉化版本）
 * 報告建議：「劇情高潮將至」而非「沒字」
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Theater, ArrowRight, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface SignupPromptModalProps {
  open: boolean
  onClose: () => void
}

export function SignupPromptModal({ open, onClose }: SignupPromptModalProps) {
  const router = useRouter()

  const handleSignup = () => {
    onClose()
    router.push("/auth/signup")
  }

  const handleSignin = () => {
    onClose()
    router.push("/auth/signin")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl text-[var(--text-primary)] flex items-center justify-center gap-2">
            <Theater className="w-6 h-6 text-purple-400" />
            🎭 故事正在進入關鍵情節⋯
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)] text-center">
            你的免費 8000 字體驗已使用完畢
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* 懸念進度條 */}
          <div className="space-y-2">
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse"
                style={{ width: '75%' }}
              />
            </div>
            <p className="text-xs text-center text-slate-500">
              劇情完成度 75% — 結局即將揭曉
            </p>
          </div>

          {/* 核心訊息 */}
          <p className="text-lg text-center font-medium text-white">
            立即解鎖完整劇情，繼續沉浸創作
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 text-base"
              onClick={handleSignup}
            >
              <span>👉 註冊並繼續創作</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button
              variant="ghost"
              className="w-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              onClick={handleSignin}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              已有帳號，登入繼續
            </Button>
          </div>

          {/* 優惠標註 */}
          <div className="text-center pt-2 border-t border-[var(--border)]">
            <p className="text-xs text-orange-400 font-medium">
              🔥 首充半價優惠中 · 10萬字只需 19.9
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
