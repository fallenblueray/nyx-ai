"use client"

/**
 * 已登入用戶字數用完 → 彈出充值提醒
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { PACKAGES, formatWords } from "@/lib/pricing"

interface RechargePromptModalProps {
  open: boolean
  onClose: () => void
  isFirstPurchase: boolean
  onRecharge: () => void  // 開啟完整充值 Modal
}

export function RechargePromptModal({ open, onClose, isFirstPurchase, onRecharge }: RechargePromptModalProps) {
  // 推薦最受歡迎的套餐（100k）
  const featuredPackage = PACKAGES[1]

  const price = isFirstPurchase ? featuredPackage.firstPrice : featuredPackage.normalPrice

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Zap className="w-5 h-5 text-yellow-400" />
            字數已用完
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            充值後繼續無限創作
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 首充特惠提示 */}
          {isFirstPurchase && (
            <div className="rounded-lg bg-yellow-600/10 border border-yellow-600/30 p-3">
              <p className="text-sm text-yellow-300 font-medium">
                🎉 首次充值限時 5 折！
              </p>
            </div>
          )}

          {/* 推薦套餐 */}
          <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-medium">
                {formatWords(featuredPackage.words)} 字
              </span>
              <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-600/30">
                最受歡迎
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                HK${price}
              </span>
              {isFirstPurchase && (
                <span className="text-slate-500 line-through text-sm">
                  HK${featuredPackage.normalPrice}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => { onClose(); onRecharge() }}
            >
              <Zap className="w-4 h-4 mr-2" />
              {isFirstPurchase ? "立即以 5 折充值" : "立即充值"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-slate-200"
              onClick={onClose}
            >
              稍後再說
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
