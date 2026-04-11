'use client'

import { Card } from '@/components/ui/card'
import { BookMarked, ExternalLink, Users, BookOpen, Scroll, Church, ShieldAlert } from 'lucide-react'

const FATHERS = [
  {
    name: 'Ignatius of Antioch',
    dates: 'c. 35–108 AD',
    tradition: 'Apostolic Father',
    desc: 'Bishop of Antioch, disciple of the Apostle John. Seven letters written en route to his martyrdom in Rome.',
    writings: ['Letter to the Ephesians', 'Letter to the Romans', 'Letter to the Smyrnaeans'],
    url: 'https://www.newadvent.org/fathers/0103.htm',
    emoji: '✉️',
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    name: 'Polycarp of Smyrna',
    dates: 'c. 69–155 AD',
    tradition: 'Apostolic Father',
    desc: 'Bishop of Smyrna, disciple of John the Apostle. His martyrdom account is one of the earliest outside the NT.',
    writings: ['Letter to the Philippians', 'The Martyrdom of Polycarp'],
    url: 'https://www.newadvent.org/fathers/0136.htm',
    emoji: '🕯️',
    gradient: 'from-stone-600 to-stone-800',
  },
  {
    name: 'Justin Martyr',
    dates: 'c. 100–165 AD',
    tradition: 'Apologist',
    desc: 'First great Christian apologist. Defended Christianity to Roman emperors and engaged Greek philosophy.',
    writings: ['First Apology', 'Second Apology', 'Dialogue with Trypho'],
    url: 'https://www.newadvent.org/fathers/0126.htm',
    emoji: '⚖️',
    gradient: 'from-blue-700 to-blue-900',
  },
  {
    name: 'Irenaeus of Lyon',
    dates: 'c. 130–202 AD',
    tradition: 'Apologist',
    desc: 'Bishop of Lyon, disciple of Polycarp. His masterwork Against Heresies defined early orthodoxy against Gnosticism.',
    writings: ['Against Heresies', 'Proof of the Apostolic Preaching'],
    url: 'https://www.newadvent.org/fathers/0103.htm',
    emoji: '🛡️',
    gradient: 'from-emerald-700 to-emerald-900',
  },
  {
    name: 'Tertullian',
    dates: 'c. 155–220 AD',
    tradition: 'Latin Father',
    desc: 'First major Latin theologian. Coined the term "Trinity." Brilliant and polemical defender of the faith.',
    writings: ['Apology', 'Against Marcion', 'On the Prescription of Heretics'],
    url: 'https://www.newadvent.org/fathers/0301.htm',
    emoji: '⚔️',
    gradient: 'from-red-700 to-red-900',
  },
  {
    name: 'Origen of Alexandria',
    dates: 'c. 185–253 AD',
    tradition: 'Alexandrian',
    desc: 'Most prolific early Christian writer. Pioneered biblical scholarship, allegorical exegesis, and systematic theology.',
    writings: ['On First Principles', 'Contra Celsum', 'Homilies on Genesis'],
    url: 'https://www.newadvent.org/fathers/0411.htm',
    emoji: '📜',
    gradient: 'from-amber-700 to-amber-900',
  },
  {
    name: 'Athanasius of Alexandria',
    dates: 'c. 296–373 AD',
    tradition: 'Nicene Father',
    desc: '"Athanasius contra mundum" — Defender of Nicene Trinitarianism against Arianism through five periods of exile.',
    writings: ['On the Incarnation', 'Against the Arians', 'Life of St. Antony'],
    url: 'https://www.newadvent.org/fathers/0100.htm',
    emoji: '🏛️',
    gradient: 'from-violet-700 to-violet-900',
  },
  {
    name: 'Basil the Great',
    dates: 'c. 330–379 AD',
    tradition: 'Cappadocian Father',
    desc: 'One of the Cappadocian Fathers. Shaped monasticism, defended the Holy Spirit\'s divinity, and structured early liturgy.',
    writings: ['On the Holy Spirit', 'Hexaemeron', 'Longer and Shorter Rules'],
    url: 'https://www.newadvent.org/fathers/3201.htm',
    emoji: '🌿',
    gradient: 'from-green-700 to-green-900',
  },
  {
    name: 'Gregory of Nazianzus',
    dates: 'c. 329–390 AD',
    tradition: 'Cappadocian Father',
    desc: '"The Theologian." Theologian of the Trinity at Constantinople. His orations shaped Trinitarian vocabulary permanently.',
    writings: ['Five Theological Orations', 'Carmina (Poems)', 'Panegyric on Athanasius'],
    url: 'https://www.newadvent.org/fathers/3102.htm',
    emoji: '✨',
    gradient: 'from-sky-700 to-sky-900',
  },
  {
    name: 'John Chrysostom',
    dates: 'c. 349–407 AD',
    tradition: 'Antiochene',
    desc: '"Golden-mouthed" — greatest preacher of the ancient church. Archbishop of Constantinople, master expositor of Scripture.',
    writings: ['Homilies on Matthew', 'Homilies on Romans', 'On the Priesthood'],
    url: 'https://www.newadvent.org/fathers/2001.htm',
    emoji: '🗣️',
    gradient: 'from-orange-700 to-orange-900',
  },
  {
    name: 'Augustine of Hippo',
    dates: '354–430 AD',
    tradition: 'Latin Father',
    desc: 'The most influential theologian in Western Christianity. His thought shaped Catholic, Protestant, and Reformed traditions.',
    writings: ['Confessions', 'City of God', 'On the Trinity', 'On Free Will'],
    url: 'https://www.newadvent.org/fathers/1201.htm',
    emoji: '📖',
    gradient: 'from-rose-700 to-rose-900',
  },
  {
    name: 'Jerome',
    dates: 'c. 345–420 AD',
    tradition: 'Latin Father',
    desc: 'Produced the Vulgate — the Latin Bible translation used for 1,000 years. Greatest biblical scholar of the ancient church.',
    writings: ['Vulgate Bible', 'Commentary on Galatians', 'Lives of Illustrious Men'],
    url: 'https://www.newadvent.org/fathers/3001.htm',
    emoji: '📝',
    gradient: 'from-indigo-700 to-indigo-900',
  },
]

const RESOURCE_SECTIONS = [
  {
    icon: BookOpen,
    label: 'Complete Writings',
    desc: 'Read the Church Fathers in their own words',
    links: [
      { label: 'New Advent — Fathers of the Church', url: 'https://www.newadvent.org/fathers/' },
      { label: 'CCEL — Early Church Fathers (38 volumes)', url: 'https://ccel.org/fathers' },
      { label: 'Tertullian.org — Latin Fathers', url: 'https://tertullian.org/fathers/' },
    ],
  },
  {
    icon: Church,
    label: 'Councils & Creeds',
    desc: 'The councils that defined Christian orthodoxy',
    links: [
      { label: 'Nicene Creed (325 AD)', url: 'https://www.newadvent.org/fathers/3801.htm' },
      { label: 'Council of Nicaea — Documents', url: 'https://www.newadvent.org/fathers/3801.htm' },
      { label: 'Chalcedonian Definition (451 AD)', url: 'https://www.newadvent.org/fathers/3810.htm' },
      { label: 'Apostles\' Creed — Early Forms', url: 'https://www.newadvent.org/cathen/01629a.htm' },
    ],
  },
  {
    icon: ShieldAlert,
    label: 'Heresies & Orthodoxy',
    desc: 'Understanding early theological controversies',
    links: [
      { label: 'Irenaeus — Against Heresies', url: 'https://www.newadvent.org/fathers/0103.htm' },
      { label: 'Arianism — History & Refutation', url: 'https://www.newadvent.org/cathen/01707c.htm' },
      { label: 'Gnosticism — Early Church Response', url: 'https://www.newadvent.org/cathen/06592a.htm' },
    ],
  },
  {
    icon: Scroll,
    label: 'Topics & Theology',
    desc: 'Patristic thought by theme',
    links: [
      { label: 'Baptism in the Early Church', url: 'https://www.newadvent.org/cathen/02258b.htm' },
      { label: 'Eucharist — Patristic Writings', url: 'https://www.newadvent.org/cathen/05572c.htm' },
      { label: 'Prayer of the Early Christians', url: 'https://www.newadvent.org/fathers/0714.htm' },
      { label: 'Eschatology — Ancient Views', url: 'https://www.newadvent.org/cathen/05530c.htm' },
    ],
  },
]

export default function ChurchFathersPage() {
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
          The theologians, bishops, and martyrs of the early church who shaped Christian doctrine, defended orthodoxy, and handed down the faith.
        </p>
      </div>

      {/* Intro banner */}
      <div className="rounded-2xl p-5 mb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3b2a1a 0%, #4a3420 50%, #2d1e0f 100%)' }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative">
          <p className="text-xs font-bold text-amber-400/70 uppercase tracking-widest mb-2" style={{ fontFamily: 'system-ui' }}>
            ✦ Why Read the Church Fathers?
          </p>
          <p className="text-base leading-relaxed text-white/90 italic mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            &ldquo;The Church Fathers are like luminous commentators on Scripture who have stood the test of time. To read them is to see how the Bible was understood by those closest in time and culture to the apostles.&rdquo;
          </p>
          <p className="text-xs text-white/50" style={{ fontFamily: 'system-ui' }}>
            They wrote in Greek, Latin, and Syriac · 1st–8th century AD · All texts in public domain
          </p>
        </div>
      </div>

      {/* Church Fathers grid */}
      <div className="mb-10">
        <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-4" style={{ fontFamily: 'system-ui' }}>
          Key Fathers & Their Writings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FATHERS.map((father) => (
            <a
              key={father.name}
              href={father.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className="overflow-hidden border-border hover:border-primary/40 transition-colors group cursor-pointer h-full">
                {/* Gradient banner */}
                <div className={`h-14 bg-gradient-to-br ${father.gradient} flex items-center justify-between px-4 relative`}>
                  <span className="text-2xl">{father.emoji}</span>
                  <span className="text-[10px] text-white/60 font-mono" style={{ fontFamily: 'monospace' }}>{father.dates}</span>
                  <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3 text-white/70" />
                  </span>
                </div>
                {/* Body */}
                <div className="p-3">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors mb-0.5" style={{ fontFamily: 'system-ui' }}>
                    {father.name}
                  </p>
                  <p className="text-[10px] text-primary/70 font-medium mb-1.5 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                    {father.tradition}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2" style={{ fontFamily: 'system-ui' }}>
                    {father.desc}
                  </p>
                  <div className="space-y-0.5">
                    {father.writings.slice(0, 2).map((w) => (
                      <p key={w} className="text-[10px] text-muted-foreground/60 leading-snug" style={{ fontFamily: 'system-ui' }}>
                        · {w}
                      </p>
                    ))}
                    {father.writings.length > 2 && (
                      <p className="text-[10px] text-muted-foreground/40" style={{ fontFamily: 'system-ui' }}>
                        + {father.writings.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Resource sections */}
      <div className="space-y-8">
        <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>
          Resources & Collections
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
