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
  Bookmark,
  BrainCircuit,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type ReadingTheme = 'light' | 'dark' | 'sepia'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User | null
  streak: number
}

const navLinks = [
  { href: '/dashboard/reading/genesis/1', label: 'Read',      icon: BookOpen },
  { href: '/dashboard/search',            label: 'Search',    icon: Search },
  { href: '/dashboard/plans',             label: 'Plans',     icon: CalendarDays },
  { href: '/dashboard/memorize',          label: 'Memorize',  icon: BrainCircuit },
  { href: '/dashboard/progress',          label: 'Progress',  icon: BarChart2 },
]

export function DashboardNav({ user, streak }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light')

  useEffect(() => {
    const saved = (localStorage.getItem('bv_reading_theme') ?? 'light') as ReadingTheme
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
    localStorage.setItem('bv_reading_theme', next)
    applyReadingTheme(next)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'GU'

  return (
    <header
      className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border"
      data-ui
    >
      <div className="max-w-5xl mx-auto px-4 h-13 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">✦</span>
          <span
            className="font-semibold text-base tracking-tight hidden sm:block"
            style={{ fontFamily: 'system-ui' }}
          >
            Bible Vibe
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5" data-ui>
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href.split('/').slice(0, 3).join('/'))
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1.5 text-sm"
                >
                  <link.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0" data-ui>
          {/* Live streak */}
          {user && (
            <div className="hidden sm:flex items-center gap-1 text-sm font-medium text-orange-500">
              <span className={streak > 0 ? 'streak-fire' : ''}>🔥</span>
              <span style={{ fontFamily: 'system-ui' }}>{streak}</span>
            </div>
          )}

          {/* Theme cycle: light → sepia → dark */}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={cycleTheme}
            aria-label={`Switch theme (current: ${readingTheme})`}
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
                <Button variant="ghost" className="rounded-full w-8 h-8 p-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p
                    className="text-xs text-muted-foreground truncate"
                    style={{ fontFamily: 'system-ui' }}
                  >
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 text-destructive focus:text-destructive"
                >
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
