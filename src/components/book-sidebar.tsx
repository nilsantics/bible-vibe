'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BIBLE_BOOKS, OT_CATEGORIES, NT_CATEGORIES, APOC_BOOKS, APOC_CATEGORIES } from '@/lib/bible-data'
import type { PatristicWritingMeta } from '@/app/api/patristic-writings/route'

interface Props {
  activeBookId?: number
}

export function BookSidebar({ activeBookId }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const translation = searchParams.get('translation') ?? 'ESV'

  // Detect active chapter from URL: /dashboard/reading/[book]/[chapter]
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const activeChapter = /^\d+$/.test(lastSegment) ? parseInt(lastSegment) : null

  // Detect active patristic slug from URL: /dashboard/church-fathers/[slug]
  const isPatristicPage = pathname.includes('/church-fathers/')
  const activePatristicSlug = isPatristicPage ? segments[segments.indexOf('church-fathers') + 1] : null

  // Default tab: CF if on a church fathers page, else OT/NT based on active book
  const defaultTab = isPatristicPage ? 'CF' : ((activeBookId ?? 1) <= 39 ? 'OT' : 'NT')
  const [sidebarTab, setSidebarTab] = useState<'OT' | 'NT' | 'Apoc' | 'CF'>(defaultTab)

  // Patristic writings — loaded lazily when CF tab is opened
  const [writings, setWritings] = useState<PatristicWritingMeta[]>([])
  const [writingsLoaded, setWritingsLoaded] = useState(false)

  useEffect(() => {
    if (sidebarTab !== 'CF' || writingsLoaded) return
    setWritingsLoaded(true)
    fetch('/api/patristic-writings')
      .then((r) => r.json())
      .then((d) => setWritings(d.writings ?? []))
      .catch(() => {})
  }, [sidebarTab, writingsLoaded])

  const renderBooks = (bookIds: readonly number[]) => {
    const books = BIBLE_BOOKS.filter((b) => (bookIds as readonly number[]).includes(b.id))
    return books.map((b) => {
      const slug = b.name.toLowerCase().replace(/\s+/g, '-')
      const isActive = b.id === activeBookId
      return (
        <div key={b.id}>
          <Link href={`/dashboard/reading/${slug}/overview`} prefetch>
            <div
              className={`px-2 py-1 rounded-md text-sm leading-snug transition-colors ${
                isActive
                  ? 'text-primary font-semibold bg-primary/8'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
              }`}
              style={{ fontFamily: 'system-ui' }}
            >
              {b.name}
            </div>
          </Link>
          {isActive && (
            <div className="grid grid-cols-5 gap-0.5 my-1.5 px-1">
              {Array.from({ length: b.chapters }, (_, i) => i + 1).map((ch) => (
                <Link
                  key={ch}
                  href={`/dashboard/reading/${slug}/${ch}?translation=${translation}`}
                  prefetch
                >
                  <div
                    className={`text-[11px] text-center py-0.5 rounded cursor-pointer transition-colors font-medium ${
                      ch === activeChapter
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
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
    <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-border overflow-hidden bg-background">
      {/* OT / NT / Apoc / CF tabs */}
      <div className="flex border-b border-border shrink-0">
        {(['OT', 'NT', 'Apoc', 'CF'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSidebarTab(tab)}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${
              sidebarTab === tab
                ? 'text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontFamily: 'system-ui' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {sidebarTab === 'OT' &&
          OT_CATEGORIES.map((cat) => (
            <div key={cat.label} className="mb-3">
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2 py-1" style={{ fontFamily: 'system-ui' }}>
                {cat.label}
              </p>
              {renderBooks(cat.ids)}
            </div>
          ))}

        {sidebarTab === 'NT' &&
          NT_CATEGORIES.map((cat) => (
            <div key={cat.label} className="mb-3">
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2 py-1" style={{ fontFamily: 'system-ui' }}>
                {cat.label}
              </p>
              {renderBooks(cat.ids)}
            </div>
          ))}

        {sidebarTab === 'Apoc' &&
          APOC_CATEGORIES.map((cat) => {
            const books = APOC_BOOKS.filter((b) => (cat.ids as readonly number[]).includes(b.id))
            return (
              <div key={cat.label} className="mb-3">
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2 py-1" style={{ fontFamily: 'system-ui' }}>
                  {cat.label}
                </p>
                {books.map((b) => (
                  <a key={b.id} href={b.externalUrl} target="_blank" rel="noopener noreferrer">
                    <div className="px-2 py-1 rounded-md text-sm leading-snug transition-colors text-foreground/70 hover:text-foreground hover:bg-muted/50 flex items-center justify-between" style={{ fontFamily: 'system-ui' }}>
                      <span>{b.name}</span>
                      <span className="text-[9px] text-muted-foreground/30 font-mono">{b.chapters}ch</span>
                    </div>
                  </a>
                ))}
              </div>
            )
          })}

        {sidebarTab === 'CF' && (
          <div>
            {!writingsLoaded && (
              <div className="space-y-1 px-1 pt-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted rounded animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            )}
            {writings.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2 py-1" style={{ fontFamily: 'system-ui' }}>
                  Church Fathers
                </p>
                {writings.map((w) => {
                  const isActive = w.slug === activePatristicSlug
                  return (
                    <Link key={w.slug} href={`/dashboard/church-fathers/${w.slug}`}>
                      <div
                        className={`px-2 py-1.5 rounded-md leading-snug transition-colors ${
                          isActive
                            ? 'text-primary font-semibold bg-primary/8'
                            : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                        }`}
                        style={{ fontFamily: 'system-ui' }}
                      >
                        <p className="text-sm truncate">{w.title}</p>
                        <p className="text-[10px] text-muted-foreground/60 truncate">{w.father_name}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  )
}
