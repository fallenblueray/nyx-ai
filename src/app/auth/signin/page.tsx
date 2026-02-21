"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("登入失敗，請檢查帳號密碼")
      } else {
        router.push("/app")
        router.refresh()
      }
    } catch {
      setError("發生錯誤，請重試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            登入 NyxAI
          </CardTitle>
          <p className="text-slate-400 text-sm">
            輸入帳號密碼開始創作
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>
            
            <div>
              <label className="text-sm text-slate-400">密碼</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密碼"
                required
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "登入中..." : "登入"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              還沒有帳號？{" "}
              <button
                type="button"
                onClick={() => alert("請先在 Supabase 建立帳號")}
                className="text-blue-400 hover:underline"
              >
                註冊
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
