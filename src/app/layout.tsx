import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter, Lora } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import ServiceWorkerRegister from '@/components/service-worker-register'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kairos — Deep Bible Study',
  description:
    'Your moment in the Word. Kairos is the intelligent Bible study tool — beautiful reading, AI explanations, original languages, 430K cross-references, and more.',
  keywords: ['Bible study', 'Bible app', 'Scripture', 'Kairos', 'Bible reading', 'Greek Hebrew'],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'Kairos',
    title: 'Kairos — Deep Bible Study',
    description: 'Your moment in the Word. AI explanations, 430K cross-references, Hebrew & Greek interlinear. Free to start.',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Kairos — Deep Bible Study' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kairos — Deep Bible Study',
    description: 'Your moment in the Word. AI explanations, 430K cross-references, Hebrew & Greek interlinear. Free to start.',
    images: ['/api/og'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kairos',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  verification: {
    google: 'W65Cl8Tz7fmiZHqbbRtleR-32mfRsTQBP-ypFw-IM9g',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full ${cormorant.variable} ${inter.variable} ${lora.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              {children}
              <ServiceWorkerRegister />
              <Toaster richColors position="top-right" />
              <Analytics />
              <SpeedInsights />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
