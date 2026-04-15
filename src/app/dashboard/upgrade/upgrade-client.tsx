'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, BookOpen, Languages, Brain, MessageSquare, Infinity, Crown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const FREE_FEATURES = [
  'Full Bible reader: WEB, KJV & BSB',
  'Book & chapter overviews',
  'Cross-references & connections',
  '20 Ezra messages / day',
  'Basic reading plans',
  'Bible quiz & Hebrew alphabet',
]

const PRO_FEATURES = [
  { icon: Infinity,       text: 'Unlimited Ezra conversations' },
  { icon: Brain,          text: 'Scholar mode — original languages & theology' },
  { icon: Languages,      text: 'Interlinear Hebrew & Greek view' },
  { icon: MessageSquare,  text: 'Study notes with AI connections' },
  { icon: BookOpen,       text: 'All commentaries & patristic sources' },
  { icon: Zap,            text: 'Priority response speed' },
]

const LIFETIME_EXTRAS = [
  'Everything in Pro, forever',
  'All current & future reading plans',
  'All current & future study tools',
  'One-time payment, no recurring fees',
]

// Adjust this as you sell spots
const LIFETIME_SPOTS_REMAINING = 47

interface Props {
  isPro: boolean
  subscription: { status: string; current_period_end: string | null; cancel_at_period_end: boolean; price_id: string } | null
}

export function UpgradeClient({ isPro, subscription }: Props) {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  async function handleUpgrade(plan: 'monthly' | 'yearly' | 'lifetime') {
    setLoading(plan)
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
      setLoading(null)
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

  // Already Pro — show account management
  if (isPro) {
    const isLifetime = subscription?.status === 'lifetime'
    const periodEnd = subscription?.current_period_end && !isLifetime
      ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null
    const isYearly = subscription?.price_id?.includes(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ?? '')

    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
            {isLifetime ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {isLifetime ? 'Lifetime Access' : 'Kairos Pro'}
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            You&apos;re all set.
          </h1>
          <p className="text-muted-foreground text-sm" style={{ fontFamily: 'system-ui' }}>
            Full access to everything Kairos has to offer.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
            {isLifetime ? 'Lifetime plan' : isYearly ? 'Annual plan' : 'Monthly plan'}
          </p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {isLifetime
              ? 'Yours forever. No renewals, no fees.'
              : subscription?.cancel_at_period_end
              ? `Access ends ${periodEnd}. You won't be charged again.`
              : `Renews ${periodEnd}.`}
          </p>
        </div>

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

        {!isLifetime && (
          <Button
            variant="outline"
            onClick={handlePortal}
            disabled={portalLoading}
            className="w-full"
            style={{ fontFamily: 'system-ui' }}
          >
            {portalLoading ? 'Opening…' : 'Manage subscription & billing'}
          </Button>
        )}
      </div>
    )
  }

  const proPrice = billingCycle === 'yearly' ? '$89 / year' : '$9.99 / month'
  const proSubtext = billingCycle === 'yearly' ? '24¢ / day' : '33¢ / day'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-2">
          <Zap className="w-4 h-4" /> Choose your plan
        </div>
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Go deeper into Scripture
        </h1>
        <p className="text-muted-foreground text-sm" style={{ fontFamily: 'system-ui' }}>
          Start free or unlock everything. No credit card required to start.
        </p>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex rounded-xl border border-border overflow-hidden">
          {(['monthly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`px-6 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                billingCycle === cycle
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'system-ui' }}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  billingCycle === 'yearly'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-primary/10 text-primary'
                }`}>
                  Save 26%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3-column pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* FREE */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2" style={{ fontFamily: 'system-ui' }}>Free</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold" style={{ fontFamily: 'system-ui' }}>$0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
              A focused taste of deep Bible study. No credit card required.
            </p>
          </div>

          <div className="space-y-2 flex-1 mb-6 border-t border-border pt-4">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
                <span style={{ fontFamily: 'system-ui' }}>{f}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
            style={{ fontFamily: 'system-ui' }}
          >
            Continue Free
          </Button>
        </div>

        {/* PRO — highlighted */}
        <div className="bg-card border-2 border-primary rounded-2xl p-6 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full" style={{ fontFamily: 'system-ui' }}>
              Most Popular
            </span>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2" style={{ fontFamily: 'system-ui' }}>Pro</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold" style={{ fontFamily: 'system-ui' }}>
                {billingCycle === 'yearly' ? '$89' : '$9.99'}
              </span>
              <span className="text-muted-foreground text-sm" style={{ fontFamily: 'system-ui' }}>
                {billingCycle === 'yearly' ? '/ year' : '/ month'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
              {proSubtext} · 5-day free trial included
            </p>
            <div className="inline-flex items-center gap-1 mt-2 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full" style={{ fontFamily: 'system-ui' }}>
              <Zap className="w-3 h-3" /> 5-day free trial
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: 'system-ui' }}>
            Go deeper with unlimited study, original languages, and all Ezra has to offer.
          </p>

          <div className="space-y-2 flex-1 mb-6 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2" style={{ fontFamily: 'system-ui' }}>
              Everything in Free, plus:
            </p>
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <span style={{ fontFamily: 'system-ui' }}>{text}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => handleUpgrade(billingCycle)}
            disabled={loading !== null}
            size="lg"
            className="w-full text-base h-12"
            style={{ fontFamily: 'system-ui' }}
          >
            {loading === billingCycle ? 'Redirecting…' : 'Start Free Trial'}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2" style={{ fontFamily: 'system-ui' }}>
            5-day free trial · Cancel anytime
          </p>
        </div>

        {/* LIFETIME */}
        <div className="bg-foreground text-background rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
            <p className="text-xs font-semibold text-background/60 uppercase tracking-wide mb-2" style={{ fontFamily: 'system-ui' }}>Lifetime</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold" style={{ fontFamily: 'system-ui' }}>$149</span>
              <span className="text-background/60 text-sm" style={{ fontFamily: 'system-ui' }}>.99 one-time</span>
            </div>
            <p className="text-xs text-background/60 mt-1" style={{ fontFamily: 'system-ui' }}>
              Pay once, own it forever.
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-400" style={{ fontFamily: 'system-ui' }}>
                {LIFETIME_SPOTS_REMAINING} spots remaining
              </span>
            </div>
          </div>

          <p className="text-xs text-background/60 mb-4" style={{ fontFamily: 'system-ui' }}>
            All current Pro tools plus every new feature and study resource we ship.
          </p>

          <div className="space-y-2 flex-1 mb-6 border-t border-background/10 pt-4">
            <p className="text-xs font-semibold text-background/50 uppercase tracking-wide mb-2" style={{ fontFamily: 'system-ui' }}>
              Everything in Pro, forever:
            </p>
            {LIFETIME_EXTRAS.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-background/80">
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-background/50" />
                <span style={{ fontFamily: 'system-ui' }}>{f}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => handleUpgrade('lifetime')}
            disabled={loading !== null}
            size="lg"
            className="w-full h-12 bg-background text-foreground hover:bg-background/90"
            style={{ fontFamily: 'system-ui' }}
          >
            {loading === 'lifetime' ? 'Redirecting…' : 'Get Lifetime Access'}
          </Button>
          <p className="text-center text-xs text-background/50 mt-2" style={{ fontFamily: 'system-ui' }}>
            One-time payment · No recurring fees
          </p>
        </div>
      </div>

      {/* Bottom reassurance */}
      <p className="text-center text-xs text-muted-foreground mt-8" style={{ fontFamily: 'system-ui' }}>
        No credit card required to start. Cancel anytime — no questions asked. Billed securely through Stripe.
      </p>
    </div>
  )
}
