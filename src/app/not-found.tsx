import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary font-bold text-3xl"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        K
      </div>
      <p className="text-xs tracking-[0.25em] uppercase text-primary/60 mb-3" style={{ fontFamily: 'var(--font-inter), system-ui' }}>
        404
      </p>
      <h1
        className="text-4xl font-light text-foreground mb-3"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
      >
        Page not found
      </h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-sm" style={{ fontFamily: 'var(--font-inter), system-ui' }}>
        This page doesn&apos;t exist. But there are 31,102 verses waiting for you.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
      </div>
    </div>
  )
}
