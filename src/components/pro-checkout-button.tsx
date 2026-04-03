'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'

export function ProCheckoutButton({ plan = 'yearly' }: { plan?: 'monthly' | 'yearly' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/signup?next=/dashboard/upgrade')
      return
    }

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

  return (
    <Button
      className="w-full text-xs tracking-widest uppercase h-10 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
      onClick={handleClick}
      disabled={loading}
    >
      <Zap className="w-3 h-3" />
      {loading ? 'Redirecting…' : 'Begin Pro — 33¢ / day'}
    </Button>
  )
}
