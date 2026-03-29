'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react'

interface HebrewLetter {
  letter: string
  finalForm?: string
  name: string
  transliteration: string
  sound: string
  numericValue: number
  pictograph: string
  pictographMeaning: string
  keywords: string[]
  tip: string
}

const ALEPH_BET: HebrewLetter[] = [
  {
    letter: 'א', name: 'Aleph', transliteration: 'ʾ (silent)',
    sound: 'Silent consonant (glottal stop)', numericValue: 1,
    pictograph: '🐂', pictographMeaning: 'Ox — strength, leader',
    keywords: ['אָב (av) — father', 'אֱלֹהִים (Elohim) — God', 'אֶרֶץ (erets) — earth'],
    tip: 'Aleph is silent — it carries the vowel sound beneath it. Found in the first word of Genesis.',
  },
  {
    letter: 'ב', name: 'Bet', transliteration: 'b / v',
    sound: 'B (with dagesh) · V (without dagesh)', numericValue: 2,
    pictograph: '🏠', pictographMeaning: 'House — household, family',
    keywords: ['בְּרֵאשִׁית (bereshit) — in the beginning', 'בַּיִת (bayit) — house', 'בֵּן (ben) — son'],
    tip: 'The very first letter of the Torah! "Bereshit" (Genesis 1:1) starts with Bet.',
  },
  {
    letter: 'ג', name: 'Gimel', transliteration: 'g',
    sound: 'G as in "God"', numericValue: 3,
    pictograph: '🐪', pictographMeaning: 'Camel — pride, to lift up',
    keywords: ['גָּדוֹל (gadol) — great', 'גּוֹי (goy) — nation', 'גָּן (gan) — garden'],
    tip: 'Gimel and Dalet face each other — traditionally a rich man (Gimel) running to help a poor man (Dalet).',
  },
  {
    letter: 'ד', name: 'Dalet', transliteration: 'd',
    sound: 'D as in "door"', numericValue: 4,
    pictograph: '🚪', pictographMeaning: 'Door — pathway, humility',
    keywords: ['דָּבָר (davar) — word, thing', 'דָּוִד (David) — David', 'דֶּרֶךְ (derekh) — way, path'],
    tip: '"Davar" means both "word" and "thing" — in Hebrew thought, a spoken word creates reality.',
  },
  {
    letter: 'ה', name: 'He', transliteration: 'h',
    sound: 'H as in "hallelujah"', numericValue: 5,
    pictograph: '🙌', pictographMeaning: 'Man with arms raised — behold!',
    keywords: ['הַלְלוּיָהּ (hallelu-Yah) — praise the LORD', 'הָאָרֶץ (ha-aretz) — the earth', 'הָיָה (hayah) — to be'],
    tip: 'God added ה to Abram\'s name → Abraham, and Sarai → Sarah (Genesis 17). The divine breath.',
  },
  {
    letter: 'ו', name: 'Vav', transliteration: 'v / w',
    sound: 'V · also used as vowel letters O and U', numericValue: 6,
    pictograph: '🪝', pictographMeaning: 'Hook / nail — to connect',
    keywords: ['וָו (vav) — hook', 'וְ (ve-) — and (conjunction)', 'וָאֵרָא (va-era) — and I appeared'],
    tip: 'Vav as a prefix (וְ) means "and" — it connects almost every sentence in the Hebrew Bible.',
  },
  {
    letter: 'ז', name: 'Zayin', transliteration: 'z',
    sound: 'Z as in "Zion"', numericValue: 7,
    pictograph: '⚔️', pictographMeaning: 'Sword / weapon — cut, food',
    keywords: ['זָכַר (zakar) — to remember', 'זְמַן (zeman) — time, season', 'זֹאת (zot) — this'],
    tip: '"Zakar" (remember) is central to the Passover — God remembered His covenant.',
  },
  {
    letter: 'ח', name: 'Chet', transliteration: 'ḥ',
    sound: 'Guttural H — like Bach', numericValue: 8,
    pictograph: '🧱', pictographMeaning: 'Fence / wall — separation, outside',
    keywords: ['חַיִּים (chayyim) — life', 'חֶסֶד (chesed) — lovingkindness', 'חָכְמָה (chokhmah) — wisdom'],
    tip: '"Chesed" (lovingkindness) is one of the most theologically rich Hebrew words — appears 248 times.',
  },
  {
    letter: 'ט', name: 'Tet', transliteration: 'ṭ',
    sound: 'T (emphatic)', numericValue: 9,
    pictograph: '🐍', pictographMeaning: 'Snake / coiled — surrounding, mud',
    keywords: ['טוֹב (tov) — good', 'טָהוֹר (tahor) — pure, clean', 'טֶבַע (teva) — nature'],
    tip: '"Tov" (good) — God saw that it was good (Genesis 1). The 9th letter represents hidden good.',
  },
  {
    letter: 'י', name: 'Yod', transliteration: 'y',
    sound: 'Y as in "Yahweh"', numericValue: 10,
    pictograph: '✋', pictographMeaning: 'Hand / arm — deed, work',
    keywords: ['יְהוָה (YHWH) — the LORD', 'יִשְׂרָאֵל (Yisrael) — Israel', 'יֵשׁוּעַ (Yeshua) — Jesus/Salvation'],
    tip: 'The smallest letter — Jesus said not one "jot" (Yod) will pass from the law (Matthew 5:18).',
  },
  {
    letter: 'כ', finalForm: 'ך', name: 'Kaf', transliteration: 'k / kh',
    sound: 'K (with dagesh) · KH like Bach (without)', numericValue: 20,
    pictograph: '🤲', pictographMeaning: 'Open palm — to allow, to tame',
    keywords: ['כָּבוֹד (kavod) — glory', 'כֹּהֵן (kohen) — priest', 'כִּי (ki) — because, for, that'],
    tip: 'Has a final form (ך) when at the end of a word. "Kavod" (glory) shares a root with "heavy."',
  },
  {
    letter: 'ל', name: 'Lamed', transliteration: 'l',
    sound: 'L as in "Lord"', numericValue: 30,
    pictograph: '🐂', pictographMeaning: 'Ox goad / staff — to teach, toward',
    keywords: ['לֵב (lev) — heart', 'לָמַד (lamad) — to learn, to teach', 'לְ (le-) — to, toward'],
    tip: 'Lamed is the tallest letter. "Lamad" (to learn) gives us the word Talmud.',
  },
  {
    letter: 'מ', finalForm: 'ם', name: 'Mem', transliteration: 'm',
    sound: 'M as in "Messiah"', numericValue: 40,
    pictograph: '🌊', pictographMeaning: 'Water — chaos, mighty, blood',
    keywords: ['מַיִם (mayim) — water', 'מֶלֶךְ (melekh) — king', 'מֹשֶׁה (Moshe) — Moses'],
    tip: 'Has a final form (ם). Water imagery is everywhere in Scripture — creation, flood, baptism.',
  },
  {
    letter: 'נ', finalForm: 'ן', name: 'Nun', transliteration: 'n',
    sound: 'N as in "Nazareth"', numericValue: 50,
    pictograph: '🐟', pictographMeaning: 'Fish — activity, life',
    keywords: ['נֶפֶשׁ (nefesh) — soul, life', 'נָבִיא (navi) — prophet', 'נִסִּים (nissim) — miracles'],
    tip: '"Nefesh" is often translated "soul" but means the whole living being — body + breath together.',
  },
  {
    letter: 'ס', name: 'Samekh', transliteration: 's',
    sound: 'S as in "Sinai"', numericValue: 60,
    pictograph: '🐟', pictographMeaning: 'Prop / thorn — to support, hate',
    keywords: ['סֵפֶר (sefer) — book, scroll', 'סֶלָה (selah) — pause, lift up', 'סוֹד (sod) — secret, council'],
    tip: '"Selah" appears 74 times in the Psalms — likely a musical or reflective pause.',
  },
  {
    letter: 'ע', name: 'Ayin', transliteration: 'ʿ (guttural)',
    sound: 'Deep guttural — from the throat', numericValue: 70,
    pictograph: '👁️', pictographMeaning: 'Eye — to see, experience',
    keywords: ['עוֹלָם (olam) — eternity, world', 'עֶבֶד (eved) — servant', 'עַם (am) — people, nation'],
    tip: '"Olam" means both "eternity" and "world" — the same word for space and time.',
  },
  {
    letter: 'פ', finalForm: 'ף', name: 'Pe', transliteration: 'p / f',
    sound: 'P (with dagesh) · F (without)', numericValue: 80,
    pictograph: '👄', pictographMeaning: 'Mouth — word, open, blow',
    keywords: ['פֶּה (peh) — mouth', 'פָּנִים (panim) — face', 'פֶּסַח (Pesach) — Passover'],
    tip: 'Has a final form (ף). "Panim" (face) is plural in Hebrew — God\'s face has many dimensions.',
  },
  {
    letter: 'צ', finalForm: 'ץ', name: 'Tsadi', transliteration: 'ts',
    sound: 'TS as in "matzah"', numericValue: 90,
    pictograph: '🎣', pictographMeaning: 'Fishhook — desire, righteous',
    keywords: ['צַדִּיק (tsaddik) — righteous one', 'צִיּוֹן (Tsion) — Zion', 'צָלַח (tsalach) — to prosper'],
    tip: '"Tsaddik" (righteous) is a title of honor — the 36 righteous people who uphold the world.',
  },
  {
    letter: 'ק', name: 'Qof', transliteration: 'q',
    sound: 'K from the back of the throat', numericValue: 100,
    pictograph: '🐒', pictographMeaning: 'Back of head / sun at horizon',
    keywords: ['קָדוֹשׁ (kadosh) — holy', 'קָרָא (kara) — to call, to read', 'קָטָן (katan) — small'],
    tip: '"Kadosh" (holy) means set apart, consecrated. The seraphim cry it three times (Isaiah 6:3).',
  },
  {
    letter: 'ר', name: 'Resh', transliteration: 'r',
    sound: 'R (slightly rolled)', numericValue: 200,
    pictograph: '🤴', pictographMeaning: 'Head — first, top, beginning',
    keywords: ['רוּחַ (ruach) — spirit, breath, wind', 'רָאשִׁית (reshit) — beginning', 'רַחֲמִים (rachamim) — mercy'],
    tip: '"Ruach" means spirit, wind, and breath all at once — same word used in Genesis 1:2.',
  },
  {
    letter: 'שׁ', name: 'Shin', transliteration: 'sh / s',
    sound: 'SH (dot right) · S (dot left = Sin)', numericValue: 300,
    pictograph: '🦷', pictographMeaning: 'Teeth — sharp, press, destroy',
    keywords: ['שָׁלוֹם (shalom) — peace, wholeness', 'שְׁמַע (shema) — hear, listen', 'שַׁבָּת (Shabbat) — Sabbath'],
    tip: '"Shema Yisrael" (Hear O Israel) — the central Jewish declaration of faith (Deuteronomy 6:4).',
  },
  {
    letter: 'ת', name: 'Tav', transliteration: 't',
    sound: 'T as in "Torah"', numericValue: 400,
    pictograph: '✝️', pictographMeaning: 'Mark / cross — covenant, sign',
    keywords: ['תּוֹרָה (Torah) — law, instruction', 'תְּפִלָּה (tefillah) — prayer', 'תִּקְוָה (tikvah) — hope'],
    tip: 'The last letter of the Hebrew alphabet. The ancient form was an X or cross — a mark of covenant.',
  },
]

type Mode = 'browse' | 'flashcard' | 'quiz'

function LetterCard({ letter, onClick, compact }: { letter: HebrewLetter; onClick?: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${compact ? 'p-3' : 'p-5'} rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group w-full`}
    >
      <div
        className={`${compact ? 'text-4xl' : 'text-6xl'} font-bold leading-none mb-1 text-foreground`}
        style={{ fontFamily: 'serif' }}
        dir="rtl"
      >
        {letter.letter}
        {letter.finalForm && (
          <span className="text-muted-foreground/40 ml-2 text-4xl">{letter.finalForm}</span>
        )}
      </div>
      <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold mt-2 group-hover:text-primary transition-colors`} style={{ fontFamily: 'system-ui' }}>
        {letter.name}
      </p>
      {!compact && (
        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>
          {letter.transliteration}
        </p>
      )}
    </button>
  )
}

function DetailPanel({ letter, onClose }: { letter: HebrewLetter; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card
        className="w-full max-w-md p-6 space-y-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-7xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">
              {letter.letter}
              {letter.finalForm && (
                <span className="text-muted-foreground/40 ml-3 text-5xl">{letter.finalForm}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: 'Georgia, serif' }}>{letter.name}</h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{letter.transliteration}</p>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1 shrink-0" style={{ fontFamily: 'system-ui' }}>
            {letter.numericValue}
          </Badge>
        </div>

        {/* Sound */}
        <div className="bg-muted/40 rounded-xl p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'system-ui' }}>Pronunciation</p>
          <p className="text-sm" style={{ fontFamily: 'system-ui' }}>{letter.sound}</p>
        </div>

        {/* Pictograph */}
        <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3">
          <span className="text-3xl">{letter.pictograph}</span>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5" style={{ fontFamily: 'system-ui' }}>Ancient Pictograph</p>
            <p className="text-sm" style={{ fontFamily: 'system-ui' }}>{letter.pictographMeaning}</p>
          </div>
        </div>

        {/* Key words */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2" style={{ fontFamily: 'system-ui' }}>Key Words</p>
          <div className="space-y-1">
            {letter.keywords.map((kw) => (
              <p key={kw} className="text-sm font-mono bg-muted/40 rounded-lg px-3 py-1.5" dir="auto" style={{ fontFamily: 'monospace' }}>
                {kw}
              </p>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="border-l-2 border-primary pl-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1" style={{ fontFamily: 'system-ui' }}>Did you know?</p>
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>{letter.tip}</p>
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </Card>
    </div>
  )
}

function FlashcardMode() {
  const [deck, setDeck] = useState(() => [...ALEPH_BET])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())

  const card = deck[idx]

  function shuffle() {
    const shuffled = [...ALEPH_BET].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setIdx(0)
    setFlipped(false)
    setKnown(new Set())
  }

  function markKnown() {
    setKnown((prev) => new Set(prev).add(idx))
    next()
  }

  function next() {
    setFlipped(false)
    setTimeout(() => setIdx((i) => Math.min(i + 1, deck.length - 1)), 100)
  }

  function prev() {
    setFlipped(false)
    setTimeout(() => setIdx((i) => Math.max(i - 1, 0)), 100)
  }

  const progress = Math.round((known.size / deck.length) * 100)

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm" style={{ fontFamily: 'system-ui' }}>
        <span className="text-muted-foreground">{idx + 1} / {deck.length}</span>
        <span className="text-green-600 font-medium">{known.size} known</span>
        <Button variant="ghost" size="sm" onClick={shuffle} className="gap-1.5 h-7">
          <Shuffle className="w-3.5 h-3.5" /> Shuffle
        </Button>
      </div>

      {/* Card */}
      <div
        className="cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
      >
        <Card className={`p-8 text-center transition-all duration-200 border-2 min-h-[220px] flex flex-col items-center justify-center gap-4 ${known.has(idx) ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-primary/50'}`}>
          {!flipped ? (
            <>
              <div className="text-8xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">
                {card.letter}
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Tap to reveal</p>
            </>
          ) : (
            <>
              <div className="text-6xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">
                {card.letter}
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>{card.name}</p>
                <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>{card.transliteration} · {card.sound}</p>
              </div>
              <div className="flex items-center gap-2 text-2xl">
                <span>{card.pictograph}</span>
                <span className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{card.pictographMeaning}</span>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 max-w-xs leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                {card.keywords[0]}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={prev} disabled={idx === 0} className="gap-1">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {flipped && !known.has(idx) && (
          <Button size="sm" onClick={markKnown} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            Got it ✓
          </Button>
        )}
        {!flipped && (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setFlipped(true)}>
            Flip
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={next} disabled={idx === deck.length - 1} className="gap-1">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {known.size === deck.length && deck.length > 0 && (
        <Card className="p-4 text-center border-green-500/40 bg-green-500/5">
          <p className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>All {deck.length} letters reviewed!</p>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>Shalom! You know the whole aleph-bet.</p>
          <Button size="sm" className="mt-3" onClick={() => { setKnown(new Set()); setIdx(0); shuffle() }}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start over
          </Button>
        </Card>
      )}
    </div>
  )
}

function QuizMode() {
  const [letters] = useState(() => [...ALEPH_BET].sort(() => Math.random() - 0.5))
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  if (qIdx >= letters.length) {
    return null
  }

  const current = letters[qIdx]

  // Generate 4 options (correct + 3 random others)
  const others = ALEPH_BET.filter((l) => l.name !== current.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  const options = [...others, current].sort(() => Math.random() - 0.5)

  function handleAnswer(name: string) {
    if (chosen) return
    setChosen(name)
    if (name === current.name) setScore((s) => s + 1)
  }

  function next() {
    if (qIdx + 1 >= letters.length) {
      setFinished(true)
    } else {
      setQIdx((i) => i + 1)
      setChosen(null)
    }
  }

  if (finished) {
    const pct = Math.round((score / letters.length) * 100)
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="text-5xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>{score}/{letters.length}</div>
        <p className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
          {pct === 100 ? 'Perfect! You know the aleph-bet!' : pct >= 80 ? 'Great work!' : pct >= 60 ? 'Good progress!' : 'Keep practicing!'}
        </p>
        <Badge variant={pct >= 80 ? 'default' : 'secondary'} className="text-sm px-3 py-1">{pct}%</Badge>
        <Button onClick={() => { setQIdx(0); setScore(0); setChosen(null); setFinished(false) }} className="w-full mt-2">
          <RotateCcw className="w-4 h-4 mr-1.5" /> Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between text-sm" style={{ fontFamily: 'system-ui' }}>
        <span className="text-muted-foreground">{qIdx + 1} / {letters.length}</span>
        <span className="font-medium">{score} correct</span>
      </div>

      <Card className="p-8 text-center">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>What is this letter?</p>
        <div className="text-8xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">
          {current.letter}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          let cls = 'p-4 rounded-xl border-2 text-sm font-semibold transition-all text-left'
          if (!chosen) {
            cls += ' border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
          } else if (opt.name === current.name) {
            cls += ' border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
          } else if (opt.name === chosen) {
            cls += ' border-red-400 bg-red-500/10 text-red-700 dark:text-red-400'
          } else {
            cls += ' border-border opacity-40'
          }
          return (
            <button key={opt.name} className={cls} onClick={() => handleAnswer(opt.name)} style={{ fontFamily: 'system-ui' }}>
              <span className="text-2xl mr-2" style={{ fontFamily: 'serif' }} dir="rtl">{opt.letter}</span>
              {opt.name}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground italic text-center" style={{ fontFamily: 'system-ui' }}>
            {current.transliteration} · {current.sound}
          </p>
          <Button className="w-full" onClick={next}>
            {qIdx + 1 < letters.length ? 'Next →' : 'See results'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function AlephBetPage() {
  const [mode, setMode] = useState<Mode>('browse')
  const [selected, setSelected] = useState<HebrewLetter | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
          The Hebrew Alphabet
        </h1>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
          22 letters · each with a name, sound, and ancient pictographic meaning
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {(['browse', 'flashcard', 'quiz'] as Mode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode(m)}
            className="capitalize"
            style={{ fontFamily: 'system-ui' }}
          >
            {m === 'browse' ? '📖 Browse' : m === 'flashcard' ? '🃏 Flashcards' : '🧠 Quiz'}
          </Button>
        ))}
      </div>

      {/* Browse mode */}
      {mode === 'browse' && (
        <>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            Tap any letter for pronunciation, pictograph origin, key words, and a biblical connection.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {ALEPH_BET.map((letter) => (
              <LetterCard
                key={letter.name}
                letter={letter}
                compact
                onClick={() => setSelected(letter)}
              />
            ))}
          </div>

          {/* Full table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  {['#', 'Letter', 'Name', 'Sound', 'Value', 'Key Word'].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALEPH_BET.map((l, i) => (
                  <tr
                    key={l.name}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelected(l)}
                  >
                    <td className="px-3 py-2 text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{i + 1}</td>
                    <td className="px-3 py-2 text-2xl" style={{ fontFamily: 'serif' }} dir="rtl">
                      {l.letter}{l.finalForm ? ` ${l.finalForm}` : ''}
                    </td>
                    <td className="px-3 py-2 font-medium" style={{ fontFamily: 'system-ui' }}>{l.name}</td>
                    <td className="px-3 py-2 text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{l.transliteration}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground" style={{ fontFamily: 'monospace' }}>{l.numericValue}</td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs" style={{ fontFamily: 'monospace' }} dir="auto">{l.keywords[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mode === 'flashcard' && <FlashcardMode />}
      {mode === 'quiz' && <QuizMode />}

      {/* Detail panel */}
      {selected && <DetailPanel letter={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
