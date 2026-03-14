"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get("ref")

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
        // ✅ 初始化 profiles 表（新用戶免費 8000 字 + 邀請獎勵）
        let initialWordCount = 8000;
        let referralSuccess = false;

        // 追蹤邀請轉化
        if (refCode) {
          try {
            console.log('[Signup] Tracking referral:', refCode, 'for user:', data.user.id);
            const response = await fetch("/api/referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: refCode, referredId: data.user.id }),
            });

            const result = await response.json();
            console.log('[Signup] Referral API response:', response.status, result);

            if (response.ok) {
              initialWordCount += 1000; // 邀請獎勵 1000 字
              referralSuccess = true;
              console.log('[Signup] Referral tracked successfully, word count:', initialWordCount);
            } else {
              console.error('[Signup] Referral API error:', result);
            }
          } catch (err) {
            console.error("[Signup] Referral tracking error:", err);
          }
        }

        console.log('[Signup] Creating profile with word_count:', initialWordCount);
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              word_count: initialWordCount,
              is_first_purchase: true,
            },
            { onConflict: 'id' }
          )

        if (profileError) {
          console.error('[Signup] Profile creation error:', profileError);
        } else {
          console.log('[Signup] Profile created successfully');
        }

        // ✅ 同時追踪邀請人的獎勵（給邀請人加字）
        if (referralSuccess && refCode) {
          try {
            console.log('[Signup] Adding reward to referrer for code:', refCode);
            const { data: referralData } = await supabase
              .from('referral_codes')
              .select('user_id')
              .eq('code', refCode.toUpperCase())
              .single();
            
            if (referralData?.user_id) {
              const { data: referrerProfile } = await supabase
                .from('profiles')
                .select('word_count')
                .eq('id', referralData.user_id)
                .single();
              
              if (referrerProfile) {
                await supabase
                  .from('profiles')
                  .update({ word_count: (referrerProfile.word_count || 0) + 1000 })
                  .eq('id', referralData.user_id);
                console.log('[Signup] Referrer reward added:', referralData.user_id);
              }
            }
          } catch (rewardErr) {
            console.error('[Signup] Referrer reward error:', rewardErr);
          }
        }

        if (profileError) {
          console.error('Profile init error:', profileError)
          // 繼續進行，不阻擋用戶登入
        }

        // Sign in immediately
        console.log('[Signup] Attempting auto-login...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          console.error('[Signup] Auto-login failed:', signInError);
          setError("帳號已建立，請在登入頁登入")
          setTimeout(() => router.push("/auth/signin"), 2000)
        } else {
          console.log('[Signup] Auto-login successful, session:', signInData.session ? 'exists' : 'null');
          // 確保 session 已設置
          if (signInData.session) {
            // 強制刷新頁面以確保 session 同步
            window.location.href = "/app";
          } else {
            router.push("/app");
            router.refresh();
          }
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
          {refCode ? (
            <div className="mt-2">
              <span className="text-sm text-purple-400">
                🎁 使用邀請碼 <strong>{refCode}</strong> 註冊，獲得額外 1000 字獎勵！
              </span>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              開始你的 NyxAI 創作旅程
            </p>
          )}
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

// Main export with Suspense wrapper
export default function SignUp() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
