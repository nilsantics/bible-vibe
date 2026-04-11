'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, BookMarked } from 'lucide-react'
import { TRADITIONS, TRADITION_STORAGE_KEY, type TraditionId } from '@/lib/tradition'

interface Props {
  /** Called whenever the tradition changes so parents can re-trigger AI calls */
  onChange?: (id: TraditionId) => void
  compact?: boolean
}

export function useTradition() {
  const [tradition, setTraditionState] = useState<TraditionId>('balanced')

  useEffect(() => {
    const stored = localStorage.getItem(TRADITION_STORAGE_KEY) as TraditionId | null
    if (stored) setTraditionState(stored)
  }, [])

  function setTradition(id: TraditionId) {
    setTraditionState(id)
    localStorage.setItem(TRADITION_STORAGE_KEY, id)
  }

  return { tradition, setTradition }
}

export function TraditionPicker({ onChange, compact = false }: Props) {
  const { tradition, setTradition } = useTradition()
  const [open, setOpen] = useState(false)

  const current = TRADITIONS.find((t) => t.id === tradition) ?? TRADITIONS[0]

  function pick(id: TraditionId) {
    setTradition(id)
    onChange?.(id)
    setOpen(false)
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 h-7 px-2 rounded-lg border text-xs font-medium transition-colors ${
            tradition !== 'balanced'
              ? 'border-primary/40 bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
          }`}
          style={{ fontFamily: 'system-ui' }}
          title="Theological tradition"
        >
          <BookMarked className="w-3 h-3 shrink-0" />
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-9 z-50 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>
                  Theological Tradition
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5" style={{ fontFamily: 'system-ui' }}>
                  AI explanations reflect your tradition
                </p>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {TRADITIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => pick(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60 ${
                      t.id === tradition ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                    }`}
                    style={{ fontFamily: 'system-ui' }}
                  >
                    <span>{t.label}</span>
                    {t.id === tradition && <span className="text-primary">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Full-size picker (for settings page)
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
        Theological Tradition
      </p>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
        AI explanations and commentary will reflect your tradition&apos;s emphases.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
        {TRADITIONS.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${
              t.id === tradition
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-border/80 hover:bg-muted/40 text-foreground'
            }`}
          >
            <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>{t.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
