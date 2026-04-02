'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'kairos_pwa_dismissed'
const SESSIONS_KEY = 'kairos_session_count'

export function PwaPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISSED_KEY)) return

    // Count sessions
    const count = parseInt(localStorage.getItem(SESSIONS_KEY) ?? '0', 10) + 1
    localStorage.setItem(SESSIONS_KEY, String(count))

    // Only show after 2nd session
    if (count < 2) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as { standalone?: boolean }).standalone
    setIsIOS(ios)

    // Already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    if (ios) {
      setShow(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') localStorage.setItem(DISMISSED_KEY, '1')
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            <span className="text-primary-foreground font-bold text-base">K</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>Add to home screen</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Study the Bible offline</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
          Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install Kairos.
        </p>
      ) : (
        <Button size="sm" className="w-full gap-2" onClick={install}>
          <Download className="w-3.5 h-3.5" />
          Install Kairos
        </Button>
      )}
    </div>
  )
}
