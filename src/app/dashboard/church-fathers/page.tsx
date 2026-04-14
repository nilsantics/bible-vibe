import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { BookMarked, ExternalLink, Users, BookOpen, Scroll, Church, ShieldAlert } from 'lucide-react'

// Writings available natively (must match slugs in patristic_writings table)
const NATIVE_SLUGS = [
  'didache',
  'polycarp-philippians',
  'ignatius-romans',
  'on-the-incarnation',
  'augustine-confessions',
  'justin-first-apology',
  'irenaeus-against-heresies-1',
]

const FATHERS = [
  {
    name: 'The Didache',
    father: 'Unknown (Apostolic)',
    dates: 'c. 50–120 AD',
    tradition: 'Apostolic Father',
    desc: 'The oldest surviving Christian catechism — Two Ways, baptism, Eucharist, fasting, and church order.',
    slug: 'didache',
    emoji: '📜',
    gradient: 'from-stone-600 to-stone-800',
  },
  {
    name: 'Epistle to the Philippians',
    father: 'Polycarp of Smyrna',
    dates: 'c. 110–140 AD',
    tradition: 'Apostolic Father',
    desc: 'Letter from the bishop of Smyrna — Christian conduct, refuting heresy, and the example of Ignatius.',
    slug: 'polycarp-philippians',
    emoji: '✉️',
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    name: 'Epistle to the Romans',
    father: 'Ignatius of Antioch',
    dates: 'c. 108 AD',
    tradition: 'Apostolic Father',
    desc: 'Written en route to martyrdom — Ignatius pleads not to be spared. "I am God\'s wheat."',
    slug: 'ignatius-romans',
    emoji: '⛓️',
    gradient: 'from-red-700 to-red-900',
  },
  {
    name: 'First Apology',
    father: 'Justin Martyr',
    dates: 'c. 155 AD',
    tradition: 'Apologist',
    desc: 'A defense of Christianity to the Emperor — includes the earliest description of Christian Sunday worship.',
    slug: 'justin-first-apology',
    emoji: '⚖️',
    gradient: 'from-blue-700 to-blue-900',
  },
  {
    name: 'Against Heresies — Book I',
    father: 'Irenaeus of Lyon',
    dates: 'c. 180 AD',
    tradition: 'Apologist',
    desc: 'Exposure of the Valentinian Gnostic system and defense of the apostolic Rule of Faith.',
    slug: 'irenaeus-against-heresies-1',
    emoji: '🛡️',
    gradient: 'from-emerald-700 to-emerald-900',
  },
  {
    name: 'On the Incarnation',
    father: 'Athanasius of Alexandria',
    dates: 'c. 318 AD',
    tradition: 'Nicene Father',
    desc: 'Why the Son of God became human. C.S. Lewis called it "one of the greatest theological works ever written."',
    slug: 'on-the-incarnation',
    emoji: '✝️',
    gradient: 'from-violet-700 to-violet-900',
  },
  {
    name: 'Confessions',
    father: 'Augustine of Hippo',
    dates: 'c. 397–400 AD',
    tradition: 'Latin Father',
    desc: 'The first autobiography — Augustine traces his sinful youth to dramatic conversion. "Our heart is restless until it rests in Thee."',
    slug: 'augustine-confessions',
    emoji: '📖',
    gradient: 'from-rose-700 to-rose-900',
  },
]

const EXTERNAL_FATHERS = [
  {
    name: 'Ignatius of Antioch',
    dates: 'c. 35–108 AD',
    tradition: 'Apostolic Father',
    desc: 'Seven letters to churches written en route to his martyrdom in Rome.',
    url: 'https://www.newadvent.org/fathers/0103.htm',
    emoji: '🕯️',
    gradient: 'from-stone-600 to-stone-800',
  },
  {
    name: 'Tertullian',
    dates: 'c. 155–220 AD',
    tradition: 'Latin Father',
    desc: 'First major Latin theologian. Coined the term "Trinity." Author of the Apology and Against Marcion.',
    url: 'https://www.newadvent.org/fathers/0301.htm',
    emoji: '⚔️',
    gradient: 'from-red-700 to-red-900',
  },
  {
    name: 'Origen of Alexandria',
    dates: 'c. 185–253 AD',
    tradition: 'Alexandrian',
    desc: 'Most prolific early Christian writer. On First Principles, Contra Celsum, and hundreds of homilies.',
    url: 'https://www.newadvent.org/fathers/0411.htm',
    emoji: '📜',
    gradient: 'from-amber-700 to-amber-900',
  },
  {
    name: 'Basil the Great',
    dates: 'c. 330–379 AD',
    tradition: 'Cappadocian Father',
    desc: 'On the Holy Spirit and Hexaemeron. Shaped Eastern monasticism and defended Trinitarian theology.',
    url: 'https://www.newadvent.org/fathers/3201.htm',
    emoji: '🌿',
    gradient: 'from-green-700 to-green-900',
  },
  {
    name: 'John Chrysostom',
    dates: 'c. 349–407 AD',
    tradition: 'Antiochene',
    desc: '"Golden-mouthed" — greatest preacher of the ancient church and master expositor of Paul.',
    url: 'https://www.newadvent.org/fathers/2001.htm',
    emoji: '🗣️',
    gradient: 'from-orange-700 to-orange-900',
  },
  {
    name: 'Jerome',
    dates: 'c. 345–420 AD',
    tradition: 'Latin Father',
    desc: 'Produced the Vulgate Bible. Greatest biblical scholar of antiquity.',
    url: 'https://www.newadvent.org/fathers/3001.htm',
    emoji: '📝',
    gradient: 'from-indigo-700 to-indigo-900',
  },
]

const RESOURCE_SECTIONS = [
  {
    icon: BookOpen,
    label: 'Complete Writings',
    desc: 'Full public-domain collections',
    links: [
      { label: 'New Advent — Fathers of the Church', url: 'https://www.newadvent.org/fathers/' },
      { label: 'CCEL — Early Church Fathers (38 volumes)', url: 'https://ccel.org/fathers' },
      { label: 'Tertullian.org — Latin Fathers', url: 'https://tertullian.org/fathers/' },
    ],
  },
  {
    icon: Church,
    label: 'Councils & Creeds',
    desc: 'The councils that defined orthodoxy',
    links: [
      { label: 'Nicene Creed (325 AD)', url: 'https://www.newadvent.org/fathers/3801.htm' },
      { label: 'Chalcedonian Definition (451 AD)', url: 'https://www.newadvent.org/fathers/3810.htm' },
      { label: 'Apostles\' Creed — Early Forms', url: 'https://www.newadvent.org/cathen/01629a.htm' },
    ],
  },
  {
    icon: ShieldAlert,
    label: 'Heresies & Orthodoxy',
    desc: 'Early theological controversies',
    links: [
      { label: 'Arianism — History & Refutation', url: 'https://www.newadvent.org/cathen/01707c.htm' },
      { label: 'Gnosticism — Early Church Response', url: 'https://www.newadvent.org/cathen/06592a.htm' },
      { label: 'Marcion & the Canon', url: 'https://www.newadvent.org/cathen/09645c.htm' },
    ],
  },
  {
    icon: Scroll,
    label: 'Topics & Theology',
    desc: 'Patristic thought by theme',
    links: [
      { label: 'Baptism in the Early Church', url: 'https://www.newadvent.org/cathen/02258b.htm' },
      { label: 'Eucharist — Patristic Writings', url: 'https://www.newadvent.org/cathen/05572c.htm' },
      { label: 'Eschatology — Ancient Views', url: 'https://www.newadvent.org/cathen/05530c.htm' },
    ],
  },
]

export default async function ChurchFathersPage() {
  const supabase = await createClient()

  // Check which native writings are actually seeded
  const { data: seeded } = await supabase
    .from('patristic_writings')
    .select('slug, total_sections')

  const seededMap = new Map((seeded ?? []).map((w) => [w.slug, w.total_sections]))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookMarked className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Church Fathers
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12 max-w-xl" style={{ fontFamily: 'system-ui' }}>
          The theologians, bishops, and martyrs of the early church — in their own words, natively on Kairos.
        </p>
      </div>

      {/* Intro banner */}
      <div className="rounded-2xl p-5 mb-8 border border-border bg-muted/30">
        <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest mb-2" style={{ fontFamily: 'system-ui' }}>
          Reading the Fathers
        </p>
        <p className="text-base leading-relaxed text-foreground/80 italic mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          &ldquo;The Church Fathers show us how the Bible was understood by those closest in time and culture to the apostles — a window into the living tradition of the faith.&rdquo;
        </p>
        <p className="text-xs text-muted-foreground/60" style={{ fontFamily: 'system-ui' }}>
          All texts public domain · 1st–5th century AD · Greek, Latin, and Syriac originals
        </p>
      </div>

      {/* Native writings grid */}
      <div className="mb-10">
        <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-4" style={{ fontFamily: 'system-ui' }}>
          Read on Kairos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FATHERS.map((writing) => {
            const isReady = seededMap.has(writing.slug)
            const sections = seededMap.get(writing.slug) ?? 0

            return isReady ? (
              <Link key={writing.slug} href={`/dashboard/church-fathers/${writing.slug}`}>
                <Card className="overflow-hidden border-border hover:border-primary/40 transition-colors group cursor-pointer h-full">
                  <div className={`h-14 bg-gradient-to-br ${writing.gradient} flex items-center justify-between px-4`}>
                    <span className="text-2xl">{writing.emoji}</span>
                    <span className="text-[10px] text-white/60 font-mono">{sections} sections</span>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors mb-0.5" style={{ fontFamily: 'system-ui' }}>
                      {writing.name}
                    </p>
                    <p className="text-[10px] text-primary/70 font-medium mb-1.5 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                      {writing.father} · {writing.dates}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                      {writing.desc}
                    </p>
                  </div>
                </Card>
              </Link>
            ) : (
              <Card key={writing.slug} className="overflow-hidden border-border border-dashed opacity-60 h-full">
                <div className={`h-14 bg-gradient-to-br ${writing.gradient} flex items-center justify-between px-4 opacity-70`}>
                  <span className="text-2xl">{writing.emoji}</span>
                  <span className="text-[10px] text-white/60 font-mono">seeding soon</span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm mb-0.5" style={{ fontFamily: 'system-ui' }}>
                    {writing.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 font-medium mb-1.5 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                    {writing.father} · {writing.dates}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                    {writing.desc}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* More fathers — external links */}
      <div className="mb-10">
        <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-4" style={{ fontFamily: 'system-ui' }}>
          More Fathers — External Sources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXTERNAL_FATHERS.map((father) => (
            <a
              key={father.name}
              href={father.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className="overflow-hidden border-border hover:border-primary/40 transition-colors group cursor-pointer h-full">
                <div className={`h-14 bg-gradient-to-br ${father.gradient} flex items-center justify-between px-4 relative`}>
                  <span className="text-2xl">{father.emoji}</span>
                  <span className="text-[10px] text-white/60 font-mono">{father.dates}</span>
                  <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3 text-white/70" />
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors mb-0.5" style={{ fontFamily: 'system-ui' }}>
                    {father.name}
                  </p>
                  <p className="text-[10px] text-primary/70 font-medium mb-1.5 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                    {father.tradition}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                    {father.desc}
                  </p>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Resource sections */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>
          Collections & Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RESOURCE_SECTIONS.map((section) => (
            <Card key={section.label} className="p-4 border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <section.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{section.label}</p>
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{section.desc}</p>
                </div>
              </div>
              <div className="space-y-2">
                {section.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
                    style={{ fontFamily: 'system-ui' }}
                  >
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100" />
                    {link.label}
                  </a>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
