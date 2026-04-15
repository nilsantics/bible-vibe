'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, MousePointerClick, MessageSquare, Search, BookOpen, Sparkles, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Tap any verse',
    desc: 'A study panel opens — cross-references, Hebrew & Greek word meanings, highlights, bookmarks, and an AI explanation.',
    tip: 'Try it now — tap any verse',
    color: 'from-primary/30 to-primary/10',
  },
  {
    icon: MessageSquare,
    title: 'Ask Ezra anything',
    desc: "Ezra is your AI study companion. Ask about history, theology, original languages, or plain meaning — right in the context of what you're reading.",
    tip: 'Hit "Ask Ezra" in the toolbar above',
    color: 'from-blue-500/20 to-primary/20',
  },
  {
    icon: BookOpen,
    title: 'Take study notes',
    desc: 'Open the Notes panel while reading to write, quote verses, and let AI surface connections across Scripture you might have missed.',
    tip: 'Look for the Notes icon in the reader toolbar',
    color: 'from-emerald-500/20 to-primary/20',
  },
  {
    icon: Sparkles,
    title: 'Discover verses by theme',
    desc: 'In Verse Discovery, type a goal or struggle — "dealing with fear", "leadership" — and AI finds passages that speak to it, not just by keyword.',
    tip: 'Find it under Discover in the nav',
    color: 'from-amber-500/20 to-primary/20',
  },
  {
    icon: Search,
    title: 'Search all 31,102 verses',
    desc: 'Search any word or phrase across the whole Bible. Filter by book or testament to narrow it down.',
    tip: 'Search is in the nav — try "fear not"',
    color: 'from-violet-500/20 to-primary/20',
  },
]

export function TutorialOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onboardingDone = localStorage.getItem('kairos_onboarding_done')
    const tutorialDone = localStorage.getItem('kairos_tutorial_done')
    if (onboardingDone && !tutorialDone) {
      const t = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(t)
    }
  }, [])

  // Allow re-triggering from settings via custom event
  useEffect(() => {
    function handleReplay() {
      setStep(0)
      setVisible(true)
    }
    window.addEventListener('kairos:replay-tutorial', handleReplay)
    return () => window.removeEventListener('kairos:replay-tutorial', handleReplay)
  }, [])

  function dismiss() {
    localStorage.setItem('kairos_tutorial_done', '1')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />

      {/* Card — bottom sheet on mobile, centered on desktop */}
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className={`h-1 w-full bg-gradient-to-r ${current.color} transition-all duration-500`} />

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-1.5" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {current.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
              {current.desc}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full" style={{ fontFamily: 'system-ui' }}>
            <span>👆</span>
            <span>{current.tip}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`rounded-full transition-all ${i === step ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30'}`}
                />
              ))}
            </div>
            <Button size="sm" onClick={next} className="gap-1.5">
              {isLast ? 'Got it' : 'Next'}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {!isLast && (
          <div className="px-5 pb-4 text-center">
            <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground" style={{ fontFamily: 'system-ui' }}>
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
