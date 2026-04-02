'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, BookOpen, MousePointerClick, MessageSquare, Highlighter, Trophy, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: BookOpen,
    title: 'Welcome to Kairos',
    desc: "You've got the entire Bible at your fingertips — WEB, KJV, and ESV translations. Start with any book and chapter. Use the sidebar or search to navigate.",
    tip: 'Try: Dashboard → Read → pick any book',
    color: 'from-blue-500/20 to-primary/20',
  },
  {
    icon: MousePointerClick,
    title: 'Tap any verse to go deep',
    desc: "Click or tap any verse while reading. A panel opens with cross-references (430,000 links!), the original Hebrew or Greek word meanings, and an instant explanation.",
    tip: 'Just tap a verse number while reading',
    color: 'from-purple-500/20 to-blue-500/20',
  },
  {
    icon: MessageSquare,
    title: 'Meet Ezra — your study companion',
    desc: "Ezra is your AI Bible study companion. Ask him anything about the passage you're reading — history, theology, original language, or just plain meaning. Switch between Simple, Standard, and Scholar depth.",
    tip: 'Open the chat icon while reading any chapter',
    color: 'from-green-500/20 to-teal-500/20',
  },
  {
    icon: Highlighter,
    title: 'Highlight & take notes',
    desc: "Tap a verse, then choose a highlight color or add a note. Your highlights and notes are saved to your account and sync across all your devices.",
    tip: 'Tap a verse → pick a color or write a note',
    color: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    icon: Trophy,
    title: 'Build your streak & earn badges',
    desc: "Read every day to build your streak. Earn XP for reading, highlighting, and quizzes. Unlock 15+ badges for milestones like finishing a book or hitting a 7-day streak.",
    tip: 'Check your progress on the Progress page',
    color: 'from-orange-500/20 to-red-500/20',
  },
]

const STORAGE_KEY = 'bv_tutorial_done'

export function TutorialOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Only show once, and only in the browser
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Gradient top bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${current.color} transition-all duration-500`} />

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-foreground" />
            </div>
            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Skip tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Text */}
          <div>
            <h2
              className="text-xl font-bold mb-2 leading-tight"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {current.title}
            </h2>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              style={{ fontFamily: 'system-ui' }}
            >
              {current.desc}
            </p>
          </div>

          {/* Tip pill */}
          <div
            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ fontFamily: 'system-ui' }}
          >
            <span>💡</span>
            <span>{current.tip}</span>
          </div>

          {/* Progress dots + button */}
          <div className="flex items-center justify-between pt-1">
            {/* Dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`rounded-full transition-all ${
                    i === step
                      ? 'w-4 h-2 bg-primary'
                      : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            {/* Next / Done */}
            <Button
              size="sm"
              onClick={next}
              className="gap-1.5"
              style={{ fontFamily: 'system-ui' }}
            >
              {isLast ? 'Get started' : 'Next'}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div className="px-6 pb-4 text-center">
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontFamily: 'system-ui' }}
            >
              Skip tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
