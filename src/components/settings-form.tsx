'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { Bell, BellOff } from 'lucide-react'
import { requestPushPermission } from '@/components/service-worker-register'
import type { User } from '@supabase/supabase-js'

interface Profile {
  username: string
  preferred_translation: string
  theme: string
}

export function SettingsForm({
  user,
  profile,
}: {
  user: User
  profile: Profile | null
}) {
  const supabase = createClient()
  const { setTheme } = useTheme()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [translation, setTranslation] = useState(profile?.preferred_translation ?? 'WEB')
  const [saving, setSaving] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'enabling'>('unknown')
  const [readingGoal, setReadingGoal] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown')
    }
    setReadingGoal(localStorage.getItem('bv_reading_goal') ?? '')
    setDailyMinutes(localStorage.getItem('bv_daily_minutes') ?? '')
  }, [])

  async function handleEnableNotifications() {
    setNotifStatus('enabling')
    const ok = await requestPushPermission()
    if (ok) {
      setNotifStatus('granted')
      toast.success('Notifications enabled! You\'ll get daily verses and streak reminders.')
    } else {
      setNotifStatus(Notification.permission === 'denied' ? 'denied' : 'unknown')
      toast.error('Could not enable notifications. Check your browser settings.')
    }
  }

  async function handleDisableNotifications() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setNotifStatus('unknown')
    toast.success('Notifications disabled.')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username, preferred_translation: translation }, { onConflict: 'id' })

    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Settings saved!')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Account */}
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'system-ui' }}>
          Account
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email ?? ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>

      {/* Reading preferences */}
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'system-ui' }}>
          Reading Preferences
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Default translation</Label>
            <Select value={translation} onValueChange={(v) => v && setTranslation(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEB">WEB — World English Bible</SelectItem>
                <SelectItem value="KJV">KJV — King James Version</SelectItem>
                <SelectItem value="ESV">ESV — English Standard Version</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select
              defaultValue={profile?.theme ?? 'system'}
              onValueChange={(v) => v && setTheme(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System default</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'system-ui' }}>
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'system-ui' }}>
          Get a daily verse each morning and a streak reminder if you haven't read by evening.
        </p>

        {notifStatus === 'granted' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400" style={{ fontFamily: 'system-ui' }}>
              <Bell className="w-4 h-4" />
              Notifications are enabled
            </div>
            <Button variant="outline" size="sm" onClick={handleDisableNotifications} className="gap-2">
              <BellOff className="w-4 h-4" />
              Turn off notifications
            </Button>
          </div>
        ) : notifStatus === 'denied' ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive" style={{ fontFamily: 'system-ui' }}>
              Notifications are blocked in your browser. To enable them, click the lock icon in your address bar and allow notifications for this site.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleEnableNotifications}
            disabled={notifStatus === 'enabling'}
            className="gap-2"
          >
            <Bell className="w-4 h-4" />
            {notifStatus === 'enabling' ? 'Enabling…' : 'Enable notifications'}
          </Button>
        )}
      </Card>

      {/* Reading goals */}
      <Card className="p-5">
        <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'system-ui' }}>
          Reading Goals
        </h2>
        {readingGoal || dailyMinutes ? (
          <div className="text-sm text-muted-foreground mb-4 space-y-0.5" style={{ fontFamily: 'system-ui' }}>
            {readingGoal && (
              <p>Goal: <span className="text-foreground font-medium capitalize">{readingGoal.replace('-', ' ')}</span></p>
            )}
            {dailyMinutes && (
              <p>Daily target: <span className="text-foreground font-medium">{dailyMinutes === '60' ? '1 hour+' : `${dailyMinutes} min`}</span></p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'system-ui' }}>
            You haven&apos;t set up your reading goals yet.
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            localStorage.removeItem('bv_onboarding_done')
            window.location.reload()
          }}
        >
          {readingGoal ? 'Update goals' : 'Set up goals'}
        </Button>
      </Card>

      {/* Danger zone */}
      <Card className="p-5 border-destructive/30">
        <h2 className="text-base font-semibold text-destructive mb-3" style={{ fontFamily: 'system-ui' }}>
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'system-ui' }}>
          Deleting your account will permanently remove all your highlights, notes, progress, and badges.
        </p>
        <Button variant="destructive" size="sm" disabled>
          Delete account (coming soon)
        </Button>
      </Card>
    </div>
  )
}
