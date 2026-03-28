'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
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
