'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { QuizQuestion } from '@/lib/claude'

// Popular books with their IDs and chapter counts
const POPULAR_BOOKS = [
  { id: 1,  name: 'Genesis',  slug: 'genesis',  chapters: 50 },
  { id: 19, name: 'Psalms',   slug: 'psalms',   chapters: 150 },
  { id: 40, name: 'Matthew',  slug: 'matthew',  chapters: 28 },
  { id: 43, name: 'John',     slug: 'john',     chapters: 21 },
  { id: 45, name: 'Romans',   slug: 'romans',   chapters: 16 },
]

function getEncouragingMessage(score: number, total: number): string {
  const pct = score / total
  if (pct === 1)    return 'Perfect score! You really know your Scripture!'
  if (pct >= 0.8)   return 'Excellent work! You have a strong grasp of this passage.'
  if (pct >= 0.6)   return 'Good job! Keep studying and you\'ll master this passage.'
  if (pct >= 0.4)   return 'A solid effort! Reading the passage again will help.'
  return 'Every quiz is a chance to grow. Try reading the chapter first!'
}

function QuizSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3 mb-6" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function QuizPage() {
  const [selectedBook, setSelectedBook] = useState(POPULAR_BOOKS[3]) // John default
  const [selectedChapter, setSelectedChapter] = useState(3)

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [passageRef, setPassageRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [currentIdx, setCurrentIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [finished, setFinished] = useState(false)

  const fetchQuiz = useCallback(async () => {
    setLoading(true)
    setError('')
    setQuestions([])
    setCurrentIdx(0)
    setChosen(null)
    setAnswers([])
    setFinished(false)

    try {
      const res = await fetch(
        `/api/quiz?book_id=${selectedBook.id}&chapter=${selectedChapter}`
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      const data = await res.json()
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions returned. Try a different passage.')
      }
      setQuestions(data.questions)
      setPassageRef(data.passageRef)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [selectedBook.id, selectedChapter])

  // Auto-load on initial mount
  useEffect(() => {
    fetchQuiz()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChoose(optionIdx: number) {
    if (chosen !== null) return // already answered
    setChosen(optionIdx)
  }

  function handleNext() {
    const newAnswers = [...answers, chosen!]
    if (currentIdx + 1 >= questions.length) {
      setAnswers(newAnswers)
      setFinished(true)
    } else {
      setAnswers(newAnswers)
      setCurrentIdx(currentIdx + 1)
      setChosen(null)
    }
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct).length
  const currentQ = questions[currentIdx]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Bible Quiz
        </h1>
        <p
          className="text-sm text-muted-foreground"
          style={{ fontFamily: 'system-ui' }}
        >
          Test your understanding of a Bible passage with comprehension questions.
        </p>
      </div>

      {/* Selector */}
      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>
          Choose a passage
        </p>

        {/* Book picker */}
        <div className="flex flex-wrap gap-2">
          {POPULAR_BOOKS.map((book) => (
            <button
              key={book.id}
              onClick={() => {
                setSelectedBook(book)
                setSelectedChapter(1)
              }}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                selectedBook.id === book.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background hover:bg-muted',
              ].join(' ')}
              style={{ fontFamily: 'system-ui' }}
            >
              {book.name}
            </button>
          ))}
        </div>

        {/* Chapter picker */}
        <div className="flex items-center gap-3">
          <label
            className="text-sm text-muted-foreground shrink-0"
            style={{ fontFamily: 'system-ui' }}
            htmlFor="chapter-select"
          >
            Chapter
          </label>
          <select
            id="chapter-select"
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(Number(e.target.value))}
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{ fontFamily: 'system-ui' }}
          >
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(
              (ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              )
            )}
          </select>

          <Button
            onClick={fetchQuiz}
            disabled={loading}
            size="sm"
            className="ml-auto"
            style={{ fontFamily: 'system-ui' }}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </Button>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="p-5 border-destructive/40 bg-destructive/5">
          <p className="text-sm text-destructive" style={{ fontFamily: 'system-ui' }}>
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={fetchQuiz}
            style={{ fontFamily: 'system-ui' }}
          >
            Try again
          </Button>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
        <Card className="p-6">
          <p
            className="text-xs text-muted-foreground mb-4"
            style={{ fontFamily: 'system-ui' }}
          >
            Logos is reading the passage and crafting questions...
          </p>
          <QuizSkeleton />
        </Card>
      )}

      {/* Score screen */}
      {!loading && finished && questions.length > 0 && (
        <Card className="p-6 space-y-4 text-center">
          <div className="text-5xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            {score}/{questions.length}
          </div>
          <p className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            {passageRef}
          </p>
          <Badge
            variant={score === questions.length ? 'default' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {Math.round((score / questions.length) * 100)}% correct
          </Badge>
          <p
            className="text-sm text-muted-foreground max-w-sm mx-auto"
            style={{ fontFamily: 'system-ui' }}
          >
            {getEncouragingMessage(score, questions.length)}
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button onClick={fetchQuiz} style={{ fontFamily: 'system-ui' }}>
              Try another chapter
            </Button>
            <Link
              href={`/dashboard/reading/${selectedBook.slug}/${selectedChapter}`}
              className={buttonVariants({ variant: 'outline' })}
              style={{ fontFamily: 'system-ui' }}
            >
              Read {selectedBook.name} {selectedChapter}
            </Link>
          </div>

          {/* Answer review */}
          <div className="text-left space-y-3 pt-4 border-t">
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: 'system-ui' }}
            >
              Review
            </p>
            {questions.map((q, i) => {
              const wasCorrect = answers[i] === q.correct
              return (
                <div
                  key={i}
                  className={[
                    'rounded-xl p-3 border text-sm space-y-1',
                    wasCorrect
                      ? 'bg-green-500/5 border-green-500/30'
                      : 'bg-red-500/5 border-red-500/30',
                  ].join(' ')}
                >
                  <p className="font-medium" style={{ fontFamily: 'system-ui' }}>
                    {i + 1}. {q.question}
                  </p>
                  <p
                    className={wasCorrect ? 'text-green-600' : 'text-red-600'}
                    style={{ fontFamily: 'system-ui' }}
                  >
                    {wasCorrect ? 'Correct' : `Your answer: ${q.options[answers[i]]}`}
                  </p>
                  {!wasCorrect && (
                    <p
                      className="text-muted-foreground"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      Correct: {q.options[q.correct]}
                    </p>
                  )}
                  <p
                    className="text-xs text-muted-foreground italic"
                    style={{ fontFamily: 'system-ui' }}
                  >
                    {q.explanation}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Active quiz */}
      {!loading && !finished && questions.length > 0 && currentQ && (
        <Card className="p-6 space-y-5">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" style={{ fontFamily: 'system-ui' }}>
              {passageRef}
            </Badge>
            <span
              className="text-sm text-muted-foreground"
              style={{ fontFamily: 'system-ui' }}
            >
              {currentIdx + 1} / {questions.length}
            </span>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={[
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i < currentIdx
                    ? answers[i] === questions[i].correct
                      ? 'bg-green-500'
                      : 'bg-red-400'
                    : i === currentIdx
                    ? 'bg-primary'
                    : 'bg-muted',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Question */}
          <p
            className="text-base font-semibold leading-snug"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {currentQ.question}
          </p>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, i) => {
              let cardClass =
                'w-full text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer text-sm font-medium'

              if (chosen === null) {
                cardClass +=
                  ' border-border hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99]'
              } else if (i === currentQ.correct) {
                cardClass += ' border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
              } else if (i === chosen) {
                cardClass += ' border-red-400 bg-red-500/10 text-red-700 dark:text-red-400'
              } else {
                cardClass += ' border-border opacity-50'
              }

              return (
                <button
                  key={i}
                  className={cardClass}
                  style={{ fontFamily: 'system-ui' }}
                  onClick={() => handleChoose(i)}
                  disabled={chosen !== null}
                >
                  <span className="mr-2 opacity-60">
                    {['A', 'B', 'C', 'D'][i]}.
                  </span>
                  {option}
                </button>
              )
            })}
          </div>

          {/* Explanation + Next */}
          {chosen !== null && (
            <div className="space-y-3 pt-1 border-t">
              <p
                className="text-xs text-muted-foreground italic"
                style={{ fontFamily: 'system-ui' }}
              >
                {currentQ.explanation}
              </p>
              <Button
                onClick={handleNext}
                className="w-full"
                style={{ fontFamily: 'system-ui' }}
              >
                {currentIdx + 1 < questions.length ? 'Next question' : 'See results'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
