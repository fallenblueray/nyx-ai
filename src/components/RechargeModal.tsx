'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap } from 'lucide-react'
import { PACKAGES, formatWords } from '@/lib/pricing'

interface RechargeModalProps {
  open: boolean
  onClose: () => void
  isFirstPurchase: boolean
  wordCount: number
}

export function RechargeModal({ open, onClose, isFirstPurchase, wordCount }: RechargeModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleCheckout = async (pkg: typeof PACKAGES[0]) => {
    const priceId = isFirstPurchase ? pkg.firstPriceId : pkg.normalPriceId
    setLoading(priceId)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立付款失敗，請重試')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl bg-[var(--surface)] border-[var(--border)]"
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)] flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            充值字數
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            選擇充值方案以獲取更多字數額度。剩餘：{wordCount.toLocaleString()} 字
          </DialogDescription>
        </DialogHeader>

        {isFirstPurchase && (
          <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-700 rounded-lg p-3 text-center">
            <span className="text-orange-300 font-bold">🎉 首充半價優惠！10萬字只需19.9元</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {PACKAGES.map((pkg) => {
            const priceId = isFirstPurchase ? pkg.firstPriceId : pkg.normalPriceId
            const price = isFirstPurchase ? pkg.firstPrice : pkg.normalPrice
            const isLoading = loading === priceId
            const isFeatured = pkg.isFeatured

            return (
              <Card
                key={pkg.words}
                className={`
                  transition-all duration-200
                  ${isFeatured 
                    ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 shadow-lg shadow-purple-500/10 scale-[1.02]' 
                    : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]'
                  }
                `}
              >
                <CardContent className="p-4">
                  {isFeatured && (
                    <div className="mb-2 -mt-1">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs px-2 py-0.5">
                        {pkg.badge}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[var(--text-primary)] font-bold text-lg">{formatWords(pkg.words)} 字</div>
                      {isFirstPurchase && isFeatured && (
                        <div className="text-[var(--text-muted)] text-xs line-through">原價 ¥{pkg.normalPrice}</div>
                      )}
                      {isFirstPurchase && !isFeatured && (
                        <div className="text-[var(--text-muted)] text-xs line-through">原價 ¥{pkg.normalPrice}</div>
                      )}
                    </div>
                    {!isFeatured && !isFirstPurchase && (
                      <Badge variant="outline" className="border-[var(--border)] text-[var(--text-muted)]">
                        {pkg.badge || pkg.discount}
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className={`font-bold text-xl ${isFeatured ? 'text-pink-400' : 'text-yellow-400'}`}>
                        ¥{price}
                      </span>
                      {isFeatured && isFirstPurchase && (
                        <span className="text-xs text-orange-400">首充半價</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCheckout(pkg)}
                      disabled={!!loading}
                      className={isFeatured 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700'
                      }
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '立即充值'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
