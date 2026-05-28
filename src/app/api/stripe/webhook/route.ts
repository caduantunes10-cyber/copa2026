import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const userId = session.metadata?.user_id
      if (!userId) break

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id' })

      // Ativa premium no perfil
      await supabase.from('profiles')
        .update({ is_premium: true, premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
        .eq('id', userId)

      // Registra no feed
      await supabase.from('activity_feed').insert({
        user_id: userId,
        action_type: 'premium',
        target_name: 'Copa 2026 Premium',
      })
      break
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const status = sub.status === 'active' ? 'active' : 'canceled'

      const { data: dbSub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', sub.id)
        .single()

      if (dbSub) {
        await supabase.from('subscriptions')
          .update({ status, current_period_end: new Date(sub.current_period_end * 1000).toISOString() })
          .eq('stripe_subscription_id', sub.id)

        if (status === 'canceled') {
          await supabase.from('profiles')
            .update({ is_premium: false })
            .eq('id', dbSub.user_id)
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
