import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { BookmarksClient } from '@/components/bookmarks-client'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`id, folder, created_at, verses(id, book_id, chapter_number, verse_number, text)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (bookmarks ?? [])
    .filter((b) => b.verses)
    .map((b) => {
      const verse = b.verses as unknown as {
        id: number; book_id: number; chapter_number: number; verse_number: number; text: string
      }
      const book = BIBLE_BOOKS.find((bk) => bk.id === verse.book_id)
      return { id: b.id, folder: b.folder ?? 'default', created_at: b.created_at, verse, book }
    })
    .filter((b) => b.book)

  return <BookmarksClient items={items as Parameters<typeof BookmarksClient>[0]['items']} />
}
