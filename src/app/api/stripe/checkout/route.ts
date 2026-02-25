import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  console.log('📝 [checkout] Request received')
  
  // ✅ 驗證 STRIPE_SECRET_KEY
  const stripeKey = process.env.STRIPE_SECRET_KEY
  console.log('🔑 [checkout] STRIPE_SECRET_KEY exists:', !!stripeKey)
  console.log('🔑 [checkout] STRIPE_SECRET_KEY starts with:', stripeKey?.slice(0, 8))
  
  if (!stripeKey) {
    console.error('❌ Missing STRIPE_SECRET_KEY')
    return NextResponse.json({ error: '伺服器配置錯誤，請聯絡管理員' }, { status: 500 })
  }

  try {
    // ✅ 解析 body
    const { priceId } = await req.json()
    console.log('📦 [checkout] priceId:', priceId)
    
    if (!priceId) {
      return NextResponse.json({ error: '缺少 priceId' }, { status: 400 })
    }

    // ✅ 驗證 session（傳入 authOptions）
    const session = await getServerSession(authOptions)
    console.log('🔐 [checkout] session:', session?.user?.email, '| id:', session?.user?.id)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 })
    }

    // ✅ 建立 Supabase server client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log('🗄️ [checkout] Supabase URL:', supabaseUrl ? 'exists' : 'missing')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase config')
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    })

    // ✅ 加強：用戶資料讀取錯誤處理
    let isFirstPurchase = true
    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('is_first_purchase')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error('❌ Failed to fetch user profile:', userError.message)
        // 如果 profile 不存在，預設為首充
        if (userError.code === 'PGRST116') {
          console.log('⚠️ Profile not found, defaulting to first purchase')
          isFirstPurchase = true
        } else {
          return NextResponse.json(
            { error: '無法讀取用戶資料，請重新登入或聯絡管理員' },
            { status: 500 }
          )
        }
      } else {
        isFirstPurchase = user?.is_first_purchase ?? true
      }
    } catch (queryErr) {
      console.error('❌ Query exception:', queryErr)
      return NextResponse.json(
        { error: '資料庫錯誤，請稍後重試' },
        { status: 500 }
      )
    }

    console.log('💳 [checkout] isFirstPurchase:', isFirstPurchase)

    // ✅ 初始化 Stripe 並建立 Checkout Session
    let checkoutSession
    try {
      const stripe = getStripe()
      console.log('💳 [checkout] Stripe initialized successfully')
      
      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          user_id: session.user.id,
          price_id: priceId,
          is_first_purchase: String(isFirstPurchase),
        },
        success_url: `${process.env.NEXTAUTH_URL || 'https://nyx-ai-woad.vercel.app'}/app?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL || 'https://nyx-ai-woad.vercel.app'}/app?payment=cancelled`,
      })
      
      console.log('✅ [checkout] Session created:', checkoutSession.id)
    } catch (stripeErr: unknown) {
      console.error('❌ Stripe session create error:', stripeErr)
      const stripeError = stripeErr as { type?: string; message?: string }
      console.error('❌ Stripe error type:', stripeError?.type)
      console.error('❌ Stripe error message:', stripeError?.message)
      return NextResponse.json(
        { error: 'Stripe 連線失敗，請稍後重試或聯絡管理員' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: checkoutSession?.url })
  } catch (err) {
    console.error('❌ Checkout error:', err)
    console.error('❌ Error stack:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '建立付款失敗' },
      { status: 500 }
    )
  }
}
