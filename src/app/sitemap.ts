import type { MetadataRoute } from 'next'
import { BIBLE_BOOKS } from '@/lib/bible-data'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studykairos.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const readingPages: MetadataRoute.Sitemap = BIBLE_BOOKS.flatMap((book) =>
    Array.from({ length: book.chapters }, (_, i) => ({
      url: `${BASE_URL}/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${i + 1}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  )

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/auth/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...readingPages,
  ]
}
