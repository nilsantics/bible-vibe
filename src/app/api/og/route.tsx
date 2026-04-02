import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const verse = searchParams.get('verse') ?? ''
  const ref = searchParams.get('ref') ?? ''
  const isVerse = verse.length > 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e0a3c 0%, #2d0f5e 50%, #1a0832 100%)',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Subtle corner glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: isVerse ? '40px' : '0',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: '700',
              color: 'white',
            }}
          >
            K
          </div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.12em',
            }}
          >
            KAIROS
          </span>
        </div>

        {isVerse ? (
          <>
            {/* Verse text */}
            <div
              style={{
                fontSize: verse.length > 120 ? '26px' : verse.length > 80 ? '30px' : '34px',
                color: 'rgba(255,255,255,0.95)',
                textAlign: 'center',
                lineHeight: 1.5,
                fontStyle: 'italic',
                maxWidth: '900px',
                marginBottom: '28px',
              }}
            >
              &ldquo;{verse}&rdquo;
            </div>
            {/* Reference */}
            {ref && (
              <div
                style={{
                  fontSize: '20px',
                  color: 'rgba(167,139,250,0.9)',
                  letterSpacing: '0.08em',
                  fontWeight: '500',
                }}
              >
                — {ref}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px', marginTop: '32px' }}>
            <div
              style={{
                fontSize: '72px',
                fontWeight: '300',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                lineHeight: 1.05,
              }}
            >
              Your moment
            </div>
            <div
              style={{
                fontSize: '72px',
                fontWeight: '600',
                color: 'rgba(167,139,250,1)',
                textAlign: 'center',
                lineHeight: 1.05,
                marginBottom: '36px',
              }}
            >
              in the Word.
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              {['AI Study Companion', '430K Cross-References', 'Hebrew & Greek'].map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {i > 0 && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(167,139,250,0.5)', display: 'flex' }} />}
                  <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
