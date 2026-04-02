'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      style={{ fontFamily: 'system-ui' }}
    >
      Sign out
    </button>
  )
}
