'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Search, BarChart2, LayoutDashboard,
  MoreHorizontal, CalendarDays, BrainCircuit,
  Bookmark, HelpCircle, Settings, LogOut, Sun, Moon, X, FileText, Languages,
  Sparkles, Map, GraduationCap, History,
} from 'lucide-react'

type ReadingTheme = 'light' | 'dark' | 'sepia'

const mainItems = [
  { href: '/dashboard',               label: 'Home',     icon: LayoutDashboard, match: (p: string) => p === '/dashboard' || p === '/dashboard/home' },
  { href: '/dashboard/reading/genesis/1', label: 'Read', icon: BookOpen,        match: (p: string) => p.startsWith('/dashboard/reading') },
  { href: '/dashboard/topics',        label: 'Discover', icon: Sparkles,        match: (p: string) => p.startsWith('/dashboard/topics') },
  { href: '/dashboard/notes',         label: 'Notes',    icon: FileText,        match: (p: string) => p.startsWith('/dashboard/notes') },
]

const moreItems = [
  // Study
  { href: '/dashboard/search',        label: 'Search',        icon: Search,        section: 'Study' },
  { href: '/dashboard/plans',         label: 'Reading Plans', icon: CalendarDays,  section: 'Study' },
  { href: '/dashboard/study-history', label: 'Study History', icon: History,       section: 'Study' },
  { href: '/dashboard/bookmarks',     label: 'Bookmarks',     icon: Bookmark,      section: 'Study' },
  // Learn
  { href: '/dashboard/quiz',          label: 'Quiz',          icon: HelpCircle,    section: 'Learn' },
  { href: '/dashboard/memorize',      label: 'Memorize',      icon: BrainCircuit,  section: 'Learn' },
  { href: '/dashboard/aleph-bet',     label: 'Hebrew Alphabet', icon: Languages,   section: 'Learn' },
  { href: '/dashboard/maps',          label: 'Maps & Timelines', icon: Map,         section: 'Learn' },
  { href: '/dashboard/church-fathers',label: 'Church Fathers', icon: GraduationCap, section: 'Learn' },
  // Account
  { href: '/dashboard/progress',      label: 'Progress',      icon: BarChart2,     section: 'Account' },
  { href: '/dashboard/settings',      label: 'Settings',      icon: Settings,      section: 'Account' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light')

  useEffect(() => {
    const saved = (localStorage.getItem('bv_reading_theme') ?? 'light') as ReadingTheme
    setReadingTheme(saved)
  }, [])

  function applyReadingTheme(t: ReadingTheme) {
    document.documentElement.classList.remove('sepia')
    if (t === 'sepia') {
      document.documentElement.classList.add('sepia')
      setTheme('light')
    } else {
      setTheme(t === 'dark' ? 'dark' : 'light')
    }
  }

  function cycleTheme() {
    const order: ReadingTheme[] = ['light', 'sepia', 'dark']
    const next = order[(order.indexOf(readingTheme) + 1) % order.length]
    setReadingTheme(next)
    localStorage.setItem('bv_reading_theme', next)
    applyReadingTheme(next)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const themeLabel = readingTheme === 'dark' ? 'Dark' : readingTheme === 'sepia' ? 'Sepia' : 'Light'
  const ThemeIcon = readingTheme === 'dark' ? Moon : Sun

  // Close drawer when navigating
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-stretch h-16">
          {mainItems.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-normal'}`} style={{ fontFamily: 'system-ui' }}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              open ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] leading-none font-normal" style={{ fontFamily: 'system-ui' }}>More</span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-16 left-0 right-0 z-50 sm:hidden bg-card border-t border-border rounded-t-2xl shadow-2xl overflow-hidden">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 absolute left-1/2 -translate-x-1/2 top-3" />
              <p className="text-sm font-semibold mt-1" style={{ fontFamily: 'system-ui' }}>More</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav links — grouped by section */}
            <div className="px-2 pb-2 max-h-[60vh] overflow-y-auto">
              {(['Study', 'Learn', 'Account'] as const).map((section) => {
                const items = moreItems.filter(i => i.section === section)
                return (
                  <div key={section}>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-3 pt-3 pb-1" style={{ fontFamily: 'system-ui' }}>{section}</p>
                    {items.map((item) => {
                      const active = pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                            active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}

              {/* Divider */}
              <div className="my-2 border-t border-border" />

              {/* Theme toggle */}
              <button
                onClick={cycleTheme}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted/60 transition-colors"
              >
                {readingTheme === 'dark' ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : readingTheme === 'sepia' ? (
                  <span className="w-5 h-5 flex items-center justify-center text-base">📜</span>
                ) : (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>Theme: {themeLabel}</span>
                <span className="ml-auto text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>tap to cycle</span>
              </button>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
