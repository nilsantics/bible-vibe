import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import ServiceWorkerRegister from '@/components/service-worker-register'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bible Vibe — Deep Bible Study',
  description:
    'The ultimate Bible study tool — beautiful reading, deep context, original languages, ANE history, gamified learning, and more.',
  keywords: ['Bible study', 'Bible app', 'Scripture', 'Bible reading', 'Greek Hebrew'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bible Vibe',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
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
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
