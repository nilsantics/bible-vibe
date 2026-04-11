'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ExternalLink, Map, Clock, GitBranch, Church } from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const BIBLE_TIMELINE = [
  { era: 'Creation & Fall',          ref: 'Gen 1–3',    year: 'Before recorded time', color: 'bg-amber-500',  note: 'God creates the world; Adam and Eve fall into sin' },
  { era: 'Flood & Tower of Babel',   ref: 'Gen 6–11',   year: 'c. 3000–2500 BC',      color: 'bg-orange-500', note: 'Noah survives the flood; humanity is scattered at Babel' },
  { era: 'Patriarchs',               ref: 'Gen 12–50',  year: 'c. 2000–1700 BC',      color: 'bg-yellow-600', note: 'Abraham, Isaac, Jacob, Joseph — God forms His covenant people' },
  { era: 'Exodus & Wilderness',       ref: 'Exo–Deu',   year: 'c. 1446–1406 BC',      color: 'bg-green-600',  note: 'Moses leads Israel out of Egypt; the Law is given at Sinai' },
  { era: 'Conquest & Judges',         ref: 'Jos–Jdg',   year: 'c. 1406–1050 BC',      color: 'bg-teal-600',   note: 'Israel enters Canaan; a cycle of sin, oppression and deliverance' },
  { era: 'United Kingdom',            ref: '1 Sam–1 Ki', year: 'c. 1050–930 BC',      color: 'bg-blue-600',   note: 'Saul, David, and Solomon rule; the Temple is built in Jerusalem' },
  { era: 'Divided Kingdom',           ref: '1–2 Ki',     year: 'c. 930–586 BC',       color: 'bg-indigo-600', note: 'Israel splits; prophets warn; Assyria takes the North (722 BC)' },
  { era: 'Exile',                     ref: '2 Ki 25',    year: 'c. 605–538 BC',       color: 'bg-purple-600', note: 'Babylon destroys Jerusalem; Israel lives in exile' },
  { era: 'Return & Restoration',      ref: 'Ezr–Neh',   year: 'c. 538–400 BC',       color: 'bg-pink-600',   note: 'Cyrus permits return; the Temple and walls are rebuilt' },
  { era: 'Life of Jesus',             ref: 'Gospels',    year: 'c. 6 BC – 30 AD',    color: 'bg-rose-500',   note: 'Jesus is born, ministers, crucified, and rises from the dead' },
  { era: 'Early Church & Paul',       ref: 'Acts',       year: 'c. 30–62 AD',        color: 'bg-red-500',    note: 'Pentecost; gospel spreads; Paul plants churches across the empire' },
  { era: 'Letters & Revelation',      ref: 'Epistles–Rev', year: 'c. 50–95 AD',     color: 'bg-slate-500',  note: 'NT letters written; John receives Revelation on Patmos' },
]

const EARLY_CHURCH_TIMELINE = [
  { year: 'c. 30 AD',    event: 'Pentecost',                  note: 'The Holy Spirit is poured out; the church is born in Jerusalem (Acts 2)' },
  { year: 'c. 35 AD',    event: "Paul's Conversion",          note: 'Saul of Tarsus encounters Christ on the road to Damascus (Acts 9)' },
  { year: 'c. 46–48 AD', event: "Paul's First Journey",       note: 'Cyprus, Pisidian Antioch, Galatia — first Gentile churches planted' },
  { year: 'c. 49 AD',    event: 'Jerusalem Council',          note: 'Apostles rule: Gentiles do not need circumcision (Acts 15)' },
  { year: 'c. 49–52 AD', event: "Paul's Second Journey",      note: 'Gospel enters Europe — Philippi, Thessalonica, Athens, Corinth' },
  { year: 'c. 53–57 AD', event: "Paul's Third Journey",       note: 'Ephesus becomes a major center; major epistles written (Romans, Corinthians)' },
  { year: 'c. 64–68 AD', event: 'Neronian Persecution',       note: 'Rome blames Christians for the great fire; Peter and Paul are martyred' },
  { year: 'c. 70 AD',    event: 'Destruction of Jerusalem',   note: "Roman general Titus destroys the Temple — fulfilling Jesus's prophecy" },
  { year: 'c. 95 AD',    event: 'Domitian Persecution',       note: 'John is exiled to Patmos; the Book of Revelation is written' },
  { year: 'c. 100–150',  event: 'Apostolic Fathers',          note: 'Ignatius, Polycarp, Clement write letters; the Didache circulates' },
  { year: 'c. 155 AD',   event: "Justin Martyr's Apology",    note: 'First formal defense of Christianity addressed to Emperor Antoninus Pius' },
  { year: 'c. 180 AD',   event: 'Irenaeus Against Heresies',  note: 'Irenaeus refutes Gnosticism and defines the rule of faith' },
  { year: 'c. 313 AD',   event: 'Edict of Milan',             note: 'Constantine legalizes Christianity across the Roman Empire' },
  { year: 'c. 325 AD',   event: 'Council of Nicaea',          note: 'The church affirms the full divinity of Christ against Arianism' },
  { year: 'c. 381 AD',   event: 'Council of Constantinople',  note: 'The Nicene Creed is expanded; the Trinity fully defined' },
  { year: 'c. 397 AD',   event: 'Council of Carthage',        note: 'The 27-book NT canon is formally recognized' },
]

const JESUS_GENEALOGY = [
  { name: 'Abraham', note: 'Father of the Hebrew people; received the covenant promise (Gen 12)' },
  { name: 'Isaac',   note: 'Son of promise; nearly sacrificed, a type of Christ (Gen 22)' },
  { name: 'Jacob',   note: 'Father of the twelve tribes; renamed Israel (Gen 32)' },
  { name: 'Judah',   note: 'The kingly tribe; "the scepter shall not depart from Judah" (Gen 49:10)' },
  { name: 'Perez',   note: 'Son of Judah and Tamar; listed in Matthew\'s genealogy' },
  { name: '…10 generations…', note: 'Hezron, Ram, Amminadab, Nahshon, Salmon…' },
  { name: 'Boaz',    note: 'Married Ruth the Moabitess; a picture of Christ the Kinsman-Redeemer' },
  { name: 'Obed',    note: 'Son of Boaz and Ruth' },
  { name: 'Jesse',   note: 'Father of David; "a shoot from the stump of Jesse" (Isa 11:1)' },
  { name: 'David',   note: 'King of Israel; recipient of the Davidic covenant (2 Sam 7)' },
  { name: 'Solomon', note: 'Son of David and Bathsheba; built the first Temple' },
  { name: '…13 generations…', note: 'Kings of Judah through the Babylonian exile' },
  { name: 'Zerubbabel', note: 'Led the first return from Babylonian exile (Ezra 1–2)' },
  { name: '…13 generations…', note: 'Post-exile ancestors through the intertestamental period' },
  { name: 'Jacob',   note: 'Father of Joseph (the husband of Mary)' },
  { name: 'Joseph',  note: 'Legal father of Jesus; descended from David through Solomon' },
  { name: 'Jesus',   note: 'The Messiah — "son of David, son of Abraham" (Matt 1:1)', highlight: true },
]

const MAP_CATEGORIES = [
  {
    label: 'Old Testament World',
    maps: [
      { title: 'Ancient Near East', desc: 'The world of the patriarchs — Mesopotamia, Canaan, Egypt', era: 'c. 2000–1500 BC', emoji: '🏛️', gradient: 'from-amber-800 to-amber-950', url: 'https://www.openbible.info/geo/' },
      { title: 'The Exodus Route',  desc: "Israel's journey from Egypt to the Promised Land",          era: 'c. 1446 BC',      emoji: '🏕️', gradient: 'from-orange-700 to-red-900',   url: 'https://biblemapper.com/blog/index.php/maps/' },
      { title: 'Twelve Tribes',     desc: 'Division of Canaan among the twelve tribes',                era: 'c. 1400–1050 BC', emoji: '🗺️', gradient: 'from-green-700 to-emerald-900',url: 'https://www.bible-history.com/geography/' },
      { title: 'Kingdoms of Israel', desc: 'United → Divided → Exile',                               era: 'c. 1050–586 BC',  emoji: '👑', gradient: 'from-yellow-700 to-amber-900', url: 'https://www.openbible.info/geo/' },
    ],
  },
  {
    label: 'New Testament World',
    maps: [
      { title: 'Judea in the 1st Century', desc: 'Galilee, Samaria, Judea — the land of Jesus',       era: 'c. 6 BC – 30 AD', emoji: '✝️', gradient: 'from-sky-700 to-blue-900',   url: 'https://www.openbible.info/geo/' },
      { title: "Paul's Missionary Journeys", desc: 'Three journeys planting churches across the empire', era: 'c. 46–57 AD', emoji: '⛵', gradient: 'from-teal-700 to-teal-900',   url: 'https://biblemapper.com/blog/index.php/maps/' },
      { title: 'Seven Churches of Revelation', desc: 'Ephesus through Laodicea in Asia Minor',        era: 'c. 95 AD',        emoji: '🕯️', gradient: 'from-rose-700 to-rose-900',  url: 'https://www.openbible.info/geo/' },
      { title: 'Bible Atlas (OpenBible)',    desc: 'Search any person, place, or event from Scripture', era: 'All eras',       emoji: '🔍', gradient: 'from-primary/70 to-primary', url: 'https://www.openbible.info/geo/' },
    ],
  },
]

// ─── Sub-views ────────────────────────────────────────────────────────────────

function BibleTimelineView() {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
      {BIBLE_TIMELINE.map((item, i) => (
        <div key={i} className="relative mb-6 last:mb-0">
          <div className={`absolute -left-[19px] w-3.5 h-3.5 rounded-full border-2 border-background ${item.color}`} />
          <div className="ml-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{item.era}</span>
              <span className="text-xs font-mono text-muted-foreground/60">{item.ref}</span>
              <span className="text-xs text-muted-foreground/50">{item.year}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5" style={{ fontFamily: 'system-ui' }}>{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EarlyChurchView() {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
      {EARLY_CHURCH_TIMELINE.map((item, i) => (
        <div key={i} className="relative mb-6 last:mb-0">
          <div className="absolute -left-[19px] w-3.5 h-3.5 rounded-full border-2 border-background bg-primary/70" />
          <div className="ml-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{item.event}</span>
              <span className="text-xs font-mono text-primary/70">{item.year}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5" style={{ fontFamily: 'system-ui' }}>{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function GenealogyView() {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: 'system-ui' }}>
        The royal lineage from Abraham to Jesus, as traced in Matthew 1:1–17.
      </p>
      {JESUS_GENEALOGY.map((person, i) => (
        <div
          key={i}
          className={`flex gap-3 px-3 py-2.5 rounded-lg ${
            person.highlight
              ? 'bg-primary/10 border border-primary/30'
              : 'hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col items-center pt-1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${person.highlight ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            {i < JESUS_GENEALOGY.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
          </div>
          <div className="pb-1">
            <p className={`text-sm font-semibold leading-tight ${person.highlight ? 'text-primary' : ''}`} style={{ fontFamily: 'system-ui' }}>
              {person.name}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5" style={{ fontFamily: 'system-ui' }}>
              {person.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function MapsView() {
  return (
    <div className="space-y-8">
      {MAP_CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-3" style={{ fontFamily: 'system-ui' }}>
            {cat.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cat.maps.map((m) => (
              <a key={m.title} href={m.url} target="_blank" rel="noopener noreferrer">
                <Card className="overflow-hidden border-border hover:border-primary/40 transition-colors group cursor-pointer">
                  <div className={`h-14 bg-gradient-to-br ${m.gradient} flex items-center justify-center relative`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <ExternalLink className="absolute top-2 right-2 w-3.5 h-3.5 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>{m.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>{m.desc}</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">{m.era}</p>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = 'timeline' | 'church' | 'genealogy' | 'maps'

const VIEWS: { id: View; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'timeline',  label: 'Bible Timeline',        icon: Clock,      desc: 'Key events from Creation to Revelation' },
  { id: 'church',    label: 'Early Church Timeline',  icon: Church,     desc: 'Pentecost through the great councils' },
  { id: 'genealogy', label: 'Lineage of Jesus',       icon: GitBranch,  desc: 'Abraham → David → Christ (Matt 1)' },
  { id: 'maps',      label: 'Geographic Maps',        icon: Map,        desc: 'Biblical geography & atlas resources' },
]

export default function VisualizationsPage() {
  const [view, setView] = useState<View>('timeline')
  const current = VIEWS.find((v) => v.id === view)!

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Visualizations
        </h1>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
          Timelines, lineages, and maps to see Scripture in context.
        </p>
      </div>

      {/* View selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {VIEWS.map((v) => {
          const Icon = v.icon
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                view === v.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-muted/40 text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${view === v.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs font-semibold leading-tight" style={{ fontFamily: 'system-ui' }}>{v.label}</span>
            </button>
          )
        })}
      </div>

      {/* Section label */}
      <div className="mb-6">
        <h2 className="text-base font-semibold" style={{ fontFamily: 'system-ui' }}>{current.label}</h2>
        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>{current.desc}</p>
      </div>

      {/* Content */}
      {view === 'timeline'  && <BibleTimelineView />}
      {view === 'church'    && <EarlyChurchView />}
      {view === 'genealogy' && <GenealogyView />}
      {view === 'maps'      && <MapsView />}
    </div>
  )
}
