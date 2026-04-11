'use client'

import { Card } from '@/components/ui/card'
import { Map, ExternalLink } from 'lucide-react'

const MAP_CATEGORIES = [
  {
    label: 'Old Testament',
    maps: [
      {
        title: 'Ancient Near East',
        desc: 'The world of the patriarchs — Mesopotamia, Canaan, Egypt',
        era: 'c. 2000–1500 BC',
        emoji: '🏛️',
        gradient: 'from-amber-800 to-amber-950',
        url: 'https://en.wikipedia.org/wiki/Ancient_Near_East#/media/File:Map_of_fertile_crescent.svg',
        wikiTitle: 'Fertile Crescent',
      },
      {
        title: 'The Exodus Route',
        desc: "Israel's journey from Egypt to the Promised Land",
        era: 'c. 1446 BC',
        emoji: '🏕️',
        gradient: 'from-orange-700 to-red-900',
        url: 'https://en.wikipedia.org/wiki/The_Exodus#Route_of_the_Exodus',
        wikiTitle: 'Exodus Route',
      },
      {
        title: 'Twelve Tribes of Israel',
        desc: 'The division of Canaan among the twelve tribes',
        era: 'c. 1400–1050 BC',
        emoji: '🗺️',
        gradient: 'from-green-700 to-emerald-900',
        url: 'https://en.wikipedia.org/wiki/Israelite_tribes#Territorial_claims',
        wikiTitle: 'Twelve Tribes',
      },
      {
        title: 'United Kingdom of Israel',
        desc: 'The kingdom under Saul, David, and Solomon',
        era: 'c. 1050–930 BC',
        emoji: '👑',
        gradient: 'from-yellow-700 to-amber-900',
        url: 'https://en.wikipedia.org/wiki/United_monarchy',
        wikiTitle: 'United Monarchy',
      },
      {
        title: 'Divided Kingdom',
        desc: 'Israel (North) and Judah (South) after the split',
        era: 'c. 930–722 BC',
        emoji: '⚔️',
        gradient: 'from-slate-700 to-slate-900',
        url: 'https://en.wikipedia.org/wiki/Kingdom_of_Israel_(Samaria)',
        wikiTitle: 'Divided Kingdom',
      },
      {
        title: 'Assyrian Empire',
        desc: 'The empire that conquered the Northern Kingdom',
        era: 'c. 722 BC',
        emoji: '🦁',
        gradient: 'from-red-800 to-red-950',
        url: 'https://en.wikipedia.org/wiki/Neo-Assyrian_Empire',
        wikiTitle: 'Assyrian Empire',
      },
      {
        title: 'Babylonian Empire',
        desc: 'The empire that conquered Judah and exiled Israel',
        era: 'c. 605–539 BC',
        emoji: '🏰',
        gradient: 'from-violet-800 to-purple-950',
        url: 'https://en.wikipedia.org/wiki/Neo-Babylonian_Empire',
        wikiTitle: 'Babylonian Empire',
      },
      {
        title: 'Persian Empire',
        desc: 'The empire under which Ezra, Nehemiah, and Esther lived',
        era: 'c. 550–330 BC',
        emoji: '🌙',
        gradient: 'from-indigo-700 to-indigo-900',
        url: 'https://en.wikipedia.org/wiki/Achaemenid_Empire',
        wikiTitle: 'Persian (Achaemenid) Empire',
      },
    ],
  },
  {
    label: 'New Testament',
    maps: [
      {
        title: 'Judea in the 1st Century',
        desc: 'The land of Jesus — Galilee, Samaria, Judea',
        era: 'c. 6 BC – 30 AD',
        emoji: '✝️',
        gradient: 'from-sky-700 to-blue-900',
        url: 'https://en.wikipedia.org/wiki/Judea_(Roman_province)',
        wikiTitle: 'Roman Judea',
      },
      {
        title: 'Ministry of Jesus',
        desc: "Key locations of Jesus's earthly ministry",
        era: 'c. 27–30 AD',
        emoji: '🕊️',
        gradient: 'from-blue-600 to-sky-900',
        url: 'https://en.wikipedia.org/wiki/Ministry_of_Jesus',
        wikiTitle: 'Ministry of Jesus',
      },
      {
        title: "Paul's First Journey",
        desc: 'Cyprus, Pisidian Antioch, Iconium, Lystra, Derbe',
        era: 'c. 46–48 AD',
        emoji: '⛵',
        gradient: 'from-teal-700 to-teal-900',
        url: 'https://en.wikipedia.org/wiki/Missionary_journeys_of_Paul_the_Apostle',
        wikiTitle: "Paul's Journeys",
      },
      {
        title: "Paul's Second Journey",
        desc: 'Macedonia, Athens, Corinth — the gospel enters Europe',
        era: 'c. 49–52 AD',
        emoji: '🌊',
        gradient: 'from-cyan-700 to-cyan-900',
        url: 'https://en.wikipedia.org/wiki/Missionary_journeys_of_Paul_the_Apostle#Second_missionary_journey',
        wikiTitle: "Paul's Second Journey",
      },
      {
        title: "Paul's Third Journey",
        desc: 'Ephesus, Macedonia, Greece — strengthening the churches',
        era: 'c. 53–57 AD',
        emoji: '📜',
        gradient: 'from-blue-700 to-indigo-900',
        url: 'https://en.wikipedia.org/wiki/Missionary_journeys_of_Paul_the_Apostle#Third_missionary_journey',
        wikiTitle: "Paul's Third Journey",
      },
      {
        title: 'Seven Churches of Revelation',
        desc: 'Ephesus, Smyrna, Pergamum, Thyatira, Sardis, Philadelphia, Laodicea',
        era: 'c. 95 AD',
        emoji: '🕯️',
        gradient: 'from-rose-700 to-rose-900',
        url: 'https://en.wikipedia.org/wiki/Seven_churches_of_Asia',
        wikiTitle: 'Seven Churches of Asia',
      },
      {
        title: 'Roman Empire',
        desc: 'The world into which the early church was born',
        era: 'c. 100 AD',
        emoji: '🦅',
        gradient: 'from-red-700 to-red-900',
        url: 'https://en.wikipedia.org/wiki/Roman_Empire',
        wikiTitle: 'Roman Empire',
      },
    ],
  },
  {
    label: 'Jerusalem',
    maps: [
      {
        title: "Jerusalem in David's Time",
        desc: "The City of David and the Ark's resting place",
        era: 'c. 1000 BC',
        emoji: '🏙️',
        gradient: 'from-stone-600 to-stone-900',
        url: 'https://en.wikipedia.org/wiki/City_of_David',
        wikiTitle: 'City of David',
      },
      {
        title: "Solomon's Temple",
        desc: "The first Temple — the dwelling place of God's glory",
        era: 'c. 957 BC',
        emoji: '🏛️',
        gradient: 'from-yellow-600 to-amber-900',
        url: 'https://en.wikipedia.org/wiki/Solomon%27s_Temple',
        wikiTitle: "Solomon's Temple",
      },
      {
        title: "Jerusalem in Jesus's Time",
        desc: 'The Temple Mount, Golgotha, the Upper Room',
        era: 'c. 30 AD',
        emoji: '🕌',
        gradient: 'from-amber-700 to-orange-900',
        url: 'https://en.wikipedia.org/wiki/Jerusalem_in_the_time_of_Jesus',
        wikiTitle: 'Jerusalem (1st century)',
      },
      {
        title: 'Via Dolorosa',
        desc: "The path Jesus walked carrying the cross",
        era: 'c. 30 AD',
        emoji: '†',
        gradient: 'from-purple-800 to-purple-950',
        url: 'https://en.wikipedia.org/wiki/Via_Dolorosa',
        wikiTitle: 'Via Dolorosa',
      },
    ],
  },
  {
    label: 'Interactive Resources',
    maps: [
      {
        title: 'Bible Map (OpenBible)',
        desc: 'Search for any person, place, or event from the Bible',
        era: 'All eras',
        emoji: '🔍',
        gradient: 'from-primary/70 to-primary',
        url: 'https://www.openbible.info/geo/',
        wikiTitle: 'Open in OpenBible.info',
      },
      {
        title: 'BibleMapper Atlas',
        desc: 'High-resolution printable Bible atlas maps',
        era: 'All eras',
        emoji: '🗺️',
        gradient: 'from-emerald-700 to-green-900',
        url: 'https://biblemapper.com/blog/index.php/maps/',
        wikiTitle: 'Open BibleMapper',
      },
      {
        title: 'Bible History Maps',
        desc: 'Extensive collection of Bible geography maps',
        era: 'All eras',
        emoji: '📍',
        gradient: 'from-blue-700 to-blue-900',
        url: 'https://www.bible-history.com/geography/',
        wikiTitle: 'Open Bible-history.com',
      },
    ],
  },
]

export default function MapsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Map className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Biblical Maps
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12" style={{ fontFamily: 'system-ui' }}>
          See the geography of Scripture — from the Ancient Near East to Paul's journeys.
        </p>
      </div>

      {/* Map grid by category */}
      <div className="space-y-8">
        {MAP_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-3" style={{ fontFamily: 'system-ui' }}>
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.maps.map((m) => (
                <a
                  key={m.title}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Card className="overflow-hidden border-border hover:border-primary/40 transition-colors group cursor-pointer">
                    {/* Gradient banner */}
                    <div className={`h-16 bg-gradient-to-br ${m.gradient} flex items-center justify-center relative`}>
                      <span className="text-3xl">{m.emoji}</span>
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                      />
                      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5 text-white/70" />
                      </span>
                    </div>
                    {/* Body */}
                    <div className="p-3">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>
                        {m.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                        {m.desc}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-1.5 font-mono">
                        {m.era}
                      </p>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
