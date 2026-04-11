import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BIBLE_BOOKS } from '@/lib/bible-data'

// Root /dashboard → redirect to the Bible reader.
// Returning users land on their last read chapter; everyone else gets John 1.
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: recent } = await supabase
      .from('reading_progress')
      .select('book_id, chapter_number')
      .eq('user_id', user.id)
      .order('reading_date', { ascending: false })
      .limit(1)
      .single()

    if (recent) {
      const book = BIBLE_BOOKS.find((b) => b.id === recent.book_id)
      if (book) {
        redirect(`/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${recent.chapter_number}`)
      }
    }
  }

  redirect('/dashboard/reading/john/1')
}
