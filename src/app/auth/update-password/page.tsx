'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
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
          {done ? (
            <div className="text-center space-y-3 py-2">
              <div className="text-4xl">✅</div>
              <p className="font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Password updated!</p>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                Redirecting you to your dashboard…
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Set a new password
              </h1>
              <p className="text-sm text-muted-foreground mb-5" style={{ fontFamily: 'system-ui' }}>
                Choose a strong password for your account.
              </p>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} style={{ fontFamily: 'system-ui' }}>
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
