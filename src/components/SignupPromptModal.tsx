"use client"

/**
 * 匿名用戶字數用完 → 彈出註冊提醒
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, UserPlus } from "lucide-react"
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
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            免費額度已用完
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            你已使用完 8,000 字的免費試用額度
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-purple-600/10 border border-purple-600/30 p-4">
            <p className="text-sm text-purple-300 font-medium mb-2">
              🎉 註冊即可獲得更多優惠
            </p>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>✅ 首次充值享 5 折優惠</li>
              <li>✅ 故事歷史記錄無限保存</li>
              <li>✅ 角色卡雲端同步</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleSignup}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              立即免費註冊
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
              onClick={handleSignin}
            >
              已有帳號，登入繼續
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
