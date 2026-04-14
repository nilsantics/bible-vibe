'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StudyNotesPanel } from '@/components/study-notes-panel'

export default function NotesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user)
      setReady(true)
    })
  }, [])

  if (!ready) return null

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 53px)' }}>
      <StudyNotesPanel isAuthenticated={isAuthenticated} />
    </div>
  )
}
