import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
export const CLAUDE_HAIKU_MODEL = 'claude-haiku-4-5-20251001'

// System prompt that powers all AI features in the app
export const BIBLE_STUDY_SYSTEM_PROMPT = `You are Ezra, a knowledgeable Bible study companion for Kairos, a world-class Bible study app. Your name comes from the great biblical scribe who restored the Torah — a fitting name for a guide through Scripture.

Your approach:
1. **Text first**: Always ground your answers in what the biblical text actually says
2. **Ancient context**: Prioritize what the passage meant to its original hearers in its historical and cultural (ANE) context
3. **Multi-tradition**: Present interpretive perspectives fairly — Evangelical, Reformed, Catholic, Orthodox — with a slight Protestant lean as default
4. **Accuracy**: Cite specific verses (e.g., "John 3:16") for every claim
5. **Depth without jargon**: Explain Hebrew/Greek concepts in plain English; define technical terms when used
6. **Respectful tone**: Treat Scripture and all traditions with respect

When explaining a passage:
- Start with the plain meaning
- Add historical/cultural context (ANE, geography, customs)
- Note key word meanings where helpful (Greek/Hebrew roots)
- Offer 1-2 interpretive perspectives if they differ meaningfully
- Connect to the broader biblical narrative when relevant
- Close with a brief, practical application — how this truth speaks to a person's life or faith today

When answering questions:
- Be direct and substantive
- Acknowledge genuine scholarly disagreement honestly
- Don't speculate beyond what the text supports
- End with a practical takeaway or application when it naturally fits
- Keep responses focused and reasonably concise — under 200 words`

export type StudyDepth = 'simple' | 'standard' | 'scholar'

export function getSystemPromptForDepth(depth: StudyDepth): string {
  if (depth === 'simple') {
    return `You are Ezra, a warm and encouraging Bible study companion. You explain the Bible in plain, everyday language — perfect for people who are new to Scripture or just want a clear, accessible answer.

Your style:
- Use simple, everyday words. No theological jargon.
- Give relatable, modern analogies to explain ancient concepts
- Be warm, conversational, and encouraging — like a knowledgeable friend explaining things over coffee
- Keep answers short and focused (under 150 words usually)
- Celebrate curiosity! Every question is a great question.
- Ground your answers in the text, but never be condescending
- Always end with a simple, practical application — one sentence on how this truth applies to everyday life`
  }

  if (depth === 'scholar') {
    return `You are Ezra, an expert biblical scholar and theologian. You have deep knowledge of ancient languages, textual criticism, ANE culture, and the full breadth of Christian theological tradition.

Your approach:
- Lead with original Hebrew/Greek word analysis (use Strong's numbers when relevant)
- Discuss textual variants and manuscript traditions when significant
- Reference ANE parallels, Second Temple literature, and early church fathers
- Compare major theological traditions — Reformed, Catholic, Orthodox, Evangelical, Historical-Critical — with genuine nuance
- Use technical terminology (define briefly when helpful)
- Cite scholars, commentaries, or ancient sources when drawing on them
- Be comprehensive, honest about debates, and unafraid to say "scholars disagree because..."
- Close with a concise application note — how this text challenges or forms the reader theologically or practically
- This user wants the full, rigorous picture — give it to them, under 350 words; be dense and precise, not exhaustive`
  }

  // standard (default)
  return BIBLE_STUDY_SYSTEM_PROMPT
}

// Generate a verse explanation + context
export async function explainVerse(
  verseRef: string,
  verseText: string,
  translation: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 600,
    system: BIBLE_STUDY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Explain ${verseRef} (${translation}): "${verseText}"

Provide:
1. **Plain meaning** (1-2 sentences): What does this verse say in simple terms?
2. **Historical/ANE context** (2-3 sentences): When was this written, to whom, and what cultural situation does it address?
3. **Key word** — Pick the single most theologically significant Hebrew or Greek word. Give: the word in original script, Strong's number in parentheses, transliteration, and its definition drawn from Thayer's Greek Lexicon (NT) or Brown-Driver-Briggs (OT). Explain how the word's range of meaning illuminates this verse. 2-3 sentences. Example: "The Greek ἀγάπη (G26, *agapē*) — Thayer's defines this as unconditional, self-giving love distinct from φιλέω..."
4. **Theological significance** (1-2 sentences): Why does this verse matter in the bigger biblical story?
5. **Application** (1-2 sentences): How does this verse speak practically to a person's faith or daily life today?

Keep the total response under 350 words. Use markdown formatting.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Generate ANE/historical context for a passage
export async function getANEContext(
  bookName: string,
  chapter: number,
  verseText: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 400,
    system: BIBLE_STUDY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Provide Ancient Near Eastern and historical context for ${bookName} ${chapter}, focusing on this text: "${verseText}"

Cover in 150-200 words:
- The historical period and setting
- Relevant ANE customs, culture, or parallels
- Geographic or political context if relevant
- What a first-century (or original) reader would have understood

Be specific and scholarly but accessible.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Stream a chat response
export async function streamChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentPassage?: string
) {
  const systemAddendum = currentPassage
    ? `\n\nThe user is currently reading: ${currentPassage}. You may reference this passage if relevant to their question.`
    : ''

  return anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: BIBLE_STUDY_SYSTEM_PROMPT + systemAddendum,
    messages,
  })
}

// Generate daily quiz questions for a passage
export async function generateQuiz(
  passageRef: string,
  passageText: string
): Promise<QuizQuestion[]> {
  const message = await anthropic.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 1500,
    system: BIBLE_STUDY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Create 5 comprehension questions for ${passageRef}.${passageText ? `\n\nPassage text:\n"${passageText}"` : '\n\nUse your knowledge of the Bible to recall this passage accurately.'}

Return a JSON array of objects with this exact shape:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

Questions should test genuine understanding, not trivia. No trick questions. Mix factual and interpretive questions.`,
      },
    ],
  })

  try {
    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const stripped = raw.replace(/^```[a-z]*\r?\n?/, '').replace(/\r?\n?```$/, '').trim()
    const start = stripped.indexOf('[')
    const end = stripped.lastIndexOf(']')
    if (start === -1 || end <= start) return []
    return JSON.parse(stripped.slice(start, end + 1))
  } catch {
    return []
  }
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface BookOverview {
  author: string
  date_written: string
  audience: string
  purpose: string
  key_themes: string[]
  outline: { range: string; title: string }[]
  key_verses: { ref: string; text: string }[]
  summary: string
}

// Generate a scholarly book overview for any Bible book
export async function generateBookOverview(bookName: string, testament: string): Promise<BookOverview | null> {
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: BIBLE_STUDY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a scholarly overview of the biblical book of ${bookName} (${testament} Testament).

Return ONLY a valid JSON object with this exact shape:
{
  "author": "Name only + brief tradition note, max 8 words (e.g. 'Moses, traditionally; some dispute Deuteronomy')",
  "date_written": "Short date + era, max 8 words (e.g. 'c. 960–930 BC, Solomon's reign')",
  "audience": "Brief phrase only, max 8 words (e.g. 'Post-exilic Jews returning to Jerusalem')",
  "purpose": "One concise sentence, max 20 words",
  "key_themes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"],
  "outline": [
    { "range": "1:1–2:3", "title": "Section title" },
    { "range": "2:4–5:32", "title": "Section title" }
  ],
  "key_verses": [
    { "ref": "chapter:verse", "text": "The actual verse text (WEB translation)" },
    { "ref": "chapter:verse", "text": "Another key verse" }
  ],
  "summary": "2 sentences max — what the book is about and why it matters theologically"
}

Rules:
- author / date_written / audience: SHORT phrases, not full sentences
- outline: 4-8 sections covering the whole book
- key_verses: 3-5 of the most important/famous verses
- key_themes: exactly 5 themes, 2-4 words each
- Return ONLY the JSON, no markdown, no explanation`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return null
    return JSON.parse(raw.slice(start, end + 1)) as BookOverview
  } catch {
    return null
  }
}
