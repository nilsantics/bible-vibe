import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Kairos',
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-12" style={{ fontFamily: 'system-ui' }}>
          Last updated: April 2, 2026
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground" style={{ fontFamily: 'system-ui' }}>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. What we collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, we collect your email address and any profile information you choose to provide (such as a username). If you sign in with Google, we receive your name and email from Google.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We store the content you create in Kairos: highlights, notes, bookmarks, reading progress, streaks, and XP. We also store your preferred translation and app settings.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you subscribe to Kairos Pro, your payment is processed by Stripe. We do not store your card details — only a Stripe customer ID and subscription status.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. How we use it</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your data solely to operate and improve Kairos. This includes syncing your study data across sessions, personalizing your experience, and communicating with you about your account.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We use Vercel Analytics to understand aggregate usage patterns (pages visited, performance). This data is anonymized and does not identify individual users.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your data. We do not use your data for advertising. We do not share your personal information with third parties except as necessary to operate the service (Supabase for database/auth, Stripe for payments, Vercel for hosting).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. Push notifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you enable push notifications, we store your browser&apos;s push subscription endpoint on our servers to deliver daily verses and streak reminders. You can disable notifications at any time from Settings, which removes your subscription from our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. Data retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account, all your personal data — including highlights, notes, progress, and authentication credentials — is permanently deleted within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Your rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can delete your account at any time from Settings → Danger zone. This permanently removes all data associated with your account.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You can request a copy of your data or ask any privacy-related questions by emailing us at{' '}
              <a href="mailto:hi@studykairos.app" className="text-primary hover:underline">hi@studykairos.app</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies only for authentication (to keep you signed in). We do not use tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">7. Changes</h2>
            <p className="text-muted-foreground leading-relaxed">
              If we make material changes to this policy, we will notify you by email or by a notice in the app. Your continued use of Kairos after changes take effect constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions? Email us at{' '}
              <a href="mailto:hi@studykairos.app" className="text-primary hover:underline">hi@studykairos.app</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
