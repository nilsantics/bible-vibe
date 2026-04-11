'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { BookOpen, ChevronRight, X } from 'lucide-react'
import { BIBLE_BOOKS, OT_CATEGORIES, NT_CATEGORIES, APOC_BOOKS, APOC_CATEGORIES } from '@/lib/bible-data'
import type { PatristicWritingMeta } from '@/app/api/patristic-writings/route'

interface Props {
  activeBookId?: number
  /** Label shown on the trigger button (e.g. "Proverbs") */
  label?: string
}

export function MobileBookDrawer({ activeBookId, label }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isPatristicPage = pathname.includes('/church-fathers/')

  const [tab, setTab] = useState<'OT' | 'NT' | 'Apoc' | 'CF'>(
    isPatristicPage ? 'CF' : ((activeBookId ?? 1) <= 39 ? 'OT' : 'NT')
  )
  const [expandedBookId, setExpandedBookId] = useState<number | null>(activeBookId ?? null)

  const [writings, setWritings] = useState<PatristicWritingMeta[]>([])
  const [writingsLoaded, setWritingsLoaded] = useState(false)

  useEffect(() => {
    if (tab !== 'CF' || writingsLoaded) return
    setWritingsLoaded(true)
    fetch('/api/patristic-writings')
      .then((r) => r.json())
      .then((d) => setWritings(d.writings ?? []))
      .catch(() => {})
  }, [tab, writingsLoaded])
  const translation = searchParams.get('translation') ?? 'ESV'

  // Detect current chapter from URL
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const activeChapter = /^\d+$/.test(lastSegment) ? parseInt(lastSegment) : null

  const activeBook = BIBLE_BOOKS.find((b) => b.id === activeBookId)

  const renderBooks = (bookIds: readonly number[]) => {
    const books = BIBLE_BOOKS.filter((b) => (bookIds as readonly number[]).includes(b.id))
    return books.map((b) => {
      const slug = b.name.toLowerCase().replace(/\s+/g, '-')
      const isActive = b.id === activeBookId
      const isExpanded = expandedBookId === b.id

      return (
        <div key={b.id} className="border-b border-border/40 last:border-0">
          <div className="flex items-center">
            <Link
              href={`/dashboard/reading/${slug}/overview`}
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-3 text-sm transition-colors active:bg-muted/60"
            >
              <span
                className={isActive ? 'text-primary font-semibold' : 'text-foreground/80'}
                style={{ fontFamily: 'system-ui' }}
              >
                {b.name}
              </span>
            </Link>
            <button
              onClick={() => setExpandedBookId(isExpanded ? null : b.id)}
              className="px-3 py-3 text-muted-foreground"
              aria-label={isExpanded ? 'Collapse' : 'Show chapters'}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          </div>

          {isExpanded && (
            <div className="grid grid-cols-7 gap-1 px-4 pb-3">
              {Array.from({ length: b.chapters }, (_, i) => i + 1).map((ch) => (
                <Link
                  key={ch}
                  href={`/dashboard/reading/${slug}/${ch}?translation=${translation}`}
                  onClick={() => setOpen(false)}
                >
                  <div
                    className={`text-xs text-center py-1.5 rounded-md font-medium transition-colors ${
                      isActive && ch === activeChapter
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground bg-muted/50 active:bg-muted'
                    }`}
                    style={{ fontFamily: 'system-ui' }}
                  >
                    {ch}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <>
      {/* Trigger — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-muted/60 border border-border/60 text-xs font-semibold transition-colors active:bg-muted"
        style={{ fontFamily: 'system-ui' }}
      >
        <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span>{label ?? activeBook?.name ?? 'Books'}</span>
      </button>

      {/* Bottom sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl border-t border-border/60 flex flex-col"
            style={{ maxHeight: '82dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2 shrink-0">
              <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>
                Bible Books
              </p>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border shrink-0">
              {(['OT', 'NT', 'Apoc', 'CF'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${
                    tab === t
                      ? 'text-foreground border-b-2 border-primary -mb-px'
                      : 'text-muted-foreground'
                  }`}
                  style={{ fontFamily: 'system-ui' }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Book list */}
            <div className="flex-1 overflow-y-auto">
              {tab === 'OT' &&
                OT_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <p
                      className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-4 pt-3 pb-1"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      {cat.label}
                    </p>
                    {renderBooks(cat.ids)}
                  </div>
                ))}

              {tab === 'NT' &&
                NT_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <p
                      className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-4 pt-3 pb-1"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      {cat.label}
                    </p>
                    {renderBooks(cat.ids)}
                  </div>
                ))}

              {tab === 'Apoc' &&
                APOC_CATEGORIES.map((cat) => {
                  const books = APOC_BOOKS.filter((b) =>
                    (cat.ids as readonly number[]).includes(b.id)
                  )
                  return (
                    <div key={cat.label}>
                      <p
                        className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-4 pt-3 pb-1"
                        style={{ fontFamily: 'system-ui' }}
                      >
                        {cat.label}
                      </p>
                      {books.map((b) => (
                        <a
                          key={b.id}
                          href={b.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpen(false)}
                          className="flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-0 active:bg-muted/60 transition-colors"
                        >
                          <span className="text-sm text-foreground/80" style={{ fontFamily: 'system-ui' }}>
                            {b.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50 font-mono">
                            {b.chapters}ch ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  )
                })}

              {tab === 'CF' && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-4 pt-3 pb-1" style={{ fontFamily: 'system-ui' }}>
                    Church Fathers
                  </p>
                  {!writingsLoaded && (
                    <div className="px-4 space-y-2 py-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  )}
                  {writings.map((w) => (
                    <Link
                      key={w.slug}
                      href={`/dashboard/church-fathers/${w.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex flex-col px-4 py-3 border-b border-border/40 last:border-0 active:bg-muted/60 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground/90 leading-snug" style={{ fontFamily: 'system-ui' }}>{w.title}</span>
                      <span className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>{w.father_name} · {w.era}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Bottom padding for home bar */}
              <div className="h-8" />
            </div>
          </div>
        </>
      )}
    </>
  )
}
