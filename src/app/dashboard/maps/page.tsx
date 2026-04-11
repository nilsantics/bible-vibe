'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Map } from 'lucide-react'

const MAP_CATEGORIES = [
  {
    label: 'Old Testament',
    maps: [
      {
        id: 'ancient-near-east',
        title: 'Ancient Near East',
        desc: 'The world of the patriarchs — Mesopotamia, Canaan, Egypt',
        era: 'c. 2000–1500 BC',
        emoji: '🏛️',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Map_of_fertile_crescent.svg/1200px-Map_of_fertile_crescent.svg.png',
      },
      {
        id: 'exodus-route',
        title: 'The Exodus Route',
        desc: 'Israel\'s journey from Egypt to the Promised Land',
        era: 'c. 1446 BC',
        emoji: '🏕️',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Exodus_route_possibilities.jpg/1200px-Exodus_route_possibilities.jpg',
      },
      {
        id: 'tribes-of-israel',
        title: 'Twelve Tribes of Israel',
        desc: 'The division of Canaan among the twelve tribes',
        era: 'c. 1400–1050 BC',
        emoji: '🗺️',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Twelve_tribes_of_Israel_Map.svg/800px-Twelve_tribes_of_Israel_Map.svg.png',
      },
      {
        id: 'kingdom-israel',
        title: 'United Kingdom of Israel',
        desc: 'The kingdom under Saul, David, and Solomon',
        era: 'c. 1050–930 BC',
        emoji: '👑',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Kingdom_of_Israel_%28United_Monarchy%29.svg/600px-Kingdom_of_Israel_%28United_Monarchy%29.svg.png',
      },
      {
        id: 'divided-kingdom',
        title: 'Divided Kingdom',
        desc: 'Israel (North) and Judah (South) after the split',
        era: 'c. 930–722 BC',
        emoji: '⚔️',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Kingdoms_of_Israel_and_Judah_map_830.svg/600px-Kingdoms_of_Israel_and_Judah_map_830.svg.png',
      },
      {
        id: 'babylonian-empire',
        title: 'Babylonian Empire',
        desc: 'The empire that conquered Judah and exiled Israel',
        era: 'c. 605–539 BC',
        emoji: '🏰',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Babylonian_empire.svg/1200px-Babylonian_empire.svg.png',
      },
      {
        id: 'persian-empire',
        title: 'Persian Empire',
        desc: 'The empire under which Ezra, Nehemiah, and Esther lived',
        era: 'c. 550–330 BC',
        emoji: '🦁',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Achaemenid_Empire.svg/1200px-Achaemenid_Empire.svg.png',
      },
    ],
  },
  {
    label: 'New Testament',
    maps: [
      {
        id: 'judea-1st-century',
        title: 'Judea in the 1st Century',
        desc: 'The land of Jesus — Galilee, Samaria, Judea',
        era: 'c. 6 BC – 30 AD',
        emoji: '✝️',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Map_of_Judea_Samaria_and_Galilee.jpg/800px-Map_of_Judea_Samaria_and_Galilee.jpg',
      },
      {
        id: 'ministry-of-jesus',
        title: 'Ministry of Jesus',
        desc: 'Key locations of Jesus\'s earthly ministry',
        era: 'c. 27–30 AD',
        emoji: '🕊️',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Ministry_Jesus_map.svg/800px-Ministry_Jesus_map.svg.png',
      },
      {
        id: 'pauls-journeys',
        title: "Paul's Missionary Journeys",
        desc: 'Three journeys across the Mediterranean world',
        era: 'c. 46–57 AD',
        emoji: '⛵',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Pauls_Journeys.svg/1200px-Pauls_Journeys.svg.png',
      },
      {
        id: 'seven-churches',
        title: 'Seven Churches of Revelation',
        desc: 'Ephesus, Smyrna, Pergamum, Thyatira, Sardis, Philadelphia, Laodicea',
        era: 'c. 95 AD',
        emoji: '📜',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Seven_churches_of_asia.svg/1200px-Seven_churches_of_asia.svg.png',
      },
      {
        id: 'roman-empire',
        title: 'Roman Empire',
        desc: 'The world into which the early church was born',
        era: 'c. 100 AD',
        emoji: '🦅',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Roman_Empire_Trajan_117AD.png/1200px-Roman_Empire_Trajan_117AD.png',
      },
    ],
  },
  {
    label: 'Jerusalem',
    maps: [
      {
        id: 'jerusalem-david',
        title: "Jerusalem in David's Time",
        desc: "The City of David and the Ark's resting place",
        era: 'c. 1000 BC',
        emoji: '🏙️',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Jerusalem_solomon_temple.png/800px-Jerusalem_solomon_temple.png',
      },
      {
        id: 'jerusalem-nt',
        title: 'Jerusalem in Jesus\'s Time',
        desc: 'The Temple Mount, Golgotha, the Upper Room',
        era: 'c. 30 AD',
        emoji: '🕌',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Jerusalem_30_AD_orthographic2.jpg/1200px-Jerusalem_30_AD_orthographic2.jpg',
      },
    ],
  },
]

export default function MapsPage() {
  const [activeMap, setActiveMap] = useState<{ url: string; title: string; desc: string; era: string } | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Map className="w-4.5 h-4.5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Biblical Maps
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12" style={{ fontFamily: 'system-ui' }}>
          See the geography of Scripture — from the Ancient Near East to Paul's journeys.
        </p>
      </div>

      {/* Map viewer modal */}
      {activeMap && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveMap(null)}
        >
          <div
            className="bg-card rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-semibold" style={{ fontFamily: 'system-ui' }}>{activeMap.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>
                  {activeMap.desc} · {activeMap.era}
                </p>
              </div>
              <button
                onClick={() => setActiveMap(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none ml-4 shrink-0"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeMap.url}
                alt={activeMap.title}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ fontFamily: 'system-ui' }}
              />
            </div>
            <div className="px-5 py-3 border-t border-border shrink-0">
              <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                Map images via Wikimedia Commons — public domain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map grid by category */}
      <div className="space-y-8">
        {MAP_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-3" style={{ fontFamily: 'system-ui' }}>
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.maps.map((m) => (
                <Card
                  key={m.id}
                  className="p-4 cursor-pointer hover:border-primary/40 transition-colors group"
                  onClick={() => setActiveMap(m)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 mt-0.5">{m.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>
                        {m.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                        {m.desc}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
                        {m.era}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
