import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const { question, response, depth, passage } = await request.json()

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const depthHint =
    depth === 'scholar'
      ? 'The user studies at a scholarly level (original languages, theology, history).'
      : depth === 'simple'
      ? 'The user is new to Bible study and wants plain, accessible answers.'
      : 'The user wants thoughtful Bible study with some historical/theological context.'

  const result = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `A Bible study user is reading ${passage || 'a Bible passage'}.

They asked: "${question}"

The AI responded with content about: ${response ? response.slice(0, 300) : '(topic related to the passage)'}

${depthHint}

Generate exactly 3 natural follow-up questions this specific user would logically want to ask next, based on what was discussed. Make them specific to the actual topic, not generic.

Return ONLY a JSON array of 3 strings, no explanation:
["question 1", "question 2", "question 3"]`,
      },
    ],
  })

  try {
    const raw = result.content[0].type === 'text' ? result.content[0].text.trim() : '[]'
    const clean = raw.replace(/^```[a-z]*\r?\n?/, '').replace(/\r?\n?```$/, '').trim()
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    if (start === -1 || end <= start) return NextResponse.json({ questions: [] })
    const questions: string[] = JSON.parse(clean.slice(start, end + 1))
    return NextResponse.json({ questions: questions.slice(0, 3) })
  } catch {
    return NextResponse.json({ questions: [] })
  }
}
