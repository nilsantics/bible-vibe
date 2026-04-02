'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from 'react-markdown'
import { X, Send, RotateCcw } from 'lucide-react'
import type { StudyDepth } from '@/lib/claude'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const DEPTH_OPTIONS: { value: StudyDepth; label: string; emoji: string; hint: string }[] = [
  { value: 'simple',   label: 'Simple',   emoji: '🌱', hint: 'Plain English, no jargon' },
  { value: 'standard', label: 'Standard', emoji: '📖', hint: 'Context + meaning' },
  { value: 'scholar',  label: 'Scholar',  emoji: '🎓', hint: 'Deep dive, original languages' },
]

const STARTER_QUESTIONS_BY_DEPTH: Record<StudyDepth, string[]> = {
  simple: [
    'What is this passage saying in simple terms?',
    'Why does this story matter?',
    'What can I take away from this today?',
    'Who are the people in this passage?',
  ],
  standard: [
    'What is the historical context of this passage?',
    'What does this teach about God?',
    'How does this connect to other Bible passages?',
    'What does this mean for my life today?',
  ],
  scholar: [
    'What do the original Hebrew/Greek words reveal here?',
    'How do Reformed and Catholic traditions interpret this differently?',
    'What ANE parallels illuminate this passage?',
    'What textual variants exist and do they affect meaning?',
  ],
}

const EZRA_INTRO_BY_DEPTH: Record<StudyDepth, string> = {
  simple:   "Hi! I'm Ezra 👋 Ask me anything about this passage — I'll explain it in plain, everyday language.",
  standard: "I'm Ezra, your Bible study companion. Ask me anything about this passage — history, meaning, theology.",
  scholar:  "Ezra here. Ready for a deep dive — original languages, hermeneutics, tradition comparisons. What do you want to explore?",
}

export function ChatPanel({
  currentPassage,
  onClose,
}: {
  currentPassage: string
  onClose: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [depth, setDepth] = useState<StudyDepth>('standard')
  const [followUps, setFollowUps] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    const userMessage: Message = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)
    setMessages([...newMessages, { role: 'assistant', content: '' }])

    let assistantContent = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, currentPassage, depth }),
      })

      if (res.status === 401) {
        throw new Error('Please sign in to chat with Ezra.')
      }
      if (res.status === 429) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "You've reached your daily limit. Come back tomorrow!")
      }
      if (!res.ok) throw new Error('Chat request failed — please try again.')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setStreaming(false)
      fetchFollowUps(content, assistantContent)
    }
  }

  async function fetchFollowUps(question: string, response: string): Promise<void> {
    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, response: response.slice(0, 400), depth, passage: currentPassage }),
      })
      const data = await res.json()
      if (data.questions?.length) setFollowUps(data.questions)
    } catch {
      // silently skip — follow-up chips are a nice-to-have
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleDepthChange(d: StudyDepth) {
    setDepth(d)
    setMessages([])
    setFollowUps([])
  }

  const depthConfig = DEPTH_OPTIONS.find((d) => d.value === depth)!

  return (
    <div className="fixed right-0 top-13 bottom-16 sm:bottom-0 w-full sm:w-84 bg-card border-l border-border flex flex-col z-30 shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Ezra avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-primary-foreground font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                E
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ fontFamily: 'system-ui' }}>
                Ezra
              </p>
              <p className="text-xs text-muted-foreground leading-tight" style={{ fontFamily: 'system-ui' }}>
                {currentPassage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => setMessages([])}
                title="Clear chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Depth selector */}
        <div className="flex gap-1.5">
          {DEPTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleDepthChange(opt.value)}
              title={opt.hint}
              className={`flex-1 flex items-center justify-center gap-1 text-xs py-1 px-2 rounded-lg border transition-colors ${
                depth === opt.value
                  ? 'bg-primary text-primary-foreground border-primary font-medium'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
              style={{ fontFamily: 'system-ui' }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Intro message from Ezra */}
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary-foreground font-bold text-xs" style={{ fontFamily: 'Georgia, serif' }}>E</span>
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[90%]">
                <p className="text-xs leading-relaxed text-foreground" style={{ fontFamily: 'system-ui' }}>
                  {EZRA_INTRO_BY_DEPTH[depth]}
                </p>
              </div>
            </div>

            {/* Starter questions */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                Try one of these:
              </p>
              {STARTER_QUESTIONS_BY_DEPTH[depth].map((q) => (
                <button
                  key={q}
                  className="w-full text-left text-xs bg-secondary/40 hover:bg-secondary/80 rounded-xl px-3 py-2 transition-colors border border-border/50 hover:border-primary/30"
                  style={{ fontFamily: 'system-ui' }}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary-foreground font-bold text-xs" style={{ fontFamily: 'Georgia, serif' }}>E</span>
                  </div>
                )}
                {msg.role === 'user' ? (
                  <div
                    className="bg-primary text-primary-foreground text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]"
                    style={{ fontFamily: 'system-ui' }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[90%]">
                    {msg.content === '' && streaming ? (
                      <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2 space-y-1.5">
                        <div className="flex gap-1 items-center py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:mb-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {/* Follow-up chips */}
            {!streaming && followUps.length > 0 && messages.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-muted-foreground pl-8" style={{ fontFamily: 'system-ui' }}>
                  Follow up:
                </p>
                {followUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setFollowUps([]); sendMessage(q) }}
                    className="w-full text-left text-xs bg-secondary/40 hover:bg-secondary/80 rounded-xl px-3 py-2 transition-colors border border-border/50 hover:border-primary/30 ml-8"
                    style={{ fontFamily: 'system-ui', marginLeft: '2rem', width: 'calc(100% - 2rem)' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2">
          <Textarea
            placeholder={`Ask Ezra anything…`}
            className="text-sm resize-none min-h-10 max-h-28 border-border bg-muted/40 rounded-xl"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
          />
          <Button
            size="icon"
            className="shrink-0 h-10 w-10 rounded-xl"
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p
          className="text-xs text-muted-foreground text-center mt-1.5"
          style={{ fontFamily: 'system-ui' }}
        >
          {depthConfig.emoji} {depthConfig.hint}
        </p>
      </div>
    </div>
  )
}
