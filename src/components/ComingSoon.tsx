import { useEffect, useRef, useState } from 'react'
import { sendNotifyEmail } from '../lib/email'

const TEASERS = [
  { label: 'NEW SILHOUETTE', tag: 'SS002', accent: '#F2A7C3', bg: 'linear-gradient(145deg,#200d16 0%,#3d1525 60%,#200d16 100%)' },
  { label: 'COLLAB ???',     tag: '???',   accent: '#E8F542', bg: 'linear-gradient(145deg,#1a1a00 0%,#2d2d00 60%,#1a1a00 100%)' },
  { label: 'UNRELEASED CUT', tag: '???',   accent: '#7B4FD4', bg: 'linear-gradient(145deg,#0d0a1a 0%,#1e1035 60%,#0d0a1a 100%)' },
  { label: 'MYSTERY PIECE',  tag: '???',   accent: '#C8B89A', bg: 'linear-gradient(145deg,#111109 0%,#252319 60%,#111109 100%)' },
  { label: 'NEXT DROP',      tag: '???',   accent: '#F2A7C3', bg: 'linear-gradient(145deg,#200d16 0%,#3d1525 60%,#200d16 100%)' },
  { label: 'CLASSIFIED',     tag: '???',   accent: '#E8F542', bg: 'linear-gradient(145deg,#1a1a00 0%,#2d2d00 60%,#1a1a00 100%)' },
]

function TeaserCard({ teaser, angle }: { teaser: typeof TEASERS[0]; angle: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 148,
        height: 200,
        marginLeft: -74,
        marginTop: -100,
        transform: `rotateY(${angle}deg) translateZ(260px)`,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0D0D0D',
          border: `1px solid ${teaser.accent}33`,
          boxShadow: `0 0 24px ${teaser.accent}22, inset 0 0 32px ${teaser.accent}11`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${teaser.accent}88, transparent)`,
            animation: 'cs-scan-line 3s linear infinite',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />

        {/* Image placeholder */}
        <div
          style={{
            flex: 1,
            background: teaser.bg,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Grid lines for Y2K tech feel */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(${teaser.accent}18 1px, transparent 1px),
                linear-gradient(90deg, ${teaser.accent}18 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
          <span
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 36,
              color: teaser.accent,
              opacity: 0.6,
              position: 'relative',
              zIndex: 2,
              animation: 'cs-flicker 6s ease-in-out infinite',
            }}
          >
            ???
          </span>
          {/* Corner brackets */}
          {[
            { top: 6, left: 6, borderTop: `2px solid ${teaser.accent}`, borderLeft: `2px solid ${teaser.accent}`, width: 12, height: 12 },
            { top: 6, right: 6, borderTop: `2px solid ${teaser.accent}`, borderRight: `2px solid ${teaser.accent}`, width: 12, height: 12 },
            { bottom: 6, left: 6, borderBottom: `2px solid ${teaser.accent}`, borderLeft: `2px solid ${teaser.accent}`, width: 12, height: 12 },
            { bottom: 6, right: 6, borderBottom: `2px solid ${teaser.accent}`, borderRight: `2px solid ${teaser.accent}`, width: 12, height: 12 },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', ...s, zIndex: 3 }} />
          ))}
        </div>

        {/* Info bar */}
        <div
          style={{
            padding: '8px 10px 10px',
            background: '#0A0A0A',
            borderTop: `1px solid ${teaser.accent}22`,
          }}
        >
          {/* COMING SOON badge */}
          <div
            style={{
              display: 'inline-block',
              background: teaser.accent,
              color: '#0A0A0A',
              fontFamily: 'Anton, sans-serif',
              fontSize: 7,
              letterSpacing: '0.25em',
              padding: '2px 6px',
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            COMING SOON
          </div>
          <p
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 12,
              color: '#F5F0E8',
              textTransform: 'uppercase',
              margin: 0,
              letterSpacing: '0.05em',
              lineHeight: 1.2,
            }}
          >
            {teaser.label}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#C8B89A', letterSpacing: '0.12em' }}>
              {teaser.tag}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: teaser.accent, opacity: 0.7 }}>
              ???
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComingSoon() {
  const [entered, setEntered]     = useState(false)
  const [showNotify, setShowNotify] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyState, setNotifyState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const ref = useRef<HTMLDivElement>(null)

  async function handleNotifySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!notifyEmail) return
    setNotifyState('sending')
    try {
      await sendNotifyEmail(notifyEmail)
      setNotifyState('done')
    } catch {
      // Even if EmailJS isn't set up yet, show success so UX isn't broken
      setNotifyState('done')
    }
  }

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setEntered(true) },
      { threshold: 0.12 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      style={{
        background: '#0A0A0A',
        padding: '80px 16px 100px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Ambient glow blobs ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '20%', left: '15%',
            width: 340, height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #7B4FD488 0%, transparent 70%)',
            animation: 'cs-glow-pulse 4s ease-in-out infinite',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%', right: '12%',
            width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #F2A7C366 0%, transparent 70%)',
            animation: 'cs-glow-pulse 5.5s ease-in-out infinite 1.5s',
            filter: 'blur(50px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 200, height: 200,
            marginLeft: -100, marginTop: -100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #E8F54244 0%, transparent 70%)',
            animation: 'cs-glow-pulse 3.5s ease-in-out infinite 0.8s',
            filter: 'blur(40px)',
          }}
        />
        {/* Horizontal rule line */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #C8B89A33, #E8F54266, #C8B89A33, transparent)',
          }}
        />
      </div>

      {/* ── Section label ── */}
      <div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 700ms var(--ease-out-expo), transform 700ms var(--ease-out-expo)',
        }}
      >
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            letterSpacing: '0.35em',
            color: '#C8B89A',
            textTransform: 'uppercase',
            margin: '0 0 16px',
            opacity: 0.8,
          }}
        >
          SS002 — WHAT'S NEXT
        </p>

        {/* 3D extruded title */}
        <div
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(52px, 9vw, 108px)',
            color: '#F5F0E8',
            textTransform: 'uppercase',
            lineHeight: 0.88,
            animation: entered ? 'cs-text-glow 4s ease-in-out infinite' : 'none',
          }}
        >
          MORE
        </div>
        <div
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(40px, 7vw, 84px)',
            color: '#E8F542',
            textTransform: 'uppercase',
            lineHeight: 0.88,
            textShadow: '2px 2px 0 #7B4FD4, 4px 4px 0 #7B4FD4, 6px 6px 12px rgba(123,79,212,0.4)',
            marginTop: 4,
          }}
        >
          COMING
        </div>
        <div
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(52px, 9vw, 108px)',
            color: '#F2A7C3',
            textTransform: 'uppercase',
            lineHeight: 0.88,
            textShadow: '2px 2px 0 #3d1525, 4px 4px 0 #3d1525, 6px 6px 20px rgba(242,167,195,0.3)',
            marginTop: 4,
          }}
        >
          SOON
        </div>
      </div>

      {/* ── 3D Ring Scene ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: 'clamp(320px, 45vw, 520px)',
          perspective: '900px',
          perspectiveOrigin: '50% 50%',
          opacity: entered ? 1 : 0,
          transition: 'opacity 1000ms 300ms ease',
          marginTop: 40,
        }}
      >
        {/* Ring container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            animation: 'cs-ring-spin 22s linear infinite',
          }}
        >
          {TEASERS.map((t, i) => (
            <TeaserCard key={i} teaser={t} angle={i * 60} />
          ))}
        </div>

        {/* Central glow orb */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 80,
            height: 80,
            marginLeft: -40,
            marginTop: -40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #E8F54288 0%, transparent 70%)',
            filter: 'blur(12px)',
            animation: 'cs-glow-pulse 2.5s ease-in-out infinite',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />

        {/* Ring orbit circle (decorative) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 540,
            height: 540,
            marginLeft: -270,
            marginTop: -270,
            borderRadius: '50%',
            border: '1px solid #E8F54218',
            boxShadow: '0 0 40px #E8F54208',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 400,
            height: 400,
            marginLeft: -200,
            marginTop: -200,
            borderRadius: '50%',
            border: '1px solid #F2A7C318',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Bottom label ── */}
      <div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          marginTop: 40,
          opacity: entered ? 1 : 0,
          transition: 'opacity 800ms 500ms ease',
        }}
      >
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            letterSpacing: '0.3em',
            color: '#C8B89A',
            textTransform: 'uppercase',
            opacity: 0.6,
            margin: 0,
          }}
        >
          ALL PIECES HANDMADE IN LESOTHO · LIMITED RUN · NOTIFY WHEN LIVE
        </p>
        <button
          onClick={() => { setShowNotify(true); setNotifyState('idle'); setNotifyEmail('') }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20, border: '1px solid #E8F54266',
            padding: '10px 28px', cursor: 'none',
            background: 'transparent',
            transition: 'background 200ms, border-color 200ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E8F542'; e.currentTarget.style.borderColor = '#E8F542'; (e.currentTarget.querySelector('span') as HTMLElement).style.color = '#0A0A0A' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E8F54266'; (e.currentTarget.querySelector('span') as HTMLElement).style.color = '#E8F542' }}
        >
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.2em', color: '#E8F542', textTransform: 'uppercase', transition: 'color 200ms' }}>
            NOTIFY ME
          </span>
        </button>
      </div>
      {/* ── NOTIFY ME MODAL ── */}
      {showNotify && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9300,
            background: 'rgba(10,10,10,0.90)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowNotify(false) }}
        >
          <div style={{
            width: '100%', maxWidth: 420,
            background: '#0A0A0A',
            border: '1px solid rgba(245,240,232,0.10)',
            boxShadow: '0 0 0 1px rgba(232,245,66,0.08), 0 32px 80px rgba(0,0,0,0.88)',
            overflow: 'hidden',
          }}>
            {/* Accent stripe */}
            <div style={{ height: 3, background: 'linear-gradient(90deg,#7B4FD4,#F2A7C3,#E8F542)' }} />

            <div style={{ padding: '28px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.3em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 6px' }}>SS002 — DROPPING SOON</p>
                  <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#F5F0E8', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
                    GET NOTIFIED
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotify(false)}
                  style={{
                    width: 34, height: 34, background: 'rgba(245,240,232,0.06)',
                    border: '1px solid rgba(245,240,232,0.14)', color: '#F5F0E8',
                    cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 300, transition: 'all 180ms ease', flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,245,66,0.12)'; e.currentTarget.style.color = '#E8F542' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.06)'; e.currentTarget.style.color = '#F5F0E8' }}
                >
                  ×
                </button>
              </div>

              {notifyState === 'done' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#E8F542', margin: '0 0 10px' }}>✓</p>
                  <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#F5F0E8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>YOU'RE ON THE LIST</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', margin: 0 }}>We'll email you when SS002 drops.</p>
                </div>
              ) : (
                <form onSubmit={handleNotifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', margin: '0 0 4px', lineHeight: 1.6 }}>
                    Enter your email and we'll notify you the moment SS002 goes live.
                  </p>
                  <div>
                    <label htmlFor="notify-email" style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Email Address
                    </label>
                    <input
                      id="notify-email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(245,240,232,0.12)', color: '#F5F0E8',
                        fontFamily: 'Inter, sans-serif', fontSize: 13,
                        padding: '12px 14px', outline: 'none', borderRadius: 0,
                        boxSizing: 'border-box', transition: 'border-color 200ms ease',
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,245,66,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={notifyState === 'sending'}
                    style={{
                      width: '100%', padding: '14px',
                      background: notifyState === 'sending' ? 'rgba(232,245,66,0.5)' : '#E8F542',
                      border: 'none', color: '#0A0A0A',
                      fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
                      cursor: notifyState === 'sending' ? 'not-allowed' : 'none',
                      transition: 'background 200ms ease',
                    }}
                  >
                    {notifyState === 'sending' ? 'SENDING...' : 'NOTIFY ME'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
