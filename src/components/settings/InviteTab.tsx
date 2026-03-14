"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Share2, Users, Gift, Link2, Check } from "lucide-react";

interface ReferralStats {
  code: string;
  totalInvites: number;
  conversions: number;
  rewards: number;
  referrals: Array<{
    referred_id: string;
    status: string;
    created_at: string;
  }>;
}

export function InviteTab() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/auth/signup`
    : "https://www.nyx-ai.net/auth/signup";

  useEffect(() => {
    fetchReferralStats();
  }, []);

  async function fetchReferralStats() {
    try {
      const response = await fetch("/api/referral");
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("載入失敗，請重試");
    } finally {
      setLoading(false);
    }
  }

  const inviteLink = stats?.code 
    ? `${baseUrl}?ref=${stats.code}`
    : baseUrl;

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  function shareInvite() {
    const text = `一起用 NyxAI 創作精彩故事！使用我的邀請碼 ${stats?.code || ""} 註冊，一起獲得獎勵！`;
    
    if (navigator.share) {
      navigator.share({
        title: "NyxAI 邀請",
        text: text,
        url: inviteLink,
      });
    } else {
      copyInviteLink();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 邀請碼卡片 */}
      <Card className="bg-purple-900/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-purple-400" />
            邀請好友
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            邀請好友加入 NyxAI，雙方都可獲得 1000 字的獎勵額度！
          </p>

          {/* 邀請連結 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inviteLink}
                readOnly
                className="bg-black/20 border-white/10 text-sm pr-10"
              />
              <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
            <Button
              onClick={copyInviteLink}
              variant="outline"
              className="border-purple-500/30 hover:bg-purple-500/10"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={shareInvite}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
          </div>

          {/* 複製成功提示 */}
          {copied && (
            <p className="text-sm text-green-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              已複製到剪貼簿！
            </p>
          )}
        </CardContent>
      </Card>

      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-black/20 border-white/5">
          <CardContent className="pt-6 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-white">
              {stats?.totalInvites || 0}
            </div>
            <div className="text-xs text-gray-500">
              總邀請
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/5">
          <CardContent className="pt-6 text-center">
            <Check className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-white">
              {stats?.conversions || 0}
            </div>
            <div className="text-xs text-gray-500">
              成功轉化
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/5">
          <CardContent className="pt-6 text-center">
            <Gift className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-white">
              {stats?.rewards || 0}
            </div>
            <div className="text-xs text-gray-500">
              獲得獎勵
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 說明 */}
      <Card className="bg-black/10 border-white/5">
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium text-white mb-3">
            如何運作
          </h4>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>複製上方邀請連結分享給好友</li>
            <li>好友通過你的連結註冊並完成首次創作</li>
            <li>雙方各獲得 1000 字獎勵額度</li>
          </ol>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
