import { useRef, useEffect, useState } from 'react'

const CLAPPER_ROWS = [
  { label: 'PRODUCTION', value: 'LRT_THREADZ' },
  { label: 'DIRECTOR',   value: 'LERATO SEHAPI' },
  { label: 'CAMERA',     value: 'VISION' },
  { label: 'SCENE',      value: '001' },
  { label: 'TAKE',       value: 'ONGOING' },
  { label: 'DATE',       value: String(new Date().getFullYear()) },
]

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

export default function About() {
  const ref     = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      id="about"
      ref={ref}
      style={{ background: '#0A0A0A', padding: isMobile ? '60px 20px' : '100px 24px', overflow: 'hidden' }}
    >
      <div
        className="max-w-5xl mx-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr',
          gap: isMobile ? 40 : 'clamp(40px, 6vw, 96px)',
          alignItems: 'center',
        }}
      >
        {/* CSS Clapperboard */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? `rotate(${isMobile ? '-1.5deg' : '-2.5deg'}) translateY(0)`
              : `rotate(${isMobile ? '-1.5deg' : '-2.5deg'}) translateY(40px)`,
            transition: 'opacity 700ms ease, transform 700ms var(--ease-out-expo)',
            width: isMobile ? '100%' : 'clamp(220px, 28vw, 340px)',
            maxWidth: 340,
            margin: isMobile ? '0 auto' : undefined,
          }}
        >
          {/* Diagonal stripes */}
          <div
            style={{
              background: 'repeating-linear-gradient(-45deg, #0A0A0A 0px, #0A0A0A 10px, #F5F0E8 10px, #F5F0E8 20px)',
              height: 52,
              border: '2.5px solid #F5F0E8',
              borderBottom: 'none',
            }}
          />

          {/* Body */}
          <div
            style={{
              background: '#F5F0E8',
              border: '2.5px solid #F5F0E8',
              borderTop: '2px solid #0A0A0A',
              padding: '8px 16px 4px',
            }}
          >
            {CLAPPER_ROWS.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderBottom: i < CLAPPER_ROWS.length - 1 ? '1px solid rgba(10,10,10,0.12)' : 'none',
                  padding: '5px 0',
                }}
              >
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 9, letterSpacing: '0.25em', color: '#0A0A0A', opacity: 0.45, textTransform: 'uppercase' }}>
                  {row.label}
                </span>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#0A0A0A', letterSpacing: '0.04em' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom strip */}
          <div
            style={{
              background: '#F5F0E8',
              border: '2.5px solid #F5F0E8',
              borderTop: '2px solid #0A0A0A',
              padding: '5px 16px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 9, letterSpacing: '0.25em', color: '#0A0A0A', opacity: 0.45 }}>PRESENCE THAT SPEAKS LOUDER THAN WORDS</span>
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 9, letterSpacing: '0.25em', color: '#0A0A0A', opacity: 0.45 }}>© LRT</span>
          </div>
        </div>

        {/* Director's statement */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(48px)',
            transition: 'opacity 700ms 200ms ease, transform 700ms 200ms var(--ease-out-expo)',
          }}
        >
          <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', marginBottom: 16 }}>
            ABOUT THE DIRECTOR
          </p>

          <h2
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 'clamp(32px, 5vw, 64px)',
              color: '#F5F0E8',
              lineHeight: 0.92,
              textTransform: 'uppercase',
              margin: '0 0 24px',
              letterSpacing: '-0.01em',
            }}
          >
            MADE BY HAND.
          </h2>

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#C8B89A', lineHeight: 1.75, marginBottom: 20, maxWidth: 480 }}>
            lrt_threadz is the work of Lerato Sehapi — a designer who turns yarn
            into streetwear that means something.
          </p>

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#C8B89A', lineHeight: 1.75, marginBottom: 20, maxWidth: 480 }}>
            Every stitch is intentional. Every piece is one of a kind.
            This is not fast fashion. This is slow, deliberate, real.
          </p>

          {/* Origin + contact */}
          <div
            style={{
              borderLeft: '3px solid #E8F542',
              paddingLeft: 16,
              marginBottom: 28,
              maxWidth: 480,
            }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#C8B89A', lineHeight: 1.7, margin: 0 }}>
              <span style={{ color: '#F5F0E8', fontWeight: 600 }}>Made in Lesotho.</span>
              {' '}Designed by Lerato Sehapi.
            </p>
            <a
              href="tel:0781506401"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'Anton, sans-serif',
                fontSize: 16,
                color: '#E8F542',
                textDecoration: 'none',
                marginTop: 8,
                letterSpacing: '0.06em',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              078 150 6401
            </a>
          </div>

          <p style={{ fontFamily: 'Inter, sans-serif', fontStyle: 'italic', fontSize: 18, color: '#F2A7C3', margin: 0 }}>
            — Lerato
          </p>

          <div style={{ width: 48, height: 2, background: '#E8F542', marginTop: 28 }} />
        </div>
      </div>
    </section>
  )
}
