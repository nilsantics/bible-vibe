'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'

export function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || status === 'loading') return
    setStatus('loading')
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center justify-center gap-2.5 text-sm text-foreground" style={{ fontFamily: 'var(--font-inter), system-ui' }}>
        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
        <span>You&apos;re on the list — we&apos;ll be in touch.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        style={{ fontFamily: 'var(--font-inter), system-ui' }}
      />
      <Button
        type="submit"
        size="sm"
        disabled={status === 'loading' || !email.trim()}
        className="h-10 px-4 gap-1.5 shrink-0"
      >
        {status === 'loading' ? 'Sending…' : (
          <>Stay updated <ArrowRight className="w-3 h-3" /></>
        )}
      </Button>
    </form>
  )
}
