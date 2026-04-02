import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Kairos',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>K</div>
            <span className="font-semibold tracking-wide" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>KAIROS</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: 'system-ui' }}>
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-light mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-12" style={{ fontFamily: 'system-ui' }}>
          Last updated: April 2, 2026
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground" style={{ fontFamily: 'system-ui' }}>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. Acceptance</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account or using Kairos, you agree to these terms. If you do not agree, do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. The service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kairos is a Bible study tool that provides access to multiple Bible translations, study resources, and AI-assisted study features. We offer a free tier and a paid Pro tier.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time. We will provide reasonable notice for significant changes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. Your account</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the security of your account credentials. You must be at least 13 years old to use Kairos. You may not use the service for any unlawful purpose.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. Pro subscription</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kairos Pro is a recurring subscription billed monthly or annually. You may cancel at any time; your Pro access continues until the end of the current billing period. Refunds are handled on a case-by-case basis — contact us at{' '}
              <a href="mailto:nils@biblemate.io" className="text-primary hover:underline">nils@biblemate.io</a> within 7 days of a charge if you believe there was an error.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Bible translations</h2>
            <p className="text-muted-foreground leading-relaxed">
              The World English Bible (WEB) and King James Version (KJV) are in the public domain. The Berean Standard Bible (BSB) is used under license. The ESV is used with permission from Crossway. Strong&apos;s concordance data is provided via Open Scriptures under CC-BY-SA.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6. Your content</h2>
            <p className="text-muted-foreground leading-relaxed">
              Highlights, notes, and other content you create in Kairos belong to you. By using the service, you grant us permission to store and display this content as part of operating the app. We do not claim ownership of your study content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">7. AI features</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kairos uses AI to provide study assistance (Ezra, commentary, interlinear explanations). AI responses are for educational and devotional purposes only and should not be treated as authoritative theological doctrine. Always consult Scripture directly and trusted commentators for important doctrinal questions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">8. Limitation of liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kairos is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions? Email us at{' '}
              <a href="mailto:nils@biblemate.io" className="text-primary hover:underline">nils@biblemate.io</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
