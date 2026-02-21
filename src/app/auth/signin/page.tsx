"use client"

import { Button } from "@/components/ui/button"

export default function SignIn() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            登入 NyxAI
          </h2>
          <p className="text-slate-400">
            選擇登入方式開始創作
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => alert("Google 登入將在配置 GOOGLE_CLIENT_ID 後啟用")}
          >
            使用 Google 登入
          </Button>
          
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => alert("Email 登入將在配置郵件伺服器後啟用")}
          >
            使用 Email 登入
          </Button>
        </div>
        
        <p className="text-sm text-slate-500">
          * 登入功能暫為 skeleton，尚未連接資料庫
        </p>
      </div>
    </main>
  )
}
