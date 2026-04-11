import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  httpClient: Stripe.createFetchHttpClient(),
})

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    amount: 999,
    label: '$9.99 / month',
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    amount: 8900,
    label: '$89 / year',
    interval: 'year' as const,
    savings: 'Save 26%',
  },
  lifetime: {
    priceId: process.env.STRIPE_PRICE_LIFETIME!,
    amount: 14999,
    label: '$149.99 one-time',
  },
}

/** Server-side only: check if a user has an active Pro subscription */
export async function getSubscription(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, cancel_at_period_end, price_id')
    .eq('user_id', userId)
    .single()
  return data
}

export function isActiveSub(sub: Awaited<ReturnType<typeof getSubscription>>) {
  if (!sub) return false
  return sub.status === 'active' || sub.status === 'trialing' || sub.status === 'lifetime'
}

/** Get or create a Stripe customer ID for a user */
export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if we already have a customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  // Save it
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}
