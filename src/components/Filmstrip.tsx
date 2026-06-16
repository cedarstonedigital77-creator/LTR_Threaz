import { useRef, useEffect, useState } from 'react'

const FRAMES = [
  { src: '/images/lifestyle-chains.jpg',       label: '▲ 12A ▲' },
  { src: '/images/product-bunny-black.jpg',    label: '▲ 13A ▲' },
  { src: '/images/lifestyle-phone.jpg',        label: '▲ 14A ▲' },
  { src: '/images/product-bunny-pink.jpg',     label: '▲ 15A ▲' },
  { src: '/images/lifestyle-money.jpg',        label: '▲ 16A ▲' },
  { src: '/images/product-slouchy-white.jpg',  label: '▲ 17A ▲' },
  { src: '/images/product-collection.jpg',     label: '▲ 18A ▲' },
  { src: '/images/product-bunny-purple.jpg',   label: '▲ 19A ▲' },
  { src: '/images/hero-model.jpg',             label: '▲ 20A ▲' },
]

export default function Filmstrip() {
  const trackRef    = useRef<HTMLDivElement>(null)
  const sectionRef  = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.1 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)))
      setOffset(progress * 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [visible])

  return (
    <section
      ref={sectionRef}
      style={{ background: '#0A0A0A', padding: '80px 0', overflow: 'hidden' }}
    >
      {/* Section label */}
      <p
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 11,
          letterSpacing: '0.3em',
          color: '#C8B89A',
          textTransform: 'uppercase',
          padding: '0 16px',
          marginBottom: 32,
          opacity: 0.6,
        }}
      >
        THE DARKROOM — SS001 CONTACT SHEET
      </p>

      {/* Film strip */}
      <div
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: 20,
            paddingLeft: 40,
            paddingRight: 40,
            width: 'max-content',
            transform: `translateX(-${offset}vw)`,
            transition: 'transform 60ms linear',
          }}
        >
          {FRAMES.map((frame, i) => (
            <div
              key={i}
              style={{
                width: 240,
                flexShrink: 0,
                marginTop: i % 2 === 1 ? 40 : 0,
              }}
            >
              <div
                style={{
                  border: '8px solid #F5F0E8',
                  overflow: 'hidden',
                  height: 320,
                  position: 'relative',
                }}
              >
                <img
                  src={frame.src}
                  alt={frame.label}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Exposure-like subtle dark vignette */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 9,
                  letterSpacing: '0.35em',
                  color: '#C8B89A',
                  opacity: 0.55,
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                {frame.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
