'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const GOALS = [
  { id: 'full-bible', label: 'Read the whole Bible', icon: '📖', desc: 'Systematic journey through all 66 books' },
  { id: 'devotional', label: 'Daily devotionals', icon: '🌅', desc: 'Short daily readings for spiritual growth' },
  { id: 'deep-study', label: 'Deep study', icon: '🎓', desc: 'Original languages, theology, history' },
  { id: 'explore', label: 'Browse freely', icon: '🗺️', desc: 'No plan — just follow my curiosity' },
]

const TIMES = [
  { id: '5', label: '5 min', sub: 'A few verses' },
  { id: '15', label: '15 min', sub: 'A chapter a day' },
  { id: '30', label: '30 min', sub: 'Deep daily sessions' },
  { id: '60', label: '1 hour+', sub: 'Serious study time' },
]

const TRANSLATIONS = [
  { code: 'ESV', label: 'English Standard Version', desc: 'Scholarly & widely used · recommended', recommended: true },
  { code: 'BSB', label: 'Berean Standard Bible', desc: 'Modern & accurate · free to share' },
  { code: 'KJV', label: 'King James Version', desc: 'Classic 1611 · poetic language' },
  { code: 'WEB', label: 'World English Bible', desc: 'Modern · public domain' },
]

export function OnboardingWizard() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [time, setTime] = useState('')
  const [translation, setTranslation] = useState('ESV')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const done = localStorage.getItem('bv_onboarding_done')
    if (!done) {
      const t = setTimeout(() => setShow(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  async function finish() {
    localStorage.setItem('bv_onboarding_done', '1')
    if (goal) localStorage.setItem('bv_reading_goal', goal)
    if (time) localStorage.setItem('bv_daily_minutes', time)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert(
        { id: user.id, preferred_translation: translation },
        { onConflict: 'id' }
      )
    }
    setShow(false)
    if (goal === 'full-bible' || goal === 'devotional') {
      router.push('/dashboard/plans')
    }
  }

  function dismiss() {
    localStorage.setItem('bv_onboarding_done', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 pb-4 relative">
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Skip setup"
          >
            <X className="w-4 h-4" />
          </button>

          {step === 0 ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-5">✦</div>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                Welcome to Kairos
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                Let&apos;s personalize your study experience in 30 seconds. You can always update these in settings.
              </p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="flex items-center gap-1.5 mb-5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                {step === 1 && 'What brings you here?'}
                {step === 2 && 'How much time per day?'}
                {step === 3 && 'Pick your translation'}
                {step === 4 && "Here's what's waiting for you"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
                {step === 1 && "We'll suggest the right reading plan for you."}
                {step === 2 && "We'll pace your reading to fit your schedule."}
                {step === 3 && 'You can always switch while reading.'}
                {step === 4 && 'Tap any verse to unlock all of these.'}
              </p>
            </>
          )}
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 space-y-2">
          {step === 0 && (
            <Button className="w-full" size="lg" onClick={() => setStep(1)}>
              Get started →
            </Button>
          )}

          {step === 1 && (
            <>
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    goal === g.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="text-2xl shrink-0">{g.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{g.label}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{g.desc}</p>
                  </div>
                  {goal === g.id && <span className="text-primary font-bold">✓</span>}
                </button>
              ))}
              <Button className="w-full !mt-3" onClick={() => setStep(2)} disabled={!goal}>
                Next →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTime(t.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      time === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <p className="text-lg font-bold" style={{ fontFamily: 'system-ui' }}>{t.label}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{t.sub}</p>
                  </button>
                ))}
              </div>
              <Button className="w-full !mt-3" onClick={() => setStep(3)} disabled={!time}>
                Next →
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              {TRANSLATIONS.map((t) => (
                <button
                  key={t.code}
                  onClick={() => setTranslation(t.code)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    translation === t.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold" style={{ fontFamily: 'system-ui' }}>{t.code}</p>
                      {t.recommended && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold" style={{ fontFamily: 'system-ui' }}>
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/80" style={{ fontFamily: 'system-ui' }}>{t.label}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{t.desc}</p>
                  </div>
                  {translation === t.code && <span className="text-primary font-bold">✓</span>}
                </button>
              ))}
              <Button className="w-full !mt-3" onClick={() => setStep(4)}>
                Next →
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                {[
                  { icon: '💬', title: 'Ezra AI', desc: 'Ask any question about a verse — theology, context, original language, application.' },
                  { icon: '🔤', title: 'Hebrew & Greek interlinear', desc: 'See every word in its original language with definitions inline.' },
                  { icon: '🔗', title: '430,000 cross-references', desc: 'Instantly see every related passage across the entire Bible.' },
                  { icon: '🧠', title: 'Bible quizzes', desc: 'Test your knowledge on any passage, book, or topic.' },
                  { icon: '📅', title: 'Reading plans', desc: 'Follow guided plans — from the whole Bible to targeted studies.' },
                  { icon: '🏆', title: 'Streaks & XP', desc: 'Build a habit with daily streaks and unlock achievement badges.' },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3 p-2.5 rounded-xl">
                    <span className="text-xl shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{f.title}</p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full !mt-3" onClick={finish}>
                Let&apos;s go! 🙌
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
