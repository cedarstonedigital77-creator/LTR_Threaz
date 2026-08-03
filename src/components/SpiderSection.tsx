import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { type Product } from './ProductModal'

// ─── SPIDER SEASON ────────────────────────────────────────────────────────────
// Names are deliberately evocative rather than trademarked: the boroughs the
// characters come from, plus an alias. Fans read the reference instantly, but
// nothing here is a Marvel mark — see the naming decision in the project notes.

/** The section mixes two silhouettes, so each piece carries its own noun —
 *  otherwise a beanie would be announced to screen readers as a cap. */
type SpiderPiece = Product & { kind: 'cap' | 'beanie' }

// Every Spider Season piece is made in its one colourway only — the eye motif
// is knitted in, not a swappable trim — so all carry fixedColour.
const SPIDER_PIECES: SpiderPiece[] = [
  // Fitted caps — charm-studded, R400
  { src: '/images/spider-cap-black.jpg',     name: 'Brooklyn', color: 'Black',     price: 'R400', id: 'SP01', accentColor: '#E01B24', kind: 'cap',    fixedColour: true },
  { src: '/images/spider-cap-red.jpg',       name: 'Queens',   color: 'Red',       price: 'R400', id: 'SP02', accentColor: '#2B6BFF', kind: 'cap',    fixedColour: true },
  { src: '/images/spider-cap-pink.jpg',      name: 'Ghost',    color: 'Pink',      price: 'R400', id: 'SP03', accentColor: '#FF4FA3', kind: 'cap',    fixedColour: true },
  // Beanies — brimless, no charms, R150
  { src: '/images/spider-beanie-harlem.jpg', name: 'Harlem',   color: 'Red/Black', price: 'R150', id: 'SP04', accentColor: '#E01B24', kind: 'beanie', fixedColour: true },
  { src: '/images/spider-beanie-halo.jpg',   name: 'Halo',     color: 'Pink',      price: 'R150', id: 'SP05', accentColor: '#FF2E93', kind: 'beanie', fixedColour: true },
  { src: '/images/spider-beanie-bronx.jpg',  name: 'Bronx',    color: 'Black/Red', price: 'R150', id: 'SP06', accentColor: '#E01B24', kind: 'beanie', fixedColour: true },
]

const SPIDER_COUNT = 16

/** Deterministic pseudo-random so the drop pattern is stable across renders. */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

function Spider({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.95">
        <path d="M9.5 10.5 L3.5 6.5 M9.5 12.5 L2.5 12 M9.5 14.5 L3.5 17.5 M10 16.5 L6 20.5" />
        <path d="M14.5 10.5 L20.5 6.5 M14.5 12.5 L21.5 12 M14.5 14.5 L20.5 17.5 M14 16.5 L18 20.5" />
      </g>
      <ellipse cx="12" cy="13.5" rx="3.4" ry="4.4" fill="currentColor" />
      <circle cx="12" cy="8.4" r="2.3" fill="currentColor" />
    </svg>
  )
}

/** Classic web corner — mirrored via CSS transform for the opposite side. */
function WebCorner({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" aria-hidden="true" focusable="false" style={style}>
      <g stroke="rgba(255,255,255,0.16)" strokeWidth="0.9">
        {[18, 36, 54, 72, 90, 108].map(r => (
          <path key={r} d={`M0 ${r} Q ${r * 0.55} ${r * 0.55} ${r} 0`} />
        ))}
        {[0, 15, 30, 45, 60, 75, 90].map(a => {
          const rad = (a * Math.PI) / 180
          return <line key={a} x1="0" y1="0" x2={Math.cos(rad) * 118} y2={Math.sin(rad) * 118} />
        })}
      </g>
    </svg>
  )
}

function SpiderCard({ product, onClick }: { product: SpiderPiece; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const accent = product.accentColor ?? '#E01B24'
  const noun = product.kind === 'beanie' ? 'spider beanie' : 'spider cap'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name} ${noun} — ${product.color}`}
      data-cursor-large="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        cursor: 'none',
        border: `1px solid ${hovered ? accent : 'rgba(255,255,255,0.12)'}`,
        boxShadow: hovered ? `0 0 0 1px ${accent}, 0 18px 50px rgba(0,0,0,0.55)` : '0 8px 30px rgba(0,0,0,0.4)',
        transition: 'border-color 300ms ease, box-shadow 300ms ease',
        background: '#0A0A0A',
      }}
    >
      <img
        src={product.src}
        alt={`${product.name} ${noun} — ${product.color}`}
        loading="lazy"
        decoding="async"
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: hovered ? 'scale(1.07)' : 'scale(1)',
          transition: 'transform 700ms cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      />

      {/* Name plate */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: accent, color: '#FFFFFF',
        fontFamily: 'Anton, sans-serif', fontSize: 10, letterSpacing: '0.26em',
        padding: '4px 9px', textTransform: 'uppercase',
      }}>
        {product.name}
      </div>

      {/* Always-legible bottom bar — hover reveals are useless on touch */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(6,6,10,0.95) 0%, rgba(6,6,10,0.6) 55%, transparent 100%)',
        padding: '30px 14px 12px',
        pointerEvents: 'none',
      }}>
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 19, color: '#FFFFFF', textTransform: 'uppercase', margin: 0, lineHeight: 1.05, letterSpacing: '0.03em' }}>
          {product.name}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {product.color}
          </span>
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: accent }}>{product.price}</span>
        </div>
      </div>

      {/* Hover CTA */}
      <div style={{
        position: 'absolute', bottom: 12, left: '50%',
        transform: `translateX(-50%) translateY(${hovered ? 0 : 26}px)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 260ms ease, transform 260ms cubic-bezier(0.34,1.56,0.64,1)',
        background: accent, color: '#FFFFFF',
        padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7,
        pointerEvents: 'none',
      }}>
        <ShoppingBag size={13} />
        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.18em' }}>ADD</span>
      </div>
    </div>
  )
}

export default function SpiderSection({ onProductClick }: { onProductClick: (p: Product) => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)
  const [dropDist, setDropDist] = useState(900)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Theme flips on once the section is meaningfully in view, and stays on —
  // re-triggering on every scroll past would strobe the whole page.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true) },
      { threshold: 0.18 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Spiders fall the full height of the section, whatever that turns out to be.
  // Measured synchronously on mount rather than waiting on the observer: if the
  // ResizeObserver callback is delayed or never delivered, a stale fallback
  // would strand the spiders partway down the section.
  useLayoutEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const measure = () => setDropDist(el.offsetHeight + 200)
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const spiders = useMemo(
    () => Array.from({ length: SPIDER_COUNT }, (_, i) => ({
      id: i,
      left: seeded(i, 1) * 96 + 2,          // vw %, kept off the very edges
      delay: seeded(i, 2) * 9,              // s
      duration: 7 + seeded(i, 3) * 8,       // s
      size: 15 + Math.round(seeded(i, 4) * 17),
      sway: 3 + seeded(i, 5) * 4,           // s
      tint: seeded(i, 6) > 0.62 ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.34)',
    })),
    [],
  )

  return (
    <section
      id="spider-season"
      ref={sectionRef}
      aria-label="Spider Season collection"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '92px 16px 96px',
        // The colour shift is the whole point — dark brand baseline into the
        // red/blue palette the caps are built around.
        background: active
          ? 'linear-gradient(158deg, #1A0308 0%, #7E0D1C 38%, #14265F 100%)'
          : '#0A0A0A',
        transition: 'background 1100ms cubic-bezier(0.65,0,0.35,1)',
      }}
    >
      {/* Web corners */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: -6, left: -6, width: 190, height: 190,
        opacity: active ? 1 : 0, transition: 'opacity 900ms ease 250ms', pointerEvents: 'none',
      }}>
        <WebCorner />
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute', top: -6, right: -6, width: 190, height: 190,
        opacity: active ? 1 : 0, transition: 'opacity 900ms ease 400ms', pointerEvents: 'none',
        transform: 'scaleX(-1)',
      }}>
        <WebCorner />
      </div>

      {/* Falling spiders */}
      <div
        aria-hidden="true"
        className="spider-rain"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}
      >
        {active && spiders.map(s => (
          <div
            key={s.id}
            className="spider-drop"
            style={{
              position: 'absolute',
              top: 0,
              left: `${s.left}%`,
              ['--drop-dist' as string]: `${dropDist}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          >
            <div className="spider-sway" style={{ animationDuration: `${s.sway}s` }}>
              {/* Thread trailing up out of frame */}
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%',
                width: 1, height: 1400,
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.28))',
              }} />
              <div style={{ color: s.tint, display: 'block' }}>
                <Spider size={s.size} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        <div style={{
          opacity: active ? 1 : 0,
          transform: active ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 800ms var(--ease-out-expo), transform 800ms var(--ease-out-expo)',
        }}>
          <div className="flex items-end gap-4 sm:gap-6 flex-wrap">
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(44px, 8vw, 96px)', color: '#FFFFFF', lineHeight: 0.9, textTransform: 'uppercase' }}>
              SPIDER
            </span>
            <span style={{
              fontFamily: 'Anton, sans-serif', fontSize: 'clamp(44px, 8vw, 96px)',
              color: '#E01B24', lineHeight: 0.9, textTransform: 'uppercase', transform: 'translateY(8px)',
              textShadow: '0 0 34px rgba(224,27,36,0.55)',
            }}>
              SEASON
            </span>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', marginTop: 12 }}>
            6 PIECES · HAND-CROCHETED · FROM R150
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 14,
          marginTop: 'clamp(28px, 4vw, 44px)',
        }}>
          {SPIDER_PIECES.map((p, i) => (
            <div
              key={p.id}
              style={{
                height: isMobile ? 340 : 420,
                opacity: active ? 1 : 0,
                transform: active ? 'translateY(0)' : 'translateY(56px)',
                transition: `opacity 700ms var(--ease-out-expo) ${180 + i * 130}ms, transform 700ms var(--ease-out-expo) ${180 + i * 130}ms`,
              }}
            >
              <SpiderCard product={p} onClick={() => onProductClick(p)} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spider-fall {
          0%   { transform: translateY(-160px); opacity: 0; }
          6%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(var(--drop-dist)); opacity: 0; }
        }
        @keyframes spider-swing {
          0%, 100% { transform: translateX(-7px) rotate(-6deg); }
          50%      { transform: translateX(7px)  rotate(6deg); }
        }
        .spider-drop {
          animation-name: spider-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .spider-sway {
          position: relative;
          animation-name: spider-swing;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform-origin: top center;
        }
        @media (prefers-reduced-motion: reduce) {
          .spider-rain { display: none; }
        }
      `}</style>
    </section>
  )
}
