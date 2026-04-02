import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-bold text-primary-foreground text-base"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              K
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Kairos
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">📬</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Check your email
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed" style={{ fontFamily: 'system-ui' }}>
              We sent a confirmation link to your inbox. Click it to activate your account and start studying.
            </p>
          </div>

          <div className="pt-1 space-y-3">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Didn&apos;t get it? Check your spam folder, or wait a minute and try again.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-sm text-primary hover:underline font-medium"
              style={{ fontFamily: 'system-ui' }}
            >
              Back to sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
