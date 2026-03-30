import { createClient } from '@supabase/supabase-js'
import { getSubscription, isActiveSub } from '@/lib/stripe'

// Free tier daily limit for Sonnet (expensive) chat messages
const CHAT_DAILY_LIMIT = 20

/**
 * Check if a user is within their daily AI chat quota and increment the counter.
 * Pro subscribers get unlimited chat. Free users get 20/day.
 */
export async function checkChatRateLimit(
  userId: string
): Promise<{ allowed: boolean; message?: string; remaining?: number }> {
  // Pro users have no limit
  const sub = await getSubscription(userId)
  if (isActiveSub(sub)) return { allowed: true }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  // Read current usage for today
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

  // Increment — upsert handles first-use of the day
  if (data) {
    await supabase
      .from('ai_usage')
      .update({ chat_count: current + 1 })
      .eq('user_id', userId)
      .eq('date', today)
  } else {
    await supabase
      .from('ai_usage')
      .insert({ user_id: userId, date: today, chat_count: 1 })
  }

  return { allowed: true, remaining: CHAT_DAILY_LIMIT - current - 1 }
}
