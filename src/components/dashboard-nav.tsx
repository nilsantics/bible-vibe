'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  BookOpen,
  Search,
  BarChart2,
  Settings,
  LogOut,
  LogIn,
  Moon,
  Sun,
  Flame,
  CalendarDays,
  BrainCircuit,
  FileText,
  Languages,
  HelpCircle,
  Zap,
  ChevronDown,
  History,
  LayoutDashboard,
  Sparkles,
  Map,
  BookMarked,
  GraduationCap,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

type ReadingTheme = 'light' | 'dark' | 'sepia'

interface Props {
  user: User | null
  streak: number
  isPro: boolean
}

const STUDY_ITEMS = [
  { href: '/dashboard/home',         label: 'Dashboard',     icon: LayoutDashboard, desc: 'Plans, streaks & stats' },
  { href: '/dashboard/search',       label: 'Search',        icon: Search,          desc: 'Search the Bible' },
  { href: '/dashboard/plans',        label: 'Reading Plans', icon: CalendarDays,    desc: 'Guided multi-week journeys' },
  { href: '/dashboard/study-history',label: 'Study History', icon: History,         desc: 'Highlights, notes & bookmarks' },
  { href: '/dashboard/memorize',     label: 'Memorize',      icon: BrainCircuit,    desc: 'Flashcard verse memory' },
  { href: '/dashboard/progress',     label: 'Progress',      icon: BarChart2,       desc: 'XP, levels & badges' },
]

const LIBRARY_ITEMS = [
  { href: '/dashboard/quiz',         label: 'Bible Quiz',    icon: HelpCircle,      desc: 'Test your knowledge' },
  { href: '/dashboard/aleph-bet',    label: 'Hebrew Alphabet', icon: Languages,     desc: 'Learn the Aleph-Bet' },
  { href: '/dashboard/notes',        label: 'My Notes',      icon: FileText,        desc: 'All your study notes' },
  { href: '/dashboard/maps',         label: 'Biblical Maps', icon: Map,             desc: 'Geography of Scripture' },
  { href: '/dashboard/topics',       label: 'Topics',        icon: BookMarked,      desc: 'Browse by theme' },
]

export function DashboardNav({ user, streak, isPro }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { setTheme } = useTheme()
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light')

  useEffect(() => {
    const saved = (localStorage.getItem('kairos_reading_theme') ?? 'light') as ReadingTheme
    setReadingTheme(saved)
    applyReadingTheme(saved)
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
    localStorage.setItem('kairos_reading_theme', next)
    applyReadingTheme(next)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'GU'
  const isReading = pathname.startsWith('/dashboard/reading')
  const isStudy = STUDY_ITEMS.some((s) => pathname.startsWith(s.href) && s.href !== '/dashboard') || pathname === '/dashboard'
  const isLibrary = LIBRARY_ITEMS.some((s) => pathname.startsWith(s.href))

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border" data-ui>
      <div className="max-w-6xl mx-auto px-4 h-13 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-bold text-primary-foreground text-sm shrink-0"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            K
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:block"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Kairos
          </span>
        </Link>

        {/* 3-section nav */}
        <nav className="hidden sm:flex items-center gap-1" data-ui>

          {/* Read — direct link */}
          <Link href="/dashboard/reading/genesis/1">
            <Button
              variant={isReading ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5 text-sm font-medium"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Read
            </Button>
          </Link>

          {/* Study dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`inline-flex items-center gap-1 rounded-md px-3 h-8 text-sm font-medium transition-colors outline-none ${isStudy ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}>
              Study
              <ChevronDown className="w-3 h-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1">
              {STUDY_ITEMS.map(({ href, label, icon: Icon, desc }) => (
                <DropdownMenuItem key={href} className="cursor-pointer" onClick={() => router.push(href)}>
                  <div className="flex items-start gap-3 px-1 py-1">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight" style={{ fontFamily: 'system-ui' }}>{label}</p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5" style={{ fontFamily: 'system-ui' }}>{desc}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Library dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`inline-flex items-center gap-1 rounded-md px-3 h-8 text-sm font-medium transition-colors outline-none ${isLibrary ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}>
              Library
              <ChevronDown className="w-3 h-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1">
              {LIBRARY_ITEMS.map(({ href, label, icon: Icon, desc }) => (
                <DropdownMenuItem key={href} className="cursor-pointer" onClick={() => router.push(href)}>
                  <div className="flex items-start gap-3 px-1 py-1">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight" style={{ fontFamily: 'system-ui' }}>{label}</p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5" style={{ fontFamily: 'system-ui' }}>{desc}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {!isPro && (
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => router.push('/dashboard/upgrade')}>
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium text-primary" style={{ fontFamily: 'system-ui' }}>
                    Start Free Trial
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0" data-ui>

          {/* Streak */}
          {user && (
            <div className="hidden sm:flex items-center gap-1 text-sm font-medium text-orange-500">
              <span className={streak > 0 ? 'streak-fire' : ''}>🔥</span>
              <span style={{ fontFamily: 'system-ui' }}>{streak}</span>
            </div>
          )}

          {/* Theme cycle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex w-8 h-8"
            onClick={cycleTheme}
            title={`Theme: ${readingTheme} — click to cycle`}
          >
            {readingTheme === 'dark' ? (
              <Moon className="w-4 h-4" />
            ) : readingTheme === 'sepia' ? (
              <span className="text-sm">📜</span>
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>

          {/* Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="rounded-full h-8 p-0 gap-1.5 px-1">
                  {isPro && (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" /> Pro
                    </span>
                  )}
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'system-ui' }}>
                    {user.email}
                  </p>
                  {isPro && (
                    <p className="text-xs font-semibold text-primary mt-0.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Kairos Pro
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/dashboard/study-history')}>
                  <History className="w-4 h-4" />
                  Study History
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isPro ? (
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/dashboard/upgrade')}>
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">Manage Pro</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/dashboard/upgrade')}>
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">Start Free Trial</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button size="sm" variant="outline" className="gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}