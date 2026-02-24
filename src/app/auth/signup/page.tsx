"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@supabase/supabase-js"

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Supabase credentials not configured")
  }
  return createClient(url, key)
}

export default function SignUp() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate
      if (password !== confirmPassword) {
        setError("密碼不符，請重新輸入")
        setLoading(false)
        return
      }

      // Sign up
      const supabase = getSupabase()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/signin`,
        },
      })

      if (signUpError) {
        setError(signUpError.message || "註冊失敗，請重試")
        setLoading(false)
        return
      }

      // Auto-confirm (for dev, since confirm email is disabled)
      if (data.user) {
        // ✅ 初始化 profiles 表（新用戶免費 8000 字）
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email: data.user.email,
              word_count: 8000,
              is_first_purchase: true,
            },
            { onConflict: 'id' }
          )

        if (profileError) {
          console.error('Profile init error:', profileError)
          // 繼續進行，不阻擋用戶登入
        }

        // Sign in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError("帳號已建立，請在登入頁登入")
          setTimeout(() => router.push("/auth/signin"), 2000)
        } else {
          // Auto redirect to app
          router.push("/app")
          router.refresh()
        }
      }
    } catch (err) {
      setError("發生錯誤，請重試")
      console.error("signup error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            建立帳號
          </CardTitle>
          <p className="text-slate-400 text-sm">
            開始你的 NyxAI 創作旅程
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
                placeholder="至少 6 個字符"
                required
                minLength={6}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">確認密碼</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再輸入一次"
                required
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "建立中..." : "建立帳號"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              已有帳號？{" "}
              <button
                type="button"
                onClick={() => router.push("/auth/signin")}
                className="text-blue-400 hover:underline"
              >
                登入
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
