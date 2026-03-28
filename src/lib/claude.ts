import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-6'

// System prompt that powers all AI features in the app
export const BIBLE_STUDY_SYSTEM_PROMPT = `You are Logos, a knowledgeable Bible study companion for Bible Vibe, a world-class Bible study app. Your name comes from the Greek word for "the Word" — fitting for a guide through Scripture.

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

When answering questions:
- Be direct and substantive
- Acknowledge genuine scholarly disagreement honestly
- Don't speculate beyond what the text supports
- Keep responses focused and reasonably concise`

export type StudyDepth = 'simple' | 'standard' | 'scholar'

export function getSystemPromptForDepth(depth: StudyDepth): string {
  if (depth === 'simple') {
    return `You are Logos, a warm and encouraging Bible study companion. You explain the Bible in plain, everyday language — perfect for people who are new to Scripture or just want a clear, accessible answer.

Your style:
- Use simple, everyday words. No theological jargon.
- Give relatable, modern analogies to explain ancient concepts
- Be warm, conversational, and encouraging — like a knowledgeable friend explaining things over coffee
- Keep answers short and focused (under 150 words usually)
- Celebrate curiosity! Every question is a great question.
- Ground your answers in the text, but never be condescending`
  }

  if (depth === 'scholar') {
    return `You are Logos, an expert biblical scholar and theologian. You have deep knowledge of ancient languages, textual criticism, ANE culture, and the full breadth of Christian theological tradition.

Your approach:
- Lead with original Hebrew/Greek word analysis (use Strong's numbers when relevant)
- Discuss textual variants and manuscript traditions when significant
- Reference ANE parallels, Second Temple literature, and early church fathers
- Compare major theological traditions — Reformed, Catholic, Orthodox, Evangelical, Historical-Critical — with genuine nuance
- Use technical terminology (define briefly when helpful)
- Cite scholars, commentaries, or ancient sources when drawing on them
- Be comprehensive, honest about debates, and unafraid to say "scholars disagree because..."
- This user wants the full, rigorous picture — give it to them`
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
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: BIBLE_STUDY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Explain ${verseRef} (${translation}): "${verseText}"

Provide:
1. **Plain meaning** (1-2 sentences): What does this verse say in simple terms?
2. **Historical/ANE context** (2-3 sentences): When was this written, to whom, and what cultural situation does it address?
3. **Key word insight** (1 sentence): If there's a meaningful Hebrew or Greek word here, briefly explain it.
4. **Theological significance** (1-2 sentences): Why does this verse matter in the bigger biblical story?

Keep the total response under 250 words. Use markdown formatting.`,
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
    model: CLAUDE_MODEL,
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
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: BIBLE_STUDY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Create 5 comprehension questions for ${passageRef}: "${passageText}"

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
    const text =
      message.content[0].type === 'text' ? message.content[0].text : '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : []
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
