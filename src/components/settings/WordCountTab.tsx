"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, History, Gift } from "lucide-react";
import { RechargeModal } from "@/components/RechargeModal";

// 自定義進度條組件
function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface WordCountTabProps {
  wordCount: number;
  isFirstPurchase: boolean;
}

export function WordCountTab({ wordCount, isFirstPurchase }: WordCountTabProps) {
  const [rechargeOpen, setRechargeOpen] = useState(false);
  
  // 初始免費額度
  const freeQuota = 8000;
  // 使用率百分比
  const usagePercent = Math.min(100, ((freeQuota - wordCount) / freeQuota) * 100);
  // 已使用字數
  const usedWords = Math.max(0, freeQuota - wordCount);

  return (
    <div className="space-y-6">
      {/* 字數概覽卡片 */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-yellow-400" />
            剩餘字數
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {wordCount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">字</span>
          </div>

          {/* 進度條 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>免費額度使用情況</span>
              <span>{usagePercent.toFixed(0)}%</span>
            </div>
            <ProgressBar value={usagePercent} className="h-2" />
            <p className="text-xs text-gray-500">
              已使用 {usedWords.toLocaleString()} / {freeQuota.toLocaleString()} 字
            </p>
          </div>

          {/* 充值按鈕 */}
          <Button
            onClick={() => setRechargeOpen(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isFirstPurchase ? "立即充值（首儲半價）" : "立即充值"}
          </Button>
        </CardContent>
      </Card>

      {/* 歷史記錄卡片 */}
      <Card className="bg-black/10 border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4 text-blue-400" />
            字數變動記錄
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-4">
            字數使用記錄功能即將上線
          </p>
        </CardContent>
      </Card>

      {/* 邀請獎勵提示 */}
      <Card className="bg-green-900/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">
                邀請好友獲得更多字數
              </h4>
              <p className="text-xs text-gray-400">
                每成功邀請一位好友，雙方各獲得 1000 字獎勵！
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <RechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        isFirstPurchase={isFirstPurchase}
        wordCount={wordCount}
      />
    </div>
  );
}
