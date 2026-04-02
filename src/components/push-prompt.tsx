'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requestPushPermission } from '@/components/service-worker-register'

export function PushPrompt({ streak }: { streak: number }) {
  const [show, setShow] = useState(false)
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem('push_prompt_dismissed')) return
    // Only show at streak milestones: 1, 3, 7, 14, 30
    if ([1, 3, 7, 14, 30].includes(streak)) {
      setShow(true)
    }
  }, [streak])

  async function handleEnable() {
    setEnabling(true)
    const ok = await requestPushPermission()
    setEnabling(false)
    setShow(false)
    if (ok) {
      // small visual feedback handled by sonner elsewhere
    }
  }

  function handleDismiss() {
    localStorage.setItem('push_prompt_dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="mb-6 flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Bell className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5" style={{ fontFamily: 'system-ui' }}>
          {streak}-day streak! Stay on track.
        </p>
        <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'system-ui' }}>
          Get a daily verse reminder so you never miss a day.
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs px-3" onClick={handleEnable} disabled={enabling}>
            {enabling ? 'Enabling…' : 'Turn on reminders'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
