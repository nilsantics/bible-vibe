'use client'

import { useState, useRef, useEffect } from 'react'
import { track } from '@vercel/analytics'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import { X, Send, RotateCcw, Lock, Zap, GitBranch, Languages, BookOpen, Church, Scroll } from 'lucide-react'
import type { StudyDepth } from '@/lib/claude'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type FocusArea = 'all' | 'cross-refs' | 'original-lang' | 'theology' | 'context' | 'church-history'

const DEPTH_OPTIONS: { value: StudyDepth; label: string; emoji: string; hint: string; pro: boolean }[] = [
  { value: 'simple',   label: 'Simple',   emoji: '🌱', hint: 'Plain English, no jargon',      pro: false },
  { value: 'standard', label: 'Standard', emoji: '📖', hint: 'Context + meaning',             pro: false },
  { value: 'scholar',  label: 'Scholar',  emoji: '🎓', hint: 'Deep dive, original languages', pro: true  },
]

const FOCUS_OPTIONS: { value: FocusArea; label: string; icon: React.ElementType }[] = [
  { value: 'all',           label: 'All',           icon: Scroll     },
  { value: 'cross-refs',    label: 'Cross-refs',    icon: GitBranch  },
  { value: 'original-lang', label: 'Orig. Language',icon: Languages  },
  { value: 'theology',      label: 'Theology',      icon: BookOpen   },
  { value: 'context',       label: 'Context',       icon: Scroll     },
  { value: 'church-history',label: 'Church History',icon: Church     },
]

const QUICK_ACTIONS = [
  'Explain this chapter',
  'What are the key themes?',
  'Historical context',
  'How does this connect to Jesus?',
]

const SCHOLAR_QUICK_ACTIONS = [
  'What do the original words reveal?',
  'How have theologians interpreted this?',
  'OT/NT connections in this passage',
  'What textual variants exist?',
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

const FREE_DAILY_LIMIT = 20

export function ChatPanel({
  currentPassage,
  onClose,
  isPro = false,
}: {
  currentPassage: string
  onClose: () => void
  isPro?: boolean
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [depth, setDepth] = useState<StudyDepth>('standard')
  const [focusArea, setFocusArea] = useState<FocusArea>('all')
  const [followUps, setFollowUps] = useState<string[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showScholarGate, setShowScholarGate] = useState(false)
  const [rateLimitHit, setRateLimitHit] = useState(false)
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
    setRateLimitHit(false)
    setMessages([...newMessages, { role: 'assistant', content: '' }])

    let assistantContent = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentPassage,
          depth,
          focusArea: focusArea === 'all' ? undefined : focusArea,
        }),
      })

      if (res.status === 401) throw new Error('Please sign in to chat with Ezra.')
      if (res.status === 429) {
        setRateLimitHit(true)
        setMessages(newMessages)
        setStreaming(false)
        track('rate_limit_hit', { passage: currentPassage })
        return
      }
      if (!res.ok) throw new Error('Chat request failed — please try again.')

      const rem = res.headers.get('X-RateLimit-Remaining')
      if (rem !== null) setRemaining(parseInt(rem, 10))

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.'
      setMessages([...newMessages, { role: 'assistant', content: msg }])
    } finally {
      setStreaming(false)
      if (assistantContent) fetchFollowUps(content, assistantContent)
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
      // silently skip
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleDepthChange(d: StudyDepth) {
    const opt = DEPTH_OPTIONS.find((o) => o.value === d)!
    if (opt.pro && !isPro) {
      setShowScholarGate(true)
      track('scholar_gate_shown', { passage: currentPassage })
      return
    }
    setShowScholarGate(false)
    setDepth(d)
    setMessages([])
    setFollowUps([])
    setRateLimitHit(false)
  }

  const depthConfig = DEPTH_OPTIONS.find((d) => d.value === depth)!
  const quickActions = depth === 'scholar' ? SCHOLAR_QUICK_ACTIONS : QUICK_ACTIONS
  const bookName = currentPassage.split(' ').slice(0, -1).join(' ') || currentPassage

  return (
    <div className="fixed right-0 top-13 bottom-16 sm:bottom-0 w-full sm:w-84 bg-card border-l border-border flex flex-col z-30 shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-primary-foreground font-bold text-sm" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>E</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ fontFamily: 'system-ui' }}>Ezra</p>
              <p className="text-xs text-muted-foreground leading-tight" style={{ fontFamily: 'system-ui' }}>{currentPassage}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isPro && remaining !== null && (
              <span className="text-[10px] text-muted-foreground mr-1" style={{ fontFamily: 'system-ui' }}>
                {remaining}/{FREE_DAILY_LIMIT} left
              </span>
            )}
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" className="w-7 h-7"
                onClick={() => { setMessages([]); setFollowUps([]); setRateLimitHit(false) }}
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
              title={opt.pro && !isPro ? 'Pro feature' : opt.hint}
              className={`flex-1 flex items-center justify-center gap-1 text-xs py-1 px-2 rounded-lg border transition-colors ${
                depth === opt.value
                  ? 'bg-primary text-primary-foreground border-primary font-medium'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
              style={{ fontFamily: 'system-ui' }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
              {opt.pro && !isPro && <Lock className="w-2.5 h-2.5 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Scholar gate */}
      {showScholarGate && (
        <div className="mx-4 mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3 shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-3 h-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground mb-0.5" style={{ fontFamily: 'system-ui' }}>Scholar mode is Pro</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2" style={{ fontFamily: 'system-ui' }}>
                Deep dives into original languages, theology, and ANE context.
              </p>
              <Link href="/dashboard/upgrade">
                <Button size="sm" className="h-6 text-[11px] px-3 gap-1">
                  <Zap className="w-3 h-3" /> Start Free Trial
                </Button>
              </Link>
            </div>
            <button onClick={() => setShowScholarGate(false)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Rate limit banner */}
      {rateLimitHit && (
        <div className="mx-4 mt-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground mb-0.5" style={{ fontFamily: 'system-ui' }}>Daily limit reached</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2" style={{ fontFamily: 'system-ui' }}>
                You&apos;ve used all {FREE_DAILY_LIMIT} free messages today.
              </p>
              <Link href="/dashboard/upgrade">
                <Button size="sm" className="h-6 text-[11px] px-3 gap-1">
                  <Zap className="w-3 h-3" /> Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Intro */}
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary-foreground font-bold text-xs" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>E</span>
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[90%]">
                <p className="text-xs leading-relaxed text-foreground" style={{ fontFamily: 'system-ui' }}>
                  {EZRA_INTRO_BY_DEPTH[depth]}
                </p>
              </div>
            </div>

            {/* Quick action chips — context-aware */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-2" style={{ fontFamily: 'system-ui' }}>
                Continue studying {bookName}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    className="text-left text-xs bg-secondary/40 hover:bg-secondary/80 rounded-xl px-3 py-2 transition-colors border border-border/50 hover:border-primary/30 leading-tight"
                    style={{ fontFamily: 'system-ui' }}
                    onClick={() => sendMessage(q + (currentPassage ? ` (${currentPassage})` : ''))}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Starter questions */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold" style={{ fontFamily: 'system-ui' }}>
                Or try:
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
                    <span className="text-primary-foreground font-bold text-xs" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>E</span>
                  </div>
                )}
                {msg.role === 'user' ? (
                  <div className="bg-primary text-primary-foreground text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]" style={{ fontFamily: 'system-ui' }}>
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[90%]">
                    {msg.content === '' && streaming ? (
                      <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2">
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
            {!streaming && followUps.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-muted-foreground pl-8" style={{ fontFamily: 'system-ui' }}>Follow up:</p>
                {followUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setFollowUps([]); sendMessage(q) }}
                    className="w-full text-left text-xs bg-secondary/40 hover:bg-secondary/80 rounded-xl px-3 py-2 transition-colors border border-border/50 hover:border-primary/30"
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
            placeholder="Ask Ezra anything…"
            className="text-sm resize-none min-h-10 max-h-28 border-border bg-muted/40 rounded-xl"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming || rateLimitHit}
          />
          <Button
            size="icon"
            className="shrink-0 h-10 w-10 rounded-xl"
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming || rateLimitHit}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1.5" style={{ fontFamily: 'system-ui' }}>
          {depthConfig.emoji} {depthConfig.hint}
          {!isPro && remaining !== null && remaining <= 5 && remaining > 0 && (
            <span className="text-amber-600 dark:text-amber-400 ml-2">· {remaining} msg{remaining === 1 ? '' : 's'} left</span>
          )}
        </p>
      </div>
    </div>
  )
}