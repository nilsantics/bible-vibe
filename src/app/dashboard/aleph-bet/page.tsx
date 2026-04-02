'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2 } from 'lucide-react'

// ── Speech utility ────────────────────────────────────────────────────────────
function speak(hebrew: string, phonetic?: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const heVoice = voices.find(v => v.lang.startsWith('he'))
    const utterance = new SpeechSynthesisUtterance(heVoice ? hebrew : (phonetic ?? hebrew))
    if (heVoice) {
      utterance.voice = heVoice
      utterance.lang = 'he-IL'
    } else {
      utterance.lang = 'en-US'
    }
    utterance.rate = 0.75
    window.speechSynthesis.speak(utterance)
  }

  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    trySpeak()
  } else {
    window.speechSynthesis.onvoiceschanged = () => { trySpeak(); window.speechSynthesis.onvoiceschanged = null }
  }
}

function SpeakButton({ hebrew, phonetic, size = 'sm' }: { hebrew: string; phonetic?: string; size?: 'sm' | 'xs' }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(hebrew, phonetic) }}
      className={`rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center justify-center ${size === 'xs' ? 'w-6 h-6' : 'w-8 h-8'}`}
      title="Hear pronunciation"
      aria-label="Play pronunciation"
    >
      <Volume2 className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    </button>
  )
}

// ── Consonants data ───────────────────────────────────────────────────────────
interface HebrewLetter {
  letter: string
  finalForm?: string
  hebrewName: string   // Hebrew script of the name, for TTS
  name: string
  transliteration: string
  sound: string
  numericValue: number
  pictograph: string
  pictographMeaning: string
  keywords: string[]
  keywordHebrew: string[] // Hebrew text only, for TTS
  tip: string
}

const ALEPH_BET: HebrewLetter[] = [
  {
    letter: 'א', hebrewName: 'אָלֶף', name: 'Aleph', transliteration: 'ʾ (silent)',
    sound: 'Silent consonant (glottal stop)', numericValue: 1,
    pictograph: '🐂', pictographMeaning: 'Ox — strength, leader',
    keywords: ['אָב (av) — father', 'אֱלֹהִים (Elohim) — God', 'אֶרֶץ (erets) — earth'],
    keywordHebrew: ['אָב', 'אֱלֹהִים', 'אֶרֶץ'],
    tip: 'Aleph is silent — it carries the vowel sound beneath it. Found in the first word of Genesis.',
  },
  {
    letter: 'ב', hebrewName: 'בֵּית', name: 'Bet', transliteration: 'b / v',
    sound: 'B (with dagesh) · V (without dagesh)', numericValue: 2,
    pictograph: '🏠', pictographMeaning: 'House — household, family',
    keywords: ['בְּרֵאשִׁית (bereshit) — in the beginning', 'בַּיִת (bayit) — house', 'בֵּן (ben) — son'],
    keywordHebrew: ['בְּרֵאשִׁית', 'בַּיִת', 'בֵּן'],
    tip: 'The very first letter of the Torah! "Bereshit" (Genesis 1:1) starts with Bet.',
  },
  {
    letter: 'ג', hebrewName: 'גִּימֶל', name: 'Gimel', transliteration: 'g',
    sound: 'G as in "God"', numericValue: 3,
    pictograph: '🐪', pictographMeaning: 'Camel — pride, to lift up',
    keywords: ['גָּדוֹל (gadol) — great', 'גּוֹי (goy) — nation', 'גָּן (gan) — garden'],
    keywordHebrew: ['גָּדוֹל', 'גּוֹי', 'גָּן'],
    tip: 'Gimel and Dalet face each other — traditionally a rich man (Gimel) running to help a poor man (Dalet).',
  },
  {
    letter: 'ד', hebrewName: 'דָּלֶת', name: 'Dalet', transliteration: 'd',
    sound: 'D as in "door"', numericValue: 4,
    pictograph: '🚪', pictographMeaning: 'Door — pathway, humility',
    keywords: ['דָּבָר (davar) — word, thing', 'דָּוִד (David) — David', 'דֶּרֶךְ (derekh) — way, path'],
    keywordHebrew: ['דָּבָר', 'דָּוִד', 'דֶּרֶךְ'],
    tip: '"Davar" means both "word" and "thing" — in Hebrew thought, a spoken word creates reality.',
  },
  {
    letter: 'ה', hebrewName: 'הֵא', name: 'He', transliteration: 'h',
    sound: 'H as in "hallelujah"', numericValue: 5,
    pictograph: '🙌', pictographMeaning: 'Man with arms raised — behold!',
    keywords: ['הַלְלוּיָהּ (hallelu-Yah) — praise the LORD', 'הָאָרֶץ (ha-aretz) — the earth', 'הָיָה (hayah) — to be'],
    keywordHebrew: ['הַלְלוּיָהּ', 'הָאָרֶץ', 'הָיָה'],
    tip: 'God added ה to Abram\'s name → Abraham, and Sarai → Sarah (Genesis 17). The divine breath.',
  },
  {
    letter: 'ו', hebrewName: 'וָו', name: 'Vav', transliteration: 'v / w',
    sound: 'V · also used as vowel letters O and U', numericValue: 6,
    pictograph: '🪝', pictographMeaning: 'Hook / nail — to connect',
    keywords: ['וָו (vav) — hook', 'וְ (ve-) — and (conjunction)', 'וָאֵרָא (va-era) — and I appeared'],
    keywordHebrew: ['וָו', 'וְ', 'וָאֵרָא'],
    tip: 'Vav as a prefix (וְ) means "and" — it connects almost every sentence in the Hebrew Bible.',
  },
  {
    letter: 'ז', hebrewName: 'זַיִן', name: 'Zayin', transliteration: 'z',
    sound: 'Z as in "Zion"', numericValue: 7,
    pictograph: '⚔️', pictographMeaning: 'Sword / weapon — cut, food',
    keywords: ['זָכַר (zakar) — to remember', 'זְמַן (zeman) — time, season', 'זֹאת (zot) — this'],
    keywordHebrew: ['זָכַר', 'זְמַן', 'זֹאת'],
    tip: '"Zakar" (remember) is central to the Passover — God remembered His covenant.',
  },
  {
    letter: 'ח', hebrewName: 'חֵית', name: 'Chet', transliteration: 'ḥ',
    sound: 'Guttural H — like Bach', numericValue: 8,
    pictograph: '🧱', pictographMeaning: 'Fence / wall — separation, outside',
    keywords: ['חַיִּים (chayyim) — life', 'חֶסֶד (chesed) — lovingkindness', 'חָכְמָה (chokhmah) — wisdom'],
    keywordHebrew: ['חַיִּים', 'חֶסֶד', 'חָכְמָה'],
    tip: '"Chesed" (lovingkindness) is one of the most theologically rich Hebrew words — appears 248 times.',
  },
  {
    letter: 'ט', hebrewName: 'טֵית', name: 'Tet', transliteration: 'ṭ',
    sound: 'T (emphatic)', numericValue: 9,
    pictograph: '🐍', pictographMeaning: 'Snake / coiled — surrounding, mud',
    keywords: ['טוֹב (tov) — good', 'טָהוֹר (tahor) — pure, clean', 'טֶבַע (teva) — nature'],
    keywordHebrew: ['טוֹב', 'טָהוֹר', 'טֶבַע'],
    tip: '"Tov" (good) — God saw that it was good (Genesis 1). The 9th letter represents hidden good.',
  },
  {
    letter: 'י', hebrewName: 'יוֹד', name: 'Yod', transliteration: 'y',
    sound: 'Y as in "Yahweh"', numericValue: 10,
    pictograph: '✋', pictographMeaning: 'Hand / arm — deed, work',
    keywords: ['יְהוָה (YHWH) — the LORD', 'יִשְׂרָאֵל (Yisrael) — Israel', 'יֵשׁוּעַ (Yeshua) — Jesus/Salvation'],
    keywordHebrew: ['יְהוָה', 'יִשְׂרָאֵל', 'יֵשׁוּעַ'],
    tip: 'The smallest letter — Jesus said not one "jot" (Yod) will pass from the law (Matthew 5:18).',
  },
  {
    letter: 'כ', finalForm: 'ך', hebrewName: 'כַּף', name: 'Kaf', transliteration: 'k / kh',
    sound: 'K (with dagesh) · KH like Bach (without)', numericValue: 20,
    pictograph: '🤲', pictographMeaning: 'Open palm — to allow, to tame',
    keywords: ['כָּבוֹד (kavod) — glory', 'כֹּהֵן (kohen) — priest', 'כִּי (ki) — because, for, that'],
    keywordHebrew: ['כָּבוֹד', 'כֹּהֵן', 'כִּי'],
    tip: 'Has a final form (ך) when at the end of a word. "Kavod" (glory) shares a root with "heavy."',
  },
  {
    letter: 'ל', hebrewName: 'לָמֶד', name: 'Lamed', transliteration: 'l',
    sound: 'L as in "Lord"', numericValue: 30,
    pictograph: '🐂', pictographMeaning: 'Ox goad / staff — to teach, toward',
    keywords: ['לֵב (lev) — heart', 'לָמַד (lamad) — to learn, to teach', 'לְ (le-) — to, toward'],
    keywordHebrew: ['לֵב', 'לָמַד', 'לְ'],
    tip: 'Lamed is the tallest letter. "Lamad" (to learn) gives us the word Talmud.',
  },
  {
    letter: 'מ', finalForm: 'ם', hebrewName: 'מֵם', name: 'Mem', transliteration: 'm',
    sound: 'M as in "Messiah"', numericValue: 40,
    pictograph: '🌊', pictographMeaning: 'Water — chaos, mighty, blood',
    keywords: ['מַיִם (mayim) — water', 'מֶלֶךְ (melekh) — king', 'מֹשֶׁה (Moshe) — Moses'],
    keywordHebrew: ['מַיִם', 'מֶלֶךְ', 'מֹשֶׁה'],
    tip: 'Has a final form (ם). Water imagery is everywhere in Scripture — creation, flood, baptism.',
  },
  {
    letter: 'נ', finalForm: 'ן', hebrewName: 'נוּן', name: 'Nun', transliteration: 'n',
    sound: 'N as in "Nazareth"', numericValue: 50,
    pictograph: '🐟', pictographMeaning: 'Fish — activity, life',
    keywords: ['נֶפֶשׁ (nefesh) — soul, life', 'נָבִיא (navi) — prophet', 'נִסִּים (nissim) — miracles'],
    keywordHebrew: ['נֶפֶשׁ', 'נָבִיא', 'נִסִּים'],
    tip: '"Nefesh" is often translated "soul" but means the whole living being — body + breath together.',
  },
  {
    letter: 'ס', hebrewName: 'סָמֶךְ', name: 'Samekh', transliteration: 's',
    sound: 'S as in "Sinai"', numericValue: 60,
    pictograph: '🔄', pictographMeaning: 'Prop / support — to support, sustain',
    keywords: ['סֵפֶר (sefer) — book, scroll', 'סֶלָה (selah) — pause, lift up', 'סוֹד (sod) — secret, council'],
    keywordHebrew: ['סֵפֶר', 'סֶלָה', 'סוֹד'],
    tip: '"Selah" appears 74 times in the Psalms — likely a musical or reflective pause.',
  },
  {
    letter: 'ע', hebrewName: 'עַיִן', name: 'Ayin', transliteration: 'ʿ (guttural)',
    sound: 'Deep guttural — from the throat', numericValue: 70,
    pictograph: '👁️', pictographMeaning: 'Eye — to see, experience',
    keywords: ['עוֹלָם (olam) — eternity, world', 'עֶבֶד (eved) — servant', 'עַם (am) — people, nation'],
    keywordHebrew: ['עוֹלָם', 'עֶבֶד', 'עַם'],
    tip: '"Olam" means both "eternity" and "world" — the same word for space and time.',
  },
  {
    letter: 'פ', finalForm: 'ף', hebrewName: 'פֵּא', name: 'Pe', transliteration: 'p / f',
    sound: 'P (with dagesh) · F (without)', numericValue: 80,
    pictograph: '👄', pictographMeaning: 'Mouth — word, open, blow',
    keywords: ['פֶּה (peh) — mouth', 'פָּנִים (panim) — face', 'פֶּסַח (Pesach) — Passover'],
    keywordHebrew: ['פֶּה', 'פָּנִים', 'פֶּסַח'],
    tip: 'Has a final form (ף). "Panim" (face) is plural in Hebrew — God\'s face has many dimensions.',
  },
  {
    letter: 'צ', finalForm: 'ץ', hebrewName: 'צָדִי', name: 'Tsadi', transliteration: 'ts',
    sound: 'TS as in "matzah"', numericValue: 90,
    pictograph: '🎣', pictographMeaning: 'Fishhook — desire, righteous',
    keywords: ['צַדִּיק (tsaddik) — righteous one', 'צִיּוֹן (Tsion) — Zion', 'צָלַח (tsalach) — to prosper'],
    keywordHebrew: ['צַדִּיק', 'צִיּוֹן', 'צָלַח'],
    tip: '"Tsaddik" (righteous) is a title of honor — the 36 righteous people who uphold the world.',
  },
  {
    letter: 'ק', hebrewName: 'קוֹף', name: 'Qof', transliteration: 'q',
    sound: 'K from the back of the throat', numericValue: 100,
    pictograph: '🐒', pictographMeaning: 'Back of head / sun at horizon',
    keywords: ['קָדוֹשׁ (kadosh) — holy', 'קָרָא (kara) — to call, to read', 'קָטָן (katan) — small'],
    keywordHebrew: ['קָדוֹשׁ', 'קָרָא', 'קָטָן'],
    tip: '"Kadosh" (holy) means set apart, consecrated. The seraphim cry it three times (Isaiah 6:3).',
  },
  {
    letter: 'ר', hebrewName: 'רֵישׁ', name: 'Resh', transliteration: 'r',
    sound: 'R (slightly rolled)', numericValue: 200,
    pictograph: '🤴', pictographMeaning: 'Head — first, top, beginning',
    keywords: ['רוּחַ (ruach) — spirit, breath, wind', 'רָאשִׁית (reshit) — beginning', 'רַחֲמִים (rachamim) — mercy'],
    keywordHebrew: ['רוּחַ', 'רָאשִׁית', 'רַחֲמִים'],
    tip: '"Ruach" means spirit, wind, and breath all at once — same word used in Genesis 1:2.',
  },
  {
    letter: 'שׁ', hebrewName: 'שִׁין', name: 'Shin', transliteration: 'sh / s',
    sound: 'SH (dot right) · S (dot left = Sin)', numericValue: 300,
    pictograph: '🦷', pictographMeaning: 'Teeth — sharp, press, destroy',
    keywords: ['שָׁלוֹם (shalom) — peace, wholeness', 'שְׁמַע (shema) — hear, listen', 'שַׁבָּת (Shabbat) — Sabbath'],
    keywordHebrew: ['שָׁלוֹם', 'שְׁמַע', 'שַׁבָּת'],
    tip: '"Shema Yisrael" (Hear O Israel) — the central Jewish declaration of faith (Deuteronomy 6:4).',
  },
  {
    letter: 'ת', hebrewName: 'תָּו', name: 'Tav', transliteration: 't',
    sound: 'T as in "Torah"', numericValue: 400,
    pictograph: '✝️', pictographMeaning: 'Mark / cross — covenant, sign',
    keywords: ['תּוֹרָה (Torah) — law, instruction', 'תְּפִלָּה (tefillah) — prayer', 'תִּקְוָה (tikvah) — hope'],
    keywordHebrew: ['תּוֹרָה', 'תְּפִלָּה', 'תִּקְוָה'],
    tip: 'The last letter of the Hebrew alphabet. The ancient form was an X or cross — a mark of covenant.',
  },
]

// ── Vowels data ───────────────────────────────────────────────────────────────
interface HebrewVowel {
  name: string
  display: string       // base letter (bet) + vowel mark, for visual
  hebrewExample: string // full Hebrew word for TTS
  transliteration: string
  sound: string
  exampleWord: string   // "אָב (av) — father"
  type: 'long' | 'short' | 'reduced'
  tip: string
}

const HEBREW_VOWELS: HebrewVowel[] = [
  // Long vowels
  {
    name: 'Qamats', display: 'בָ', hebrewExample: 'אָב',
    transliteration: 'ā', sound: '"ah" — long, like father',
    exampleWord: 'אָב (av) — father', type: 'long',
    tip: 'The most common vowel in Hebrew. The T-shaped mark sits under the letter.',
  },
  {
    name: 'Tsere', display: 'בֵ', hebrewExample: 'בֵּן',
    transliteration: 'ē', sound: '"ay" — like "say" or "they"',
    exampleWord: 'בֵּן (ben) — son', type: 'long',
    tip: 'Two dots side by side under the letter. Often spelled with Yod (בֵּי) to make it longer.',
  },
  {
    name: 'Chirik Gadol', display: 'בִי', hebrewExample: 'חַיִּים',
    transliteration: 'ī', sound: '"ee" — long, like "see"',
    exampleWord: 'חַיִּים (chayyim) — life', type: 'long',
    tip: 'A single dot under the letter followed by Yod. The Yod makes it a "long" vowel.',
  },
  {
    name: 'Cholem', display: 'בֹ', hebrewExample: 'שָׁלוֹם',
    transliteration: 'ō', sound: '"oh" — long, like "go"',
    exampleWord: 'שָׁלוֹם (shalom) — peace', type: 'long',
    tip: 'A dot above and to the left of the letter. Also written with Vav (וֹ) as a vowel letter.',
  },
  {
    name: 'Shureq', display: 'וּ', hebrewExample: 'רוּחַ',
    transliteration: 'ū', sound: '"oo" — long, like "moon"',
    exampleWord: 'רוּחַ (ruach) — spirit', type: 'long',
    tip: 'Written as Vav with a dot in the middle (וּ). Always uses Vav as its base letter.',
  },
  // Short vowels
  {
    name: 'Patach', display: 'בַ', hebrewExample: 'אַרְצֵנוּ',
    transliteration: 'a', sound: '"ah" — short, like "cat"',
    exampleWord: 'אַרְצֵנוּ (artsenu) — our land', type: 'short',
    tip: 'A horizontal line under the letter. Shorter than Qamats but same "ah" sound.',
  },
  {
    name: 'Segol', display: 'בֶ', hebrewExample: 'אֶרֶץ',
    transliteration: 'e', sound: '"eh" — short, like "bed"',
    exampleWord: 'אֶרֶץ (erets) — earth, land', type: 'short',
    tip: 'Three dots forming a triangle under the letter. Very common in Hebrew.',
  },
  {
    name: 'Chirik Katan', display: 'בִ', hebrewExample: 'מִן',
    transliteration: 'i', sound: '"ih" — short, like "bit"',
    exampleWord: 'מִן (min) — from', type: 'short',
    tip: 'A single dot under the letter (no Yod). Shorter than Chirik Gadol.',
  },
  {
    name: 'Qamats Katan', display: 'בׇ', hebrewExample: 'כׇּל',
    transliteration: 'o', sound: '"oh" — short, like "hot"',
    exampleWord: 'כׇּל (kol) — all, every', type: 'short',
    tip: 'Looks identical to Qamats but sounds like "oh". Context and grammar determine which it is.',
  },
  {
    name: 'Qibbuts', display: 'בֻ', hebrewExample: 'כֻּלָּם',
    transliteration: 'u', sound: '"oo" — short, like "put"',
    exampleWord: 'כֻּלָּם (kullam) — all of them', type: 'short',
    tip: 'Three diagonal dots under the letter. The short version of Shureq.',
  },
  // Reduced vowels
  {
    name: 'Shva Na', display: 'בְ', hebrewExample: 'בְּרֵאשִׁית',
    transliteration: 'ə', sound: 'Very short "eh" — like the "a" in "about"',
    exampleWord: 'בְּרֵאשִׁית (bereshit) — in the beginning', type: 'reduced',
    tip: 'Two vertical dots under the letter. Can be "vocal" (short eh) or "silent" depending on position.',
  },
  {
    name: 'Hataf Patach', display: 'בֲ', hebrewExample: 'אֲנִי',
    transliteration: 'ă', sound: 'Ultra-short "ah"',
    exampleWord: 'אֲנִי (ani) — I, me', type: 'reduced',
    tip: 'Used under guttural letters (א ה ח ע) instead of regular Shva. Short "ah" sound.',
  },
  {
    name: 'Hataf Segol', display: 'בֱ', hebrewExample: 'אֱלֹהִים',
    transliteration: 'ĕ', sound: 'Ultra-short "eh"',
    exampleWord: 'אֱלֹהִים (Elohim) — God', type: 'reduced',
    tip: 'The Elohim (God) form uses Hataf Segol — the very word for God carries this reduced vowel.',
  },
  {
    name: 'Hataf Qamats', display: 'בֳ', hebrewExample: 'אֳנִיָּה',
    transliteration: 'ŏ', sound: 'Ultra-short "oh"',
    exampleWord: 'אֳנִיָּה (oniyyah) — ship', type: 'reduced',
    tip: 'The rarest of the reduced vowels. Almost exclusively found under Aleph.',
  },
]

// ── Components ────────────────────────────────────────────────────────────────
type Mode = 'browse' | 'vowels' | 'flashcard' | 'quiz'

function LetterCard({ letter, onClick, compact }: { letter: HebrewLetter; onClick?: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${compact ? 'p-3' : 'p-5'} rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group w-full`}
    >
      <div className={`${compact ? 'text-4xl' : 'text-6xl'} font-bold leading-none mb-1 text-foreground`} style={{ fontFamily: 'serif' }} dir="rtl">
        {letter.letter}
        {letter.finalForm && <span className="text-muted-foreground/40 ml-2 text-4xl">{letter.finalForm}</span>}
      </div>
      <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold mt-2 group-hover:text-primary transition-colors`} style={{ fontFamily: 'system-ui' }}>
        {letter.name}
      </p>
      {!compact && <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>{letter.transliteration}</p>}
    </button>
  )
}

function DetailPanel({ letter, onClose }: { letter: HebrewLetter; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md p-6 space-y-4 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-7xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">
                {letter.letter}
                {letter.finalForm && <span className="text-muted-foreground/40 ml-3 text-5xl">{letter.finalForm}</span>}
              </div>
              <SpeakButton hebrew={letter.hebrewName} phonetic={letter.name} />
            </div>
            <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{letter.name}</h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{letter.transliteration}</p>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1 shrink-0" style={{ fontFamily: 'system-ui' }}>{letter.numericValue}</Badge>
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
            {letter.keywords.map((kw, i) => (
              <div key={kw} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5">
                <p className="text-sm font-mono flex-1" dir="auto" style={{ fontFamily: 'monospace' }}>{kw}</p>
                <SpeakButton hebrew={letter.keywordHebrew[i]} size="xs" />
              </div>
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

function VowelSection() {
  const [selected, setSelected] = useState<HebrewVowel | null>(null)
  const long = HEBREW_VOWELS.filter(v => v.type === 'long')
  const short = HEBREW_VOWELS.filter(v => v.type === 'short')
  const reduced = HEBREW_VOWELS.filter(v => v.type === 'reduced')

  function VowelCard({ v }: { v: HebrewVowel }) {
    const colors = { long: 'border-blue-500/30 bg-blue-500/5', short: 'border-amber-500/30 bg-amber-500/5', reduced: 'border-purple-500/30 bg-purple-500/5' }
    const isSelected = selected?.name === v.name
    return (
      <button
        onClick={() => setSelected(isSelected ? null : v)}
        className={`p-4 rounded-2xl border-2 text-left transition-all w-full ${isSelected ? colors[v.type] + ' border-opacity-100' : 'border-border hover:border-primary/30'}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="text-4xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">{v.display}</div>
          <SpeakButton hebrew={v.hebrewExample} size="xs" />
        </div>
        <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{v.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>{v.transliteration} · {v.sound}</p>

        {isSelected && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono flex-1" dir="auto" style={{ fontFamily: 'monospace' }}>{v.exampleWord}</p>
              <SpeakButton hebrew={v.hebrewExample} size="xs" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>{v.tip}</p>
          </div>
        )}
      </button>
    )
  }

  function Group({ title, items, color }: { title: string; items: HebrewVowel[]; color: string }) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>{title}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {items.map(v => <VowelCard key={v.name} v={v} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-muted/30 rounded-xl p-4 text-sm space-y-1" style={{ fontFamily: 'system-ui' }}>
        <p className="font-semibold">How Hebrew vowels work</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Hebrew was originally written without vowels — only consonants. Vowel marks (nikud, נִקּוּד) were added by the Masoretes around 600–950 AD. They appear as dots and dashes beneath, above, or inside the letters. Tap any vowel card to learn more and hear it spoken.
        </p>
      </div>

      <Group title="Long Vowels" items={long} color="bg-blue-500" />
      <Group title="Short Vowels" items={short} color="bg-amber-500" />
      <Group title="Reduced Vowels (Shva & Hataf)" items={reduced} color="bg-purple-500" />

      {/* Quick reference table */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3" style={{ fontFamily: 'system-ui' }}>Quick Reference</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                {['Vowel', 'Name', 'Sound', 'Type', 'Example', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEBREW_VOWELS.map(v => (
                <tr key={v.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-2xl" style={{ fontFamily: 'serif' }} dir="rtl">{v.display}</td>
                  <td className="px-3 py-2 font-medium" style={{ fontFamily: 'system-ui' }}>{v.name}</td>
                  <td className="px-3 py-2 text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{v.transliteration} — {v.sound}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.type === 'long' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : v.type === 'short' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'}`} style={{ fontFamily: 'system-ui' }}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground" dir="auto" style={{ fontFamily: 'monospace' }}>{v.exampleWord}</td>
                  <td className="px-3 py-2">
                    <SpeakButton hebrew={v.hebrewExample} size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
    setDeck([...ALEPH_BET].sort(() => Math.random() - 0.5))
    setIdx(0); setFlipped(false); setKnown(new Set())
  }
  function markKnown() { setKnown(prev => new Set(prev).add(idx)); next() }
  function next() { setFlipped(false); setTimeout(() => setIdx(i => Math.min(i + 1, deck.length - 1)), 100) }
  function prev() { setFlipped(false); setTimeout(() => setIdx(i => Math.max(i - 1, 0)), 100) }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between text-sm" style={{ fontFamily: 'system-ui' }}>
        <span className="text-muted-foreground">{idx + 1} / {deck.length}</span>
        <span className="text-green-600 font-medium">{known.size} known</span>
        <Button variant="ghost" size="sm" onClick={shuffle} className="gap-1.5 h-7">
          <Shuffle className="w-3.5 h-3.5" /> Shuffle
        </Button>
      </div>

      <div className="cursor-pointer select-none" onClick={() => setFlipped(f => !f)}>
        <Card className={`p-8 text-center transition-all duration-200 border-2 min-h-[220px] flex flex-col items-center justify-center gap-4 ${known.has(idx) ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-primary/50'}`}>
          {!flipped ? (
            <>
              <div className="text-8xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">{card.letter}</div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Tap to reveal</p>
            </>
          ) : (
            <>
              <div className="text-6xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">{card.letter}</div>
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{card.name}</p>
                <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>{card.transliteration} · {card.sound}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-2xl">
                  <span>{card.pictograph}</span>
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{card.pictographMeaning}</span>
                </div>
                <SpeakButton hebrew={card.hebrewName} phonetic={card.name} />
              </div>
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 max-w-xs leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                {card.keywords[0]}
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={prev} disabled={idx === 0}><ChevronLeft className="w-4 h-4" /></Button>
        {flipped && !known.has(idx) && (
          <Button size="sm" onClick={markKnown} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Got it ✓</Button>
        )}
        {!flipped && <Button variant="outline" size="sm" className="flex-1" onClick={() => setFlipped(true)}>Flip</Button>}
        <Button variant="outline" size="sm" onClick={next} disabled={idx === deck.length - 1}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {known.size === deck.length && deck.length > 0 && (
        <Card className="p-4 text-center border-green-500/40 bg-green-500/5">
          <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>All {deck.length} letters reviewed!</p>
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

  if (qIdx >= letters.length) return null
  const current = letters[qIdx]
  const others = ALEPH_BET.filter(l => l.name !== current.name).sort(() => Math.random() - 0.5).slice(0, 3)
  const options = [...others, current].sort(() => Math.random() - 0.5)

  function handleAnswer(name: string) {
    if (chosen) return
    setChosen(name)
    if (name === current.name) setScore(s => s + 1)
  }
  function next() {
    if (qIdx + 1 >= letters.length) setFinished(true)
    else { setQIdx(i => i + 1); setChosen(null) }
  }

  if (finished) {
    const pct = Math.round((score / letters.length) * 100)
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="text-5xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{score}/{letters.length}</div>
        <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
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
        <div className="flex items-center justify-center gap-3">
          <div className="text-8xl font-bold leading-none" style={{ fontFamily: 'serif' }} dir="rtl">{current.letter}</div>
          <SpeakButton hebrew={current.hebrewName} phonetic={current.name} />
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          let cls = 'p-4 rounded-xl border-2 text-sm font-semibold transition-all text-left'
          if (!chosen) cls += ' border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
          else if (opt.name === current.name) cls += ' border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
          else if (opt.name === chosen) cls += ' border-red-400 bg-red-500/10 text-red-700 dark:text-red-400'
          else cls += ' border-border opacity-40'
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
          <Button className="w-full" onClick={next}>{qIdx + 1 < letters.length ? 'Next →' : 'See results'}</Button>
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
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Hebrew Alphabet & Vowels</h1>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
          22 consonants · 14 vowel signs · tap <Volume2 className="inline w-3 h-3" /> to hear any word spoken in Hebrew
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {([
          { id: 'browse', label: '📖 Letters' },
          { id: 'vowels', label: '🔤 Vowels' },
          { id: 'flashcard', label: '🃏 Flashcards' },
          { id: 'quiz', label: '🧠 Quiz' },
        ] as { id: Mode; label: string }[]).map(({ id, label }) => (
          <Button key={id} variant={mode === id ? 'default' : 'ghost'} size="sm" onClick={() => setMode(id)} style={{ fontFamily: 'system-ui' }}>
            {label}
          </Button>
        ))}
      </div>

      {/* Browse mode */}
      {mode === 'browse' && (
        <>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            Tap any letter card for details · tap <Volume2 className="inline w-3 h-3" /> to hear it spoken
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {ALEPH_BET.map(letter => (
              <LetterCard key={letter.name} letter={letter} compact onClick={() => setSelected(letter)} />
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  {['#', 'Letter', 'Name', 'Sound', 'Value', 'Key Word', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALEPH_BET.map((l, i) => (
                  <tr key={l.name} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelected(l)}>
                    <td className="px-3 py-2 text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{i + 1}</td>
                    <td className="px-3 py-2 text-2xl" style={{ fontFamily: 'serif' }} dir="rtl">{l.letter}{l.finalForm ? ` ${l.finalForm}` : ''}</td>
                    <td className="px-3 py-2 font-medium" style={{ fontFamily: 'system-ui' }}>{l.name}</td>
                    <td className="px-3 py-2 text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{l.transliteration}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground" style={{ fontFamily: 'monospace' }}>{l.numericValue}</td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs" style={{ fontFamily: 'monospace' }} dir="auto">{l.keywords[0]}</td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <SpeakButton hebrew={l.hebrewName} phonetic={l.name} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mode === 'vowels' && <VowelSection />}
      {mode === 'flashcard' && <FlashcardMode />}
      {mode === 'quiz' && <QuizMode />}

      {selected && <DetailPanel letter={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
