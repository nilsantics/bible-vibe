// Fire-and-forget usage logger — safe for edge runtime, never throws
export function logAIUsage(opts: {
  userId: string
  route: string    // e.g. '/api/explain'
  feature: string  // e.g. 'explain_verse'
  model: string    // e.g. 'claude-sonnet-4-6'
  inputTokens: number
  outputTokens: number
}) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ai_usage_log`
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      user_id: opts.userId,
      route: opts.route,
      feature: opts.feature,
      model: opts.model,
      input_tokens: opts.inputTokens,
      output_tokens: opts.outputTokens,
    }),
  }).catch(() => {}) // truly fire-and-forget
}
