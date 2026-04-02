import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { Bookmark, ChevronRight } from 'lucide-react'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id, folder, created_at,
      verses(id, book_id, chapter_number, verse_number, text)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (bookmarks ?? []).filter((b) => b.verses)

  // Group by folder
  const folders = new Map<string, typeof items>()
  for (const item of items) {
    const f = item.folder ?? 'default'
    if (!folders.has(f)) folders.set(f, [])
    folders.get(f)!.push(item)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Bookmark className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Bookmarks
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'system-ui' }}>
        {items.length} saved verse{items.length !== 1 ? 's' : ''}
      </p>

      {items.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1" style={{ fontFamily: 'system-ui' }}>No bookmarks yet</p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            Click the bookmark icon on any verse while reading to save it here.
          </p>
          <Link
            href="/dashboard/reading/genesis/1"
            className="inline-block mt-4 text-sm text-primary hover:underline"
            style={{ fontFamily: 'system-ui' }}
          >
            Start reading &rarr;
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(folders.entries()).map(([folder, folderItems]) => (
            <div key={folder}>
              {folders.size > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold capitalize" style={{ fontFamily: 'system-ui' }}>
                    {folder === 'default' ? 'All Bookmarks' : folder}
                  </h2>
                  <Badge variant="secondary" className="text-xs">{folderItems.length}</Badge>
                </div>
              )}
              <div className="space-y-2">
                {folderItems.map((bookmark) => {
                  const verse = (bookmark.verses as unknown) as {
                    id: number
                    book_id: number
                    chapter_number: number
                    verse_number: number
                    text: string
                  }
                  const book = BIBLE_BOOKS.find((b) => b.id === verse.book_id)
                  if (!book) return null
                  const href = `/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${verse.chapter_number}`

                  return (
                    <Link key={bookmark.id} href={href}>
                      <Card className="p-4 hover:border-primary/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Bookmark className="w-3.5 h-3.5 text-primary fill-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-muted-foreground mb-1" style={{ fontFamily: 'system-ui' }}>
                              {book.name} {verse.chapter_number}:{verse.verse_number}
                            </p>
                            <p className="bible-text text-sm leading-relaxed line-clamp-3">
                              {verse.text}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
