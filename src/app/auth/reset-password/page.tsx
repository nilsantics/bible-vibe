'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-bold text-primary-foreground text-base"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              K
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Kairos
            </span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <div className="text-4xl">📬</div>
              <p className="font-semibold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Check your email</p>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                We sent a reset link to <strong>{email}</strong>. Click it to set a new password.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full mt-2" style={{ fontFamily: 'system-ui' }}>
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                Reset your password
              </h1>
              <p className="text-sm text-muted-foreground mb-5" style={{ fontFamily: 'system-ui' }}>
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} style={{ fontFamily: 'system-ui' }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4" style={{ fontFamily: 'system-ui' }}>
          Remember your password?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
