'use client'

import ReactMarkdown from 'react-markdown'

export function CommentaryRenderer({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed
        [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-2
        [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-1
        [&>p]:mb-4 [&>p]:text-foreground/80
        [&>strong]:text-foreground"
      style={{ fontFamily: 'system-ui' }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
