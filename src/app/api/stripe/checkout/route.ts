import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { priceId } = await req.json()
  if (!priceId) {
    return NextResponse.json({ error: '缺少 priceId' }, { status: 400 })
  }

  // 查用户首充状态
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: user } = await supabase
    .from('users')
    .select('is_first_purchase')
    .eq('id', session.user.id)
    .single()

  const isFirstPurchase = user?.is_first_purchase ?? true

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
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
