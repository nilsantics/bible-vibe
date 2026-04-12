import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronRight, ChevronLeft, BookMarked, Scroll } from 'lucide-react'
import { BookSidebar } from '@/components/book-sidebar'
import { MobileBookDrawer } from '@/components/mobile-book-drawer'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ s?: string }>
}

export default async function PatristicReaderPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { s } = await searchParams
  const sectionNum = s ? parseInt(s) : 1

  const supabase = await createClient()

  const { data: writing } = await supabase
    .from('patristic_writings')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!writing) notFound()

  const { data: section } = await supabase
    .from('patristic_sections')
    .select('*')
    .eq('writing_id', writing.id)
    .eq('section_number', sectionNum)
    .single()

  const { data: allSections } = await supabase
    .from('patristic_sections')
    .select('section_number, title')
    .eq('writing_id', writing.id)
    .order('section_number')

  const sections = allSections ?? []
  const prevSection = sectionNum > 1 ? sectionNum - 1 : null
  const nextSection = sectionNum < writing.total_sections ? sectionNum + 1 : null
  const currentSection = sections.find((s) => s.section_number === sectionNum)

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>
      <Suspense fallback={<aside className="hidden lg:flex w-52 shrink-0 border-r border-border bg-background" />}>
        <BookSidebar />
      </Suspense>

      <div className="flex-1 overflow-y-auto min-w-0">
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Mobile sticky nav bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border -mx-4 px-4 py-2 mb-4 flex items-center gap-2">
        <Suspense fallback={null}>
          <MobileBookDrawer label={writing.father_name} />
        </Suspense>
        <Link href="/dashboard/church-fathers" className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0" style={{ fontFamily: 'system-ui' }}>
          ← All Fathers
        </Link>
        <span className="text-muted-foreground/30 text-xs">·</span>
        <span className="text-xs text-foreground/70 truncate font-medium" style={{ fontFamily: 'system-ui' }}>{writing.title}</span>
      </div>

      {/* Mobile section picker — horizontal scroll */}
      {sections.length > 0 && (
        <div className="lg:hidden -mx-4 px-4 mb-5 overflow-x-auto flex gap-1.5 pb-1 scrollbar-hide">
          {sections.map((sec) => (
            <Link
              key={sec.section_number}
              href={`/dashboard/church-fathers/${slug}?s=${sec.section_number}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                sec.section_number === sectionNum
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground bg-muted/40 active:bg-muted'
              }`}
              style={{ fontFamily: 'system-ui' }}
            >
              {sec.section_number}. {sec.title ? (sec.title.length > 20 ? sec.title.slice(0, 20) + '…' : sec.title) : `§${sec.section_number}`}
            </Link>
          ))}
        </div>
      )}

      {/* Breadcrumb — desktop only */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground mb-6" style={{ fontFamily: 'system-ui' }}>
        <Link href="/dashboard/church-fathers" className="hover:text-foreground transition-colors">
          Church Fathers
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate">{writing.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Scroll className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-0.5" style={{ fontFamily: 'system-ui' }}>
              {writing.tradition} · {writing.era}
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {writing.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>
              {writing.father_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar — section list */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="p-3 border-border">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1" style={{ fontFamily: 'system-ui' }}>
              Sections
            </p>
            <div className="space-y-0.5">
              {sections.map((sec) => (
                <Link
                  key={sec.section_number}
                  href={`/dashboard/church-fathers/${slug}?s=${sec.section_number}`}
                >
                  <div className={`px-2 py-1.5 rounded-md text-xs leading-snug transition-colors ${
                    sec.section_number === sectionNum
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`} style={{ fontFamily: 'system-ui' }}>
                    {sec.section_number}. {sec.title}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Main reading area */}
        <div className="lg:col-span-3 order-1 lg:order-2">

          {/* Section header */}
          {section && (
            <div className="mb-6">
              <p className="text-xs text-muted-foreground/60 font-mono mb-1" style={{ fontFamily: 'monospace' }}>
                Section {sectionNum} of {writing.total_sections}
              </p>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                {section.title ?? currentSection?.title}
              </h2>
            </div>
          )}

          {/* Content */}
          {section ? (
            <div
              className="prose prose-base max-w-none text-foreground leading-relaxed"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.1rem', lineHeight: '1.85' }}
            >
              {section.content.split('\n\n').map((para: string, i: number) => (
                <p key={i} className="mb-5">
                  {para.trim()}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm" style={{ fontFamily: 'system-ui' }}>
                This section hasn&apos;t been loaded yet.
              </p>
              <p className="text-xs mt-1 opacity-60" style={{ fontFamily: 'system-ui' }}>
                Run the seed script to populate all sections.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            {prevSection ? (
              <Link href={`/dashboard/church-fathers/${slug}?s=${prevSection}`}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: 'system-ui' }}>
                  <ChevronLeft className="w-4 h-4" />
                  <span>
                    {sections.find((s) => s.section_number === prevSection)?.title ?? `Section ${prevSection}`}
                  </span>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextSection ? (
              <Link href={`/dashboard/church-fathers/${slug}?s=${nextSection}`}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: 'system-ui' }}>
                  <span>
                    {sections.find((s) => s.section_number === nextSection)?.title ?? `Section ${nextSection}`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <Link href="/dashboard/church-fathers">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline" style={{ fontFamily: 'system-ui' }}>
                  Back to all writings
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}
