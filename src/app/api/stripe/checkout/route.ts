import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { priceId } = await req.json()
  if (!priceId) {
    return NextResponse.json({ error: '缺少 priceId' }, { status: 400 })
  }

  // ✓ 建立 Supabase server client (with SSR)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')
  if (!supabaseAnonKey) throw new Error('Missing SUPABASE_ANON_KEY')

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

  try {
    // 查用户首充状态
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('is_first_purchase')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('Failed to fetch user:', userError)
      return NextResponse.json({ error: '無法讀取用戶資料' }, { status: 500 })
    }

    const isFirstPurchase = user?.is_first_purchase ?? true

    const checkoutSession = await getStripe().checkout.sessions.create({
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

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: '建立付款失敗' }, { status: 500 })
  }
}
