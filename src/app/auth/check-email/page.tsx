import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-5xl mb-2">📬</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
          Check your email
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed" style={{ fontFamily: 'system-ui' }}>
          We sent a confirmation link to your inbox. Click it to activate your account and start studying.
        </p>
        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
          Didn&apos;t get it? Check your spam folder.
        </p>
        <Link
          href="/auth/login"
          className="inline-block text-sm text-primary hover:underline font-medium mt-2"
          style={{ fontFamily: 'system-ui' }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
