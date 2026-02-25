'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
        className="max-w-2xl bg-slate-900 border-slate-700"
        aria-describedby="recharge-description"
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            充值字數
          </DialogTitle>
          <p id="recharge-description" className="text-sm text-slate-400">
            剩餘：{wordCount.toLocaleString()} 字
          </p>
        </DialogHeader>

        {isFirstPurchase && (
          <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-700 rounded-lg p-3 text-center">
            <span className="text-orange-300 font-bold">🎉 首充優惠！所有方案 5折 + 雙倍字數</span>
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

            return (
              <Card
                key={pkg.words}
                className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-white font-bold text-lg">{formatWords(pkg.words)} 字</div>
                      {isFirstPurchase && (
                        <div className="text-slate-400 text-xs line-through">原價 ¥{pkg.normalPrice}</div>
                      )}
                    </div>
                    {isFirstPurchase ? (
                      <Badge className="bg-orange-600 text-white">首充{pkg.discount}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {pkg.discount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold text-xl">¥{price}</span>
                    <Button
                      size="sm"
                      onClick={() => handleCheckout(pkg)}
                      disabled={!!loading}
                      className="bg-blue-600 hover:bg-blue-700"
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
