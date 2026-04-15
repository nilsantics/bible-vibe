import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProCheckoutButton } from '@/components/pro-checkout-button'
import {
  Sparkles, GitBranch, MessageSquare,
  Search, Languages, ArrowRight, Check,
  FileText, GraduationCap, Target, Zap,
  BookOpen, ScrollText,
} from 'lucide-react'

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-bold text-primary-foreground text-sm shrink-0"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>K</div>
      <span className="font-bold text-base tracking-tight"
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Kairos</span>
    </div>
  )
}

const FREE_FEATURES = [
  'Full Bible — 4 translations',
  '430,000 cross-references',
  'Highlights & study notes',
  'Reading plans & streaks',
  'Verse discovery by topic',
  '10 AI explanations / day',
  'Bible quiz & memorization',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited Ezra AI conversations',
  'Scholar mode — deep theology',
  'Hebrew & Greek interlinear',
  'Full chapter commentary',
  'Church Fathers writings',
  'AI note synthesis',
]

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Ezra — your AI study companion',
    desc: 'Ask anything about what you\'re reading. Ezra draws on historical context, original languages, and 2,000 years of Christian scholarship — not generic AI.',
    wide: true,
  },
  {
    icon: Target,
    title: 'Find verses by what you\'re going through',
    desc: 'Type a struggle or goal — "dealing with fear", "learning to forgive" — and Kairos surfaces the passages that actually speak to it. Not keyword search.',
    wide: false,
  },
  {
    icon: Languages,
    title: 'Original languages, made readable',
    desc: "Every Hebrew and Greek word with Strong's numbers, Thayer's and BDB definitions. Tap any word in the reader to see it instantly.",
    wide: false,
  },
  {
    icon: GitBranch,
    title: '430,000 cross-references',
    desc: 'Every verse connected to related passages from the Treasury of Scripture Knowledge — the same reference scholars have used for 200 years.',
    wide: false,
  },
  {
    icon: FileText,
    title: 'Study notes that think with you',
    desc: 'Write notes alongside any passage. Quote verses directly. Then let AI surface connections across everything you\'ve written.',
    wide: false,
  },
  {
    icon: ScrollText,
    title: 'Church Fathers in their own words',
    desc: 'Read Augustine\'s Confessions, Athanasius on the Incarnation, Justin Martyr\'s Apology — the earliest Christian commentary.',
    wide: true,
  },
  {
    icon: MessageSquare,
    title: '4 translations, side by side',
    desc: 'ESV, BSB, WEB, and KJV. Switch instantly while reading. Each reflects a different manuscript tradition and translation philosophy.',
    wide: false,
  },
  {
    icon: Search,
    title: 'Search all 31,102 verses',
    desc: 'Full-text search across the entire Bible, filtered by book, testament, or translation. Find any word or phrase in seconds.',
    wide: false,
  },
  {
    icon: GraduationCap,
    title: 'Tradition-aware explanations',
    desc: 'Reading as a Catholic, Reformed, or Orthodox Christian? Set your tradition and Ezra shapes its answers around the theology you actually hold.',
    wide: true,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="gap-1.5">
                Start free <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero — asymmetric two-column ── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        {/* Atmospheric blur — off-center right */}
        <div className="absolute top-0 right-0 w-[700px] h-[600px] bg-accent/8 rounded-full blur-[140px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[300px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-16 items-center">
          {/* Left: headline + CTAs */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 rounded-full px-4 py-1.5 mb-8">
              <Sparkles className="w-3 h-3 text-accent" />
              <span className="text-xs font-medium text-accent/90" style={{ fontFamily: 'system-ui' }}>Free to start — no credit card needed</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
              className="text-6xl md:text-7xl lg:text-8xl font-light text-foreground leading-[1.0] tracking-tight mb-3">
              Most apps help you<br />read the Bible.
            </h1>
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', color: 'var(--accent)' }}
              className="text-6xl md:text-7xl lg:text-8xl font-semibold leading-[1.0] tracking-tight mb-8">
              Kairos helps you<br />
              understand it.
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed" style={{ fontFamily: 'system-ui' }}>
              AI explanations rooted in real scholarship. Original Hebrew and Greek. 430,000 cross-references. Church Fathers. Study notes with AI synthesis. All free to start.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  Start studying free
                </Button>
              </Link>
              <Link href="/dashboard/reading/john/3">
                <Button size="lg" variant="outline" className="h-12 px-8 text-sm border-accent/30 hover:border-accent/60 hover:bg-accent/5">
                  Try it — John 3 →
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-4" style={{ fontFamily: 'system-ui' }}>
              No download · No credit card · Works in your browser
            </p>
          </div>

          {/* Right: floating app preview */}
          <div className="hidden lg:block relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-accent/12 via-primary/8 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-border/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-border/80" />
                </div>
                <p className="text-[10px] text-muted-foreground/40 ml-2 flex-1 text-center" style={{ fontFamily: 'system-ui' }}>
                  studykairos.com
                </p>
              </div>
              {/* App interior */}
              <div className="grid grid-cols-[1fr_1fr]">
                {/* Bible text pane */}
                <div className="p-5 border-r border-border/40">
                  <p className="text-sm font-bold mb-0.5" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>John</p>
                  <p className="text-[10px] text-muted-foreground mb-4" style={{ fontFamily: 'system-ui' }}>Chapter 3 · ESV</p>
                  <div className="text-[11px] leading-7 text-foreground/75" style={{ fontFamily: 'Georgia, serif' }}>
                    <span>
                      <sup className="text-[8px] text-primary/50 mr-0.5 font-bold">1</sup>
                      There was a man of the Pharisees named Nicodemus...{' '}
                    </span>
                    <span className="bg-accent/15 ring-1 ring-accent/30 rounded px-0.5">
                      <sup className="text-[8px] text-accent/70 mr-0.5 font-bold">16</sup>
                      For God so loved the world, that he gave his only Son...
                    </span>
                  </div>
                </div>
                {/* Ezra panel */}
                <div className="p-4 bg-muted/20 space-y-2.5">
                  <p className="text-[9px] font-bold text-accent uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>John 3:16</p>
                  <div className="bg-card rounded-xl p-3 border border-border/50">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5" style={{ fontFamily: 'system-ui' }}>Ezra explains</p>
                    <p className="text-[10px] text-foreground/80 leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                      &ldquo;Loved&rdquo; is{' '}
                      <span className="font-mono text-primary bg-primary/10 px-1 rounded text-[9px]">G25</span>{' '}
                      <strong>ἠγάπησεν</strong> — unconditional, self-giving love...
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border/50">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5" style={{ fontFamily: 'system-ui' }}>Cross-references</p>
                    {['Romans 5:8', '1 John 4:9'].map(ref => (
                      <div key={ref} className="flex items-center gap-1.5 text-[10px] text-primary mb-1" style={{ fontFamily: 'system-ui' }}>
                        <div className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />{ref}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.2em] uppercase text-accent/70 mb-4 font-medium" style={{ fontFamily: 'system-ui' }}>Why Kairos exists</p>
            <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              The other options are great.<br />
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>They each solve half the problem.</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto" style={{ fontFamily: 'system-ui' }}>
              We&apos;re not here to replace them — we&apos;re fans of all three. But there&apos;s a gap no single app fills. Kairos tries to close it.
            </p>
          </div>

          <div className="space-y-3 mb-10">
            {/* YouVersion — sky blue */}
            <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 border-l-4 border-l-sky-500">
              <div>
                <p className="font-bold text-sm mb-1" style={{ fontFamily: 'system-ui' }}>YouVersion</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed" style={{ fontFamily: 'system-ui' }}>✓ Great for daily reading, streaks, and community</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground/60 uppercase font-semibold tracking-wide mb-1" style={{ fontFamily: 'system-ui' }}>The gap</p>
                <p className="text-sm text-foreground/70 leading-relaxed" style={{ fontFamily: 'system-ui' }}>Doesn&apos;t go deep. You can read the verse. You can&apos;t understand it.</p>
              </div>
            </div>

            {/* Logos — violet */}
            <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 border-l-4 border-l-violet-500">
              <div>
                <p className="font-bold text-sm mb-1" style={{ fontFamily: 'system-ui' }}>Logos Bible Software</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed" style={{ fontFamily: 'system-ui' }}>✓ The most powerful Bible software ever built</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground/60 uppercase font-semibold tracking-wide mb-1" style={{ fontFamily: 'system-ui' }}>The gap</p>
                <p className="text-sm text-foreground/70 leading-relaxed" style={{ fontFamily: 'system-ui' }}>$30–100/month and a learning curve that takes weeks. Built for pastors and academics, not everyday Christians.</p>
              </div>
            </div>

            {/* Blue Letter Bible — amber */}
            <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 border-l-4" style={{ borderLeftColor: 'var(--accent)' }}>
              <div>
                <p className="font-bold text-sm mb-1" style={{ fontFamily: 'system-ui' }}>Blue Letter Bible</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed" style={{ fontFamily: 'system-ui' }}>✓ Brilliant reference tool — Strong&apos;s, Thayer&apos;s, interlinears, all free</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground/60 uppercase font-semibold tracking-wide mb-1" style={{ fontFamily: 'system-ui' }}>The gap</p>
                <p className="text-sm text-foreground/70 leading-relaxed" style={{ fontFamily: 'system-ui' }}>Incredible data, but the UI is stuck in 2005. The depth is there — the experience isn&apos;t.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 text-center border" style={{ background: 'color-mix(in oklch, var(--accent) 6%, var(--background))', borderColor: 'color-mix(in oklch, var(--accent) 30%, transparent)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ fontFamily: 'system-ui', color: 'var(--accent)' }}>The Kairos idea</p>
            <p className="text-lg leading-relaxed text-foreground/85" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              What if you had YouVersion&apos;s accessibility, Blue Letter Bible&apos;s depth, and Logos&apos;s scholarly tools — in one app, free to start, that actually feels good to use?
            </p>
          </div>
        </div>
      </section>

      {/* ── Features — mosaic grid ── */}
      <section className="py-20 px-6 border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.2em] uppercase mb-3 font-medium" style={{ fontFamily: 'system-ui', color: 'var(--accent)' }}>What&apos;s inside</p>
            <h2 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              A seminary library. <span className="font-semibold" style={{ color: 'var(--accent)' }}>In your pocket.</span>
            </h2>
          </div>

          {/* Mosaic: varied column spans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Ezra — wide hero card */}
            <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-colors"
                style={{ background: 'color-mix(in oklch, var(--accent) 12%, transparent)' }}>
                <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'system-ui' }}>Ezra — your AI study companion</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                Ask anything about what you&apos;re reading. Ezra draws on historical context, original languages, and 2,000 years of Christian scholarship — not generic AI responses.
              </p>
            </div>

            {/* Verse Discovery — tall */}
            <div className="md:row-span-2 bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors group flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'system-ui' }}>Find verses by what you&apos;re going through</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1" style={{ fontFamily: 'system-ui' }}>
                Type a struggle or goal — &ldquo;dealing with fear&rdquo;, &ldquo;learning to forgive&rdquo; — and Kairos surfaces the passages that actually speak to it.
              </p>
              <div className="mt-6 rounded-xl bg-muted/60 p-3 border border-border/40">
                <p className="text-[10px] text-muted-foreground mb-2" style={{ fontFamily: 'system-ui' }}>Example search:</p>
                <p className="text-xs font-medium italic" style={{ fontFamily: 'Georgia, serif' }}>&ldquo;dealing with anxiety&rdquo;</p>
                <div className="mt-2 space-y-1">
                  {['Philippians 4:6', 'Habakkuk 3:17', 'Matthew 6:25'].map(v => (
                    <div key={v} className="text-[10px] text-primary flex items-center gap-1" style={{ fontFamily: 'system-ui' }}>
                      <div className="w-1 h-1 rounded-full bg-primary/50" />{v}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <Languages className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: 'system-ui' }}>Original languages, made readable</h3>
              <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>Every Hebrew and Greek word with Strong&apos;s numbers, Thayer&apos;s and BDB definitions. Tap any word to see it instantly.</p>
            </div>

            {/* Cross-refs */}
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <GitBranch className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: 'system-ui' }}>430,000 cross-references</h3>
              <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>Every verse connected to related passages from the Treasury of Scripture Knowledge — used by scholars for 200 years.</p>
            </div>

            {/* Study Notes */}
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: 'system-ui' }}>Study notes that think with you</h3>
              <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>Write notes alongside any passage. Then let AI surface connections across everything you&apos;ve written — themes you hadn&apos;t noticed.</p>
            </div>

            {/* Church Fathers — wide */}
            <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <ScrollText className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: 'system-ui' }}>Church Fathers in their own words</h3>
              <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                Read Augustine&apos;s Confessions, Athanasius on the Incarnation, Justin Martyr&apos;s Apology — the earliest Christian commentary on Scripture, readable alongside the text.
              </p>
            </div>

            {/* Translations */}
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: 'system-ui' }}>4 translations, side by side</h3>
              <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>ESV, BSB, WEB, and KJV. Switch instantly while reading. Each reflects a different tradition and translation philosophy.</p>
            </div>

            {/* Search */}
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: 'system-ui' }}>Search all 31,102 verses</h3>
              <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>Full-text search across the entire Bible, filtered by book, testament, or translation. Find any word or phrase in seconds.</p>
            </div>

            {/* Tradition-aware — wide */}
            <div className="md:col-span-3 bg-card border rounded-2xl p-6 hover:border-primary/40 transition-colors group"
              style={{ borderColor: 'color-mix(in oklch, var(--accent) 25%, var(--border))' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: 'color-mix(in oklch, var(--accent) 10%, transparent)' }}>
                  <GraduationCap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'system-ui' }}>Tradition-aware explanations</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl" style={{ fontFamily: 'system-ui' }}>
                    Reading as a Catholic, Reformed, or Orthodox Christian? Set your tradition and Ezra shapes its answers around the theology you actually hold. Not a one-size-fits-all AI.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Catholic', 'Reformed', 'Lutheran', 'Orthodox', 'Baptist', 'Non-denominational'].map(t => (
                      <span key={t} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted border border-border" style={{ fontFamily: 'system-ui' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: '31,102', label: 'Verses' },
            { value: '430K',   label: 'Cross-references' },
            { value: '14,100', label: 'Hebrew & Greek words' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-semibold"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', color: 'var(--accent)' }}>{s.value}</p>
              <p className="text-[11px] tracking-widest uppercase text-muted-foreground mt-1 font-medium" style={{ fontFamily: 'system-ui' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 border-t border-border bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.2em] uppercase mb-3 font-medium" style={{ fontFamily: 'system-ui', color: 'var(--accent)' }}>How it works</p>
            <h2 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Study deeper in <span className="font-semibold" style={{ color: 'var(--accent)' }}>three steps.</span>
            </h2>
          </div>
          <div className="space-y-6">
            {[
              { n: '01', title: 'Open any passage', desc: 'Navigate by book and chapter, use full-text search, or let Kairos suggest a starting point based on your goal.' },
              { n: '02', title: 'Tap any verse to go deeper', desc: 'The study panel opens instantly — Ezra explains it, cross-references link out, original words expand, and you can highlight, bookmark, or quote it into your notes.' },
              { n: '03', title: 'Build understanding over time', desc: 'Your notes, highlights, and study sessions accumulate. AI surfaces connections across everything you\'ve written. Reading becomes studying.' },
            ].map((step) => (
              <div key={step.n} className="flex gap-5 items-start">
                <span className="text-3xl font-light tabular-nums shrink-0 leading-none mt-1"
                  style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', color: 'color-mix(in oklch, var(--accent) 40%, transparent)' }}>{step.n}</span>
                <div>
                  <h3 className="font-semibold mb-1" style={{ fontFamily: 'system-ui' }}>{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase mb-10 text-center font-medium"
            style={{ fontFamily: 'system-ui', color: 'var(--accent)' }}>What readers say</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { quote: "I've been studying the Bible for 20 years. Kairos surfaces things I never would have found — the verse discovery feature alone is worth it.", name: 'Sarah W.', role: 'Sunday school teacher' },
              { quote: "The original language tools and Church Fathers section are what I'd normally need Logos for. This is Logos for people who aren't pastors.", name: 'Marcus T.', role: 'Seminary student' },
              { quote: "I searched 'dealing with anxiety' and it found Habakkuk 3 — a passage I'd never connected to that struggle. That's not something keyword search finds.", name: 'David K.', role: 'Daily reader' },
            ].map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-xl p-5 space-y-4">
                <p className="text-sm leading-relaxed text-foreground/80 italic" style={{ fontFamily: 'Georgia, serif' }}>&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{t.name}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 px-6 border-t border-border bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.2em] uppercase mb-3 font-medium"
              style={{ fontFamily: 'system-ui', color: 'var(--accent)' }}>Pricing</p>
            <h2 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Free to start. <span className="font-semibold" style={{ color: 'var(--accent)' }}>Pro to go further.</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto" style={{ fontFamily: 'system-ui' }}>
              The free plan has more than most apps charge for. Pro unlocks unlimited AI and the full depth of the library.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div>
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1 font-medium" style={{ fontFamily: 'system-ui' }}>Free</p>
                <p className="text-4xl font-light" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>$0</p>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>Always free. No card needed.</p>
              </div>
              <div className="h-px bg-border" />
              <ul className="space-y-2.5">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ fontFamily: 'system-ui' }}>
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full h-10 text-sm">Get started free</Button>
              </Link>
            </div>
            <div className="bg-foreground rounded-2xl p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs tracking-widest uppercase text-background/50 font-medium" style={{ fontFamily: 'system-ui' }}>Pro</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'var(--accent)', color: 'var(--accent-foreground)', fontFamily: 'system-ui' }}>Most popular</span>
                </div>
                <p className="text-4xl font-light text-background" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  $9.99<span className="text-xl opacity-40"> /mo</span>
                </p>
                <p className="text-xs text-background/40 mt-0.5" style={{ fontFamily: 'system-ui' }}>or $89 / year · save 26%</p>
              </div>
              <div className="h-px bg-background/10" />
              <ul className="space-y-2.5">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ fontFamily: 'system-ui' }}>
                    <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="text-background/75">{f}</span>
                  </li>
                ))}
              </ul>
              <ProCheckoutButton />
            </div>
          </div>
        </div>
      </section>

      {/* ── For who ── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.2em] uppercase mb-4 font-medium"
            style={{ fontFamily: 'system-ui', color: 'var(--accent)' }}>Who uses Kairos</p>
          <h2 className="text-3xl font-light mb-10" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Built for anyone who takes Scripture seriously.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Daily readers', desc: 'Who want to understand, not just check a box' },
              { label: 'Small group leaders', desc: 'Who prepare to teach, not just read aloud' },
              { label: 'New believers', desc: 'Who have questions every other verse' },
              { label: 'Lifelong students', desc: 'Who still find things they haven\'t noticed' },
            ].map((w) => (
              <div key={w.label} className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors">
                <p className="font-semibold text-sm mb-1" style={{ fontFamily: 'system-ui' }}>{w.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6 text-center border-t border-border relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-accent/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative max-w-xl mx-auto space-y-6">
          <h2 className="text-4xl md:text-5xl font-light leading-tight" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            The Bible hasn&apos;t changed.<br />
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>The way you study it can.</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed" style={{ fontFamily: 'system-ui' }}>
            Start free. No download. No credit card. Just open a passage and see what you&apos;ve been missing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-10 text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                Start for free
              </Button>
            </Link>
            <Link href="/dashboard/reading/john/3">
              <Button size="lg" variant="outline" className="h-12 px-10 text-sm border-accent/30 hover:border-accent/60 hover:bg-accent/5">
                Preview — John 3
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Wordmark />
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Contact', href: 'mailto:nils@studykairos.com' }].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: 'system-ui' }}>{label}</Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/40 sm:text-right" style={{ fontFamily: 'system-ui' }}>WEB & KJV public domain · ESV used with permission</p>
        </div>
      </footer>
    </div>
  )
}
