import { useRef, useEffect, useState, useCallback } from 'react'
import ProductModal, { type Product } from './ProductModal'

const GRID_SRC = '/images/bunny-balaclava-grid.png'

interface CapProduct extends Product {
  gridCol: number
  gridRow: number
  accentColor: string
}

const CAPS: CapProduct[] = [
  { id: 'BC01', name: 'Bunny Fitted Cap', color: 'Sky Blue',    price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 0, gridRow: 0, accentColor: '#4A90D9' },
  { id: 'BC02', name: 'Bunny Fitted Cap', color: 'Cherry Red',  price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 1, gridRow: 0, accentColor: '#D94A4A' },
  { id: 'BC03', name: 'Bunny Fitted Cap', color: 'Baby Pink',   price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 2, gridRow: 0, accentColor: '#F2A7C3' },
  { id: 'BC04', name: 'Bunny Fitted Cap', color: 'Grape',       price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 0, gridRow: 1, accentColor: '#7B4FD4' },
  { id: 'BC05', name: 'Bunny Fitted Cap', color: 'Chocolate',   price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 1, gridRow: 1, accentColor: '#6B3A2A' },
  { id: 'BC06', name: 'Bunny Fitted Cap', color: 'Gold',        price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 2, gridRow: 1, accentColor: '#C9A84C' },
  { id: 'BC07', name: 'Bunny Fitted Cap', color: 'Hot Pink',    price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 0, gridRow: 2, accentColor: '#FF2D78' },
  { id: 'BC08', name: 'Bunny Fitted Cap', color: 'Void Black',  price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 1, gridRow: 2, accentColor: '#888888' },
  { id: 'BC09', name: 'Bunny Fitted Cap', color: 'Deep Purple', price: 'R450', src: GRID_SRC, gridSrc: GRID_SRC, gridCol: 2, gridRow: 2, accentColor: '#3D1A6B' },
]

function CapCard({
  cap,
  index,
  revealed,
  spotlit,
  dimmed,
  onClick,
}: {
  cap: CapProduct
  index: number
  revealed: boolean
  spotlit: boolean
  dimmed: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const bgX = `${(cap.gridCol / 2) * 100}%`
  const bgY = `${(cap.gridRow / 2) * 100}%`

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${cap.name} — ${cap.color}`}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'none',
        outline: 'none',
        /* Staggered developing-photo entrance */
        opacity: revealed ? (dimmed ? 0.3 : 1) : 0,
        filter: revealed ? 'brightness(1) contrast(1)' : 'brightness(0) contrast(0)',
        transform: revealed
          ? `translateY(0) scale(${hovered && !dimmed ? 1.04 : spotlit ? 1.02 : 1})`
          : 'translateY(12px)',
        transition: [
          `opacity 500ms ease-out ${index * 80}ms`,
          `filter 600ms ease-out ${index * 80}ms`,
          `transform ${hovered ? '200ms' : '400ms'} ease-out ${revealed ? '0ms' : `${index * 80}ms`}`,
        ].join(', '),
      }}
    >
      {/* Image crop window */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          backgroundImage: `url('${GRID_SRC}')`,
          backgroundSize: '300% 300%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `${bgX} ${bgY}`,
          overflow: 'hidden',
          outline: spotlit ? `3px solid ${cap.accentColor}` : hovered ? `2px solid ${cap.accentColor}` : 'none',
          outlineOffset: spotlit ? 3 : 0,
          transition: 'outline 200ms ease',
        }}
      />

      {/* Always-visible price strip */}
      <div
        style={{
          background: hovered ? '#1A1A1A' : '#111111',
          borderBottom: `3px solid ${cap.accentColor}`,
          padding: '7px 8px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          transition: 'background 200ms ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(10px, 2.5vw, 15px)',
            color: '#F5F0E8',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          {cap.color}
        </span>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(10px, 2.2vw, 13px)',
            fontWeight: 600,
            color: '#E8F542',
            lineHeight: 1,
          }}
        >
          {cap.price}
        </span>
      </div>
    </div>
  )
}

export default function BunnyCapsSection() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const [revealed,  setRevealed]  = useState(false)
  const [spotlight, setSpotlight] = useState<string | null>(null)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const openModal  = useCallback((p: Product) => setActiveProduct(p), [])
  const closeModal = useCallback(() => setActiveProduct(null), [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setRevealed(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  const toggleSpotlight = (id: string) => {
    setSpotlight(prev => prev === id ? null : id)
  }

  return (
    <section
      id="bunny-caps"
      style={{
        background: '#0A0A0A',
        padding: 'clamp(60px, 8vw, 80px) 0',
        overflow: 'hidden',
      }}
    >
      {/* Grain-rule separator from above section */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, #C8B89A 20%, #C8B89A 80%, transparent 100%)',
          opacity: 0.22,
          marginBottom: 'clamp(48px, 6vw, 72px)',
        }}
      />

      <div style={{ padding: '0 clamp(16px, 4vw, 40px)' }}>

        {/* ── SECTION HEADER ── */}
        <div
          style={{
            marginBottom: 'clamp(28px, 4vw, 40px)',
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 700ms ease, transform 700ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              letterSpacing: '0.25em',
              color: '#F5F0E8',
              opacity: 0.5,
              textTransform: 'uppercase',
              margin: '0 0 12px',
            }}
          >
            COLLECTIBLE SERIES 001
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '0 16px', marginBottom: 14 }}>
            <span
              style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: 'clamp(40px, 8vw, 72px)',
                color: '#F5F0E8',
                lineHeight: 0.9,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
              }}
            >
              BUNNY FITTED
            </span>
            <span
              style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: 'clamp(40px, 8vw, 72px)',
                color: '#F2A7C3',
                lineHeight: 0.9,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
              }}
            >
              CAPS
            </span>
          </div>

          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              letterSpacing: '0.18em',
              color: '#C8B89A',
              textTransform: 'uppercase',
              margin: '0 0 6px',
            }}
          >
            9 COLORWAYS. ONE PATCH. PRESENCE THAT SPEAKS LOUDER THAN WORDS.
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: '#F5F0E8',
              opacity: 0.75,
              margin: 0,
            }}
          >
            EACH <strong style={{ color: '#E8F542', fontWeight: 700 }}>R450</strong>
          </p>
        </div>

        {/* ── COLOR SWATCH ROW ── */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
          aria-label="Filter by color"
        >
          {CAPS.map((cap, i) => (
            <button
              key={cap.id}
              aria-label={`Spotlight ${cap.color}`}
              onClick={() => toggleSpotlight(cap.id)}
              style={{
                width: 16,
                height: 16,
                background: cap.accentColor,
                border: spotlight === cap.id
                  ? `2px solid #F5F0E8`
                  : '2px solid transparent',
                borderRadius: '50%',
                cursor: 'none',
                padding: 0,
                flexShrink: 0,
                opacity: revealed ? 1 : 0.3,
                transform: `scale(${spotlight === cap.id ? 1.3 : 1})`,
                transition: [
                  `opacity 400ms ease ${i * 60}ms`,
                  'transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
                  'border-color 150ms ease',
                ].join(', '),
              }}
            />
          ))}
          {spotlight && (
            <button
              onClick={() => setSpotlight(null)}
              style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: 9,
                letterSpacing: '0.2em',
                color: '#C8B89A',
                background: 'transparent',
                border: '1px solid rgba(200,184,154,0.3)',
                padding: '2px 8px',
                cursor: 'none',
                textTransform: 'uppercase',
                alignSelf: 'center',
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#C8B89A'; e.currentTarget.style.borderColor = 'rgba(200,184,154,0.3)' }}
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Brand whisper */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            letterSpacing: '0.28em',
            color: '#7B4FD4',
            opacity: 0.65,
            textTransform: 'uppercase',
            textAlign: 'center',
            margin: '0 0 clamp(20px, 3vw, 32px)',
          }}
        >
          ★ PRESENCE THAT SPEAKS LOUDER THAN WORDS ★
        </p>

        {/* ── 3-COL PRODUCT GRID ── */}
        <div
          ref={sectionRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(8px, 1.5vw, 20px)',
            maxWidth: 1200,
            margin: '0 auto',
          }}
        >
          {CAPS.map((cap, i) => (
            <CapCard
              key={cap.id}
              cap={cap}
              index={i}
              revealed={revealed}
              spotlit={spotlight === cap.id}
              dimmed={spotlight !== null && spotlight !== cap.id}
              onClick={() => openModal(cap)}
            />
          ))}
        </div>
      </div>

      {/* Product modal */}
      <ProductModal product={activeProduct} onClose={closeModal} />
    </section>
  )
}
