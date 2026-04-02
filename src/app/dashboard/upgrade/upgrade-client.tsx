'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, BookOpen, Languages, Brain, MessageSquare, Infinity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const FREE_FEATURES = [
  'Read WEB, KJV & ESV translations',
  'Highlights & notes',
  '20 Ezra messages / day',
  'Basic reading plans',
  'Bible quiz',
  'Hebrew alphabet page',
]

const PRO_FEATURES = [
  { icon: Infinity,       text: 'Unlimited Ezra conversations' },
  { icon: Brain,          text: 'Scholar mode — original languages & theology' },
  { icon: Languages,      text: 'Interlinear Hebrew & Greek view' },
  { icon: MessageSquare,  text: 'Sermon prep & study guide generator (coming soon)' },
  { icon: BookOpen,       text: 'All translations including ESV' },
  { icon: Zap,            text: 'Priority response speed' },
]

interface Props {
  isPro: boolean
  subscription: { status: string; current_period_end: string | null; cancel_at_period_end: boolean; price_id: string } | null
}

export function UpgradeClient({ isPro, subscription }: Props) {
  const router = useRouter()
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setPortalLoading(false)
    }
  }

  if (isPro) {
    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null
    const isYearly = subscription?.price_id?.includes(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ?? '') ||
      subscription?.price_id === 'price_1TGldZ4EF2UU7U4O732cw97R'

    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
            <Zap className="w-4 h-4" /> Kairos Pro
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            You&apos;re all set.
          </h1>
          <p className="text-muted-foreground text-sm" style={{ fontFamily: 'system-ui' }}>
            Full access to everything Kairos has to offer.
          </p>
        </div>

        {/* Status card */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
            {isYearly ? 'Annual plan' : 'Monthly plan'}
          </p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {subscription?.cancel_at_period_end
              ? `Access ends ${periodEnd}. You won't be charged again.`
              : `Renews ${periodEnd}.`}
          </p>
        </div>

        {/* Features */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
            What you have access to
          </p>
          {PRO_FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm" style={{ fontFamily: 'system-ui' }}>{text}</span>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handlePortal}
          disabled={portalLoading}
          className="w-full"
          style={{ fontFamily: 'system-ui' }}
        >
          {portalLoading ? 'Opening…' : 'Manage subscription & billing'}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-2">
          <Zap className="w-4 h-4" /> Upgrade to Pro
        </div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
          Go deeper into Scripture
        </h1>
        <p className="text-muted-foreground text-sm" style={{ fontFamily: 'system-ui' }}>
          Unlock unlimited AI study, original languages, and everything Ezra has to offer.
        </p>
      </div>

      {/* Plan toggle */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        {(['monthly', 'yearly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${
              plan === p ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontFamily: 'system-ui' }}
          >
            <span>{p === 'monthly' ? '$9.99 / month' : '$89 / year'}</span>
            <span className={`text-xs ${plan === p ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {p === 'monthly' ? '33¢ / day' : '24¢ / day'}
            </span>
            {p === 'yearly' && (
              <span className={`text-xs font-semibold ${plan === 'yearly' ? 'text-primary-foreground/80' : 'text-primary'}`}>
                Save 26%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pro features */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
          Everything in Free, plus:
        </p>
        {PRO_FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm" style={{ fontFamily: 'system-ui' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Free tier reminder */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
          Free tier (always free)
        </p>
        {FREE_FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span style={{ fontFamily: 'system-ui' }}>{f}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={handleUpgrade}
        disabled={loading}
        size="lg"
        className="w-full text-base h-12"
        style={{ fontFamily: 'system-ui' }}
      >
        {loading ? 'Redirecting to checkout…' : `Start Pro — ${plan === 'yearly' ? '$89 / year' : '$9.99 / month'}`}
      </Button>

      <p className="text-center text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
        Cancel anytime. Billed securely through Stripe.
      </p>
    </div>
  )
}
