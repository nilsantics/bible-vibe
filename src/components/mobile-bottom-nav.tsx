'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Search, BarChart2, LayoutDashboard, BrainCircuit } from 'lucide-react'

const navItems = [
  { href: '/dashboard',                    label: 'Home',     icon: LayoutDashboard, match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/reading/genesis/1',  label: 'Read',     icon: BookOpen,        match: (p: string) => p.startsWith('/dashboard/reading') },
  { href: '/dashboard/search',             label: 'Search',   icon: Search,          match: (p: string) => p.startsWith('/dashboard/search') },
  { href: '/dashboard/memorize',           label: 'Memorize', icon: BrainCircuit,    match: (p: string) => p.startsWith('/dashboard/memorize') },
  { href: '/dashboard/progress',           label: 'Progress', icon: BarChart2,       match: (p: string) => p.startsWith('/dashboard/progress') },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span
                className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-normal'}`}
                style={{ fontFamily: 'system-ui' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
