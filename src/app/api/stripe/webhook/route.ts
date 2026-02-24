import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, PRICE_MAP, FIRST_PRICE_IDS } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'

// 必须用 raw body 做 webhook 签名验证
export const dynamic = 'force-dynamic'

const getAdminClient = () => createAdminClient()

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // 防重复：检查是否已处理
    const supabase = getAdminClient()
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single()

    if (existing) {
      return NextResponse.json({ received: true, skipped: true })
    }

    const userId = session.metadata?.user_id
    const priceId = session.metadata?.price_id

    if (!userId || !priceId) {
      console.error('Missing metadata:', session.metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const baseWords = PRICE_MAP[priceId] || 0
    const isFirstPrice = FIRST_PRICE_IDS.has(priceId)

    // 查用户首充状态
    const { data: user } = await supabase
      .from('profiles')
      .select('is_first_purchase, word_count')
      .eq('id', userId)
      .single()

    // 首充 = price是首充价且用户还没有购买过
    const isFirstPurchase = isFirstPrice && (user?.is_first_purchase ?? true)
    const finalWords = isFirstPurchase ? baseWords * 2 : baseWords

    // 原子更新 word_count
    const newWordCount = (user?.word_count ?? 0) + finalWords
    await supabase
      .from('profiles')
      .upsert({ id: userId, word_count: newWordCount, is_first_purchase: isFirstPurchase ? false : (user?.is_first_purchase ?? true) })

    // 记录支付历史
    await supabase.from('payments').insert({
      user_id: userId,
      stripe_session_id: session.id,
      amount: session.amount_total,
      words_added: finalWords,
      price_id: priceId,
      is_first_purchase: isFirstPurchase,
    })

    console.log(`✅ Payment: user=${userId} words=${finalWords} first=${isFirstPurchase}`)
  }

  return NextResponse.json({ received: true })
}
