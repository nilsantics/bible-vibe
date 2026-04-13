import { createClient } from '@supabase/supabase-js'
import { getSubscription, isActiveSub } from '@/lib/stripe'

const CHAT_DAILY_LIMIT = 20
const FEATURE_DAILY_LIMIT = 20 // commentary (RAG), quiz, synthesize notes — explicit expensive actions

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Check and increment the daily chat quota.
 * Pro subscribers get unlimited. Free users get 20/day.
 */
export async function checkChatRateLimit(
  userId: string
): Promise<{ allowed: boolean; message?: string; remaining?: number }> {
  const sub = await getSubscription(userId)
  if (isActiveSub(sub)) return { allowed: true }

  const supabase = adminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('ai_usage')
    .select('chat_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const current = data?.chat_count ?? 0

  if (current >= CHAT_DAILY_LIMIT) {
    return {
      allowed: false,
      message: `You've used all ${CHAT_DAILY_LIMIT} free messages today. Upgrade to Pro for unlimited Ezra conversations.`,
    }
  }

  if (data) {
    await supabase.from('ai_usage').update({ chat_count: current + 1 }).eq('user_id', userId).eq('date', today)
  } else {
    await supabase.from('ai_usage').insert({ user_id: userId, date: today, chat_count: 1 })
  }

  return { allowed: true, remaining: CHAT_DAILY_LIMIT - current - 1 }
}

/**
 * Check and increment the daily AI feature quota (commentary, explain, context, etc.).
 * Pro subscribers get unlimited. Free users get 30 feature calls/day.
 * Uses a direct Supabase subscription check (no Stripe SDK) for edge-runtime safety.
 */
export async function checkFeatureRateLimit(
  userId: string
): Promise<{ allowed: boolean; message?: string }> {
  const supabase = adminClient()

  // Check subscription directly via DB — edge-safe, no Stripe SDK needed
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'lifetime'])
    .maybeSingle()

  if (sub) return { allowed: true }

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('ai_usage')
    .select('feature_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const current = data?.feature_count ?? 0

  if (current >= FEATURE_DAILY_LIMIT) {
    return {
      allowed: false,
      message: `You've reached your ${FEATURE_DAILY_LIMIT} free uses today. Upgrade to Pro for unlimited commentary, quizzes, and AI note synthesis.`,
    }
  }

  if (data) {
    await supabase.from('ai_usage').update({ feature_count: current + 1 }).eq('user_id', userId).eq('date', today)
  } else {
    await supabase.from('ai_usage').insert({ user_id: userId, date: today, feature_count: 1 })
  }

  return { allowed: true }
}
