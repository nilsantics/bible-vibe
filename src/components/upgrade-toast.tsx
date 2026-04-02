'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function UpgradeToast() {
  const router = useRouter()
  useEffect(() => {
    toast.success('Welcome to Kairos Pro! Full access is now unlocked.', { duration: 6000 })
    router.replace('/dashboard', { scroll: false })
  }, [router])
  return null
}

export function WelcomeToast() {
  const router = useRouter()
  useEffect(() => {
    toast.success('Welcome back!', { duration: 3000 })
    router.replace('/dashboard', { scroll: false })
  }, [router])
  return null
}
