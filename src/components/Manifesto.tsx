import { useRef, useEffect, useState } from 'react'

const LETTERS = 'PRESENCE THAT SPEAKS LOUDER THAN WORDS'.split('')

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#E8F542',
        overflow: 'hidden',
        padding: '60px 16px',
      }}
    >
      {/* Grain on yellow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          opacity: 0.1,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />

      {/* Big text */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          lineHeight: 0.9,
          gap: '0 2px',
        }}
      >
        {LETTERS.map((char, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 'clamp(48px, 8vw, 120px)',
              color: '#0A0A0A',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              display: char === ' ' ? 'block' : 'inline-block',
              width: char === ' ' ? '100%' : undefined,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-48px)',
              transition: `opacity 400ms ease ${i * 28}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${i * 28}ms`,
            }}
          >
            {char === ' ' ? null : char}
          </span>
        ))}
      </div>

      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          letterSpacing: '0.32em',
          color: '#0A0A0A',
          textTransform: 'uppercase',
          opacity: visible ? 0.6 : 0,
          marginTop: 32,
          transition: 'opacity 600ms 1200ms ease',
          textAlign: 'center',
        }}
      >
        LRT_THREADZ &nbsp;<span aria-hidden="true">✦</span>&nbsp; SS001 &nbsp;<span aria-hidden="true">✦</span>&nbsp; LESOTHO
      </p>

      <a
        href="#collection"
        style={{
          marginTop: 40,
          background: '#0A0A0A',
          color: '#E8F542',
          fontFamily: 'Anton, sans-serif',
          fontSize: 14,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          padding: '16px 36px',
          textDecoration: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 600ms 1400ms ease, transform 150ms ease, box-shadow 150ms ease',
          display: 'inline-block',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '4px 4px 0px #0A0A0A'
          e.currentTarget.style.background = '#F5F0E8'
          e.currentTarget.style.color = '#0A0A0A'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.background = '#0A0A0A'
          e.currentTarget.style.color = '#E8F542'
        }}
      >
        SHOP THE DROP
      </a>
    </section>
  )
}
