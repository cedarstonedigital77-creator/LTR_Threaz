import { useEffect, useRef, useCallback } from 'react'
import { X, ShoppingBag } from 'lucide-react'
import { type Product, type CartItem } from './ProductModal'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FullLookModalProps {
  product: Product | null
  onClose: () => void
  onCheckout: (items: CartItem[]) => void
}

// ─── Geometry helper ─────────────────────────────────────────────────────────

// Three diamond outlines at different depths — defined as SVG path data
// so they're pure CSS-rendered shapes with zero canvas overhead.
const DIAMONDS = [
  {
    // Large — back-most, slowest, grape purple
    size: 320,
    color: '#7B4FD4',
    opacity: 0.13,
    duration: '18s',
    delay: '0s',
    translateZ: -120,
    top: '8%',
    left: '4%',
    direction: 'normal' as const,
  },
  {
    // Medium — mid-depth, blush pink
    size: 200,
    color: '#F2A7C3',
    opacity: 0.18,
    duration: '13s',
    delay: '-4s',
    translateZ: -60,
    top: '55%',
    left: '68%',
    direction: 'reverse' as const,
  },
  {
    // Small — nearest, lemon yellow, fastest
    size: 120,
    color: '#E8F542',
    opacity: 0.22,
    duration: '9s',
    delay: '-2s',
    translateZ: -20,
    top: '72%',
    left: '12%',
    direction: 'normal' as const,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function FullLookModal({ product, onClose, onCheckout }: FullLookModalProps) {
  const overlayRef   = useRef<HTMLDivElement>(null)
  const panelRef     = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)
  const glossRef     = useRef<HTMLDivElement>(null)
  const closeRef     = useRef<HTMLButtonElement>(null)
  const rafRef       = useRef<number | null>(null)
  const tiltRef      = useRef({ rx: 0, ry: 0 })
  const isOpen       = product !== null

  // ── Open / close animation ─────────────────────────────────────────────────
  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return

    if (isOpen) {
      overlay.dataset.state = 'open'
      panel.dataset.state   = 'open'
      const scrollbarW = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow     = 'hidden'
      document.body.style.paddingRight = `${scrollbarW}px`
      setTimeout(() => closeRef.current?.focus(), 80)
    } else {
      overlay.dataset.state = 'closed'
      panel.dataset.state   = 'closed'
      document.body.style.overflow     = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  // ── ESC key ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // ── Backdrop click ────────────────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose]
  )

  // ── Mouse tilt on card ────────────────────────────────────────────────────
  // We use a rAF loop for buttery smoothing — lerp toward target each frame.
  const targetTilt = useRef({ rx: 0, ry: 0 })
  const isHovering = useRef(false)

  const animateTilt = useCallback(() => {
    const card  = cardRef.current
    const gloss = glossRef.current
    if (!card || !gloss) return

    // Lerp current toward target
    tiltRef.current.rx += (targetTilt.current.rx - tiltRef.current.rx) * 0.1
    tiltRef.current.ry += (targetTilt.current.ry - tiltRef.current.ry) * 0.1

    const rx = tiltRef.current.rx
    const ry = tiltRef.current.ry

    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`

    // Gloss moves opposite to tilt — simulates a specular highlight sliding across
    const glossX = 50 - ry * 2.8
    const glossY = 50 + rx * 2.8
    gloss.style.background = `radial-gradient(
      ellipse 60% 55% at ${glossX}% ${glossY}%,
      rgba(255,255,255,0.18) 0%,
      rgba(255,255,255,0.05) 40%,
      transparent 70%
    )`

    if (isHovering.current || Math.abs(rx) > 0.05 || Math.abs(ry) > 0.05) {
      rafRef.current = requestAnimationFrame(animateTilt)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx   = rect.left + rect.width  / 2
    const cy   = rect.top  + rect.height / 2
    const dx   = (e.clientX - cx) / (rect.width  / 2)   // –1 … +1
    const dy   = (e.clientY - cy) / (rect.height / 2)   // –1 … +1

    // Max ±12 degrees
    targetTilt.current.rx = -dy * 12
    targetTilt.current.ry =  dx * 12

    if (!isHovering.current) {
      isHovering.current = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(animateTilt)
    }
  }, [animateTilt])

  const handleMouseLeave = useCallback(() => {
    isHovering.current = false
    targetTilt.current = { rx: 0, ry: 0 }
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(animateTilt)
    }
  }, [animateTilt])

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      role="dialog"
      className="fl-overlay"
      aria-modal="true"
      aria-label={product ? `Full look — ${product.name}` : 'Full look viewer'}
      data-state="closed"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(6,6,6,0.94)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1), visibility 0ms 360ms',
        overflow: 'hidden',
      }}
    >

      {/* ── AMBIENT GLOW BLOBS ─────────────────────────────────────────────── */}
      {/* These sit outside the panel so they bleed across the full overlay */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>

        {/* Blush blob — top-right */}
        <div style={{
          position: 'absolute',
          top: '-8%',
          right: '-6%',
          width: 540,
          height: 540,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242,167,195,0.22) 0%, transparent 68%)',
          filter: 'blur(48px)',
          animation: 'fl-glow-pulse 5s ease-in-out infinite',
        }} />

        {/* Grape blob — bottom-left */}
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(123,79,212,0.28) 0%, transparent 68%)',
          filter: 'blur(56px)',
          animation: 'fl-glow-pulse 6.5s ease-in-out infinite 1.8s',
        }} />

        {/* Lemon blob — centre-bottom whisper */}
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          width: 280,
          height: 280,
          marginLeft: -140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,245,66,0.10) 0%, transparent 70%)',
          filter: 'blur(36px)',
          animation: 'fl-glow-pulse 4s ease-in-out infinite 0.5s',
        }} />
      </div>

      {/* ── PANEL ─────────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className="fl-panel"
        data-state="closed"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 540,
          // Full-screen feel on mobile, constrained card on desktop
          maxHeight: 'calc(100dvh - 32px)',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          // Entrance animation — slides up from 60px
          transform: 'translateY(60px)',
          opacity: 0,
          transition: [
            'transform 480ms cubic-bezier(0.16,1,0.3,1)',
            'opacity   480ms cubic-bezier(0.16,1,0.3,1)',
          ].join(', '),
          overflowY: 'auto',
          overflowX: 'hidden',
          // Custom scrollbar to match brand
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(232,245,66,0.18) transparent',
        }}
      >

        {/* ── CLOSE BUTTON ─────────────────────────────────────────────────── */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close full look viewer"
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9210,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(245,240,232,0.22)',
            border: '1.5px solid rgba(245,240,232,0.60)',
            color: '#FFFFFF',
            cursor: 'none',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'background 180ms ease, border-color 180ms ease, color 180ms ease, transform 220ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.background    = '#E8F542'
            el.style.borderColor   = '#E8F542'
            el.style.color         = '#0A0A0A'
            el.style.transform     = 'rotate(90deg) scale(1.1)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background    = 'rgba(245,240,232,0.22)'
            el.style.borderColor   = 'rgba(245,240,232,0.60)'
            el.style.color         = '#FFFFFF'
            el.style.transform     = 'rotate(0deg) scale(1)'
          }}
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* ── SKU / SEASON EYEBROW ─────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            width: '100%',
            textAlign: 'center',
            paddingTop: 8,
            paddingBottom: 16,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 9,
            letterSpacing: '0.38em',
            color: '#C8B89A',
            textTransform: 'uppercase',
            margin: 0,
            opacity: 0.7,
          }}>
            LRT THREADZ — FULL LOOK / {product?.id ?? '---'}
          </p>
        </div>

        {/* ── 3D SCENE CONTAINER ───────────────────────────────────────────── */}
        {/* perspective lives here; card has preserve-3d */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            // Diamond shapes orbit in this space, behind the card
            perspective: '1000px',
            perspectiveOrigin: '50% 50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Fixed height so shapes don't shift layout
            minHeight: 'clamp(340px, 56vh, 520px)',
          }}
        >

          {/* ── FLOATING DEPTH LAYERS — diamonds behind the card ─────────── */}
          {DIAMONDS.map((d, i) => (
            <div
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: d.top,
                left: d.left,
                width: d.size,
                height: d.size,
                // Push into Z-depth
                transform: `translateZ(${d.translateZ}px)`,
                zIndex: 1,
                animation: `fl-diamond-spin-${i} ${d.duration} linear ${d.delay} infinite ${d.direction}`,
                pointerEvents: 'none',
              }}
            >
              {/* Diamond is a rotated square with only border — pure CSS */}
              <div style={{
                width: '70%',
                height: '70%',
                margin: '15% auto',
                border: `1.5px solid ${d.color}`,
                opacity: d.opacity,
                transform: 'rotate(45deg)',
                // Inner cross lines for Y2K tech-grid feel
                boxShadow: `0 0 12px ${d.color}44, inset 0 0 20px ${d.color}11`,
              }} />
            </div>
          ))}

          {/* Second set — counter-rotate for depth richness */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '20%',
              right: '5%',
              width: 160,
              height: 160,
              transform: 'translateZ(-80px)',
              zIndex: 1,
              animation: 'fl-diamond-spin-3 24s linear -6s infinite reverse',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '65%',
              height: '65%',
              margin: '17.5% auto',
              border: '1.5px solid #F2A7C3',
              opacity: 0.12,
              transform: 'rotate(45deg)',
              boxShadow: '0 0 10px rgba(242,167,195,0.3)',
            }} />
          </div>

          {/* ── 3D PRODUCT CARD ──────────────────────────────────────────── */}
          {/* The card sits at z:0, the diamonds are pushed back */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'relative',
              zIndex: 4,
              cursor: 'none',
              // Size: 60% screen height target; clamp to sensible range
              width: 'clamp(260px, 42vw, 380px)',
              aspectRatio: '3/4',
            }}
          >
            {/* Card itself — preserve-3d enables the shine overlay to sit proud */}
            <div
              ref={cardRef}
              style={{
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                // Default state — no tilt, transition used on leave
                transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
                transition: 'transform 100ms linear',
                willChange: 'transform',
                position: 'relative',
                // Card border and glow
                border: '1px solid rgba(245,240,232,0.12)',
                boxShadow: [
                  '0 0 0 1px rgba(232,245,66,0.08)',
                  '0 24px 64px rgba(0,0,0,0.75)',
                  '0 4px 20px rgba(123,79,212,0.20)',
                ].join(', '),
                overflow: 'hidden',
                background: '#0D0D0D',
              }}
            >

              {/* Brand accent stripe across top */}
              <div aria-hidden="true" style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #7B4FD4 0%, #F2A7C3 40%, #E8F542 100%)',
                zIndex: 10,
              }} />

              {/* Product image — covers full card */}
              {product && (
                product.gridSrc ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url('${product.gridSrc}')`,
                      backgroundSize: '300% 300%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: `${((product.gridCol ?? 0) / 2) * 100}% ${((product.gridRow ?? 0) / 2) * 100}%`,
                    }}
                    role="img"
                    aria-label={`${product.name} — ${product.color}`}
                  />
                ) : (
                  <img
                    src={product.src}
                    alt={`${product.name} — ${product.color}`}
                    loading="eager"
                    decoding="async"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )
              )}

              {/* Bottom vignette — gradient so text at bottom is legible */}
              <div aria-hidden="true" style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(6,6,6,0.72) 0%, rgba(6,6,6,0.18) 42%, transparent 65%)',
                zIndex: 5,
              }} />

              {/* HANDMADE badge — bottom left above vignette */}
              <div style={{
                position: 'absolute',
                bottom: 14,
                left: 14,
                background: '#F2A7C3',
                color: '#0A0A0A',
                fontFamily: 'Anton, sans-serif',
                fontSize: 8,
                letterSpacing: '0.28em',
                padding: '3px 8px',
                textTransform: 'uppercase',
                zIndex: 8,
              }}>
                HANDMADE
              </div>

              {/* SS001 season tag — bottom right */}
              <div style={{
                position: 'absolute',
                bottom: 14,
                right: 14,
                background: 'rgba(10,10,10,0.72)',
                border: '1px solid rgba(232,245,66,0.30)',
                color: '#E8F542',
                fontFamily: 'Inter, sans-serif',
                fontSize: 8,
                letterSpacing: '0.20em',
                padding: '3px 7px',
                textTransform: 'uppercase',
                zIndex: 8,
              }}>
                SS001
              </div>

              {/* ── HOLOGRAPHIC GLOSS OVERLAY ─────────────────────────── */}
              {/* translateZ pushes it 1px in front of the card face */}
              <div
                ref={glossRef}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 9,
                  pointerEvents: 'none',
                  // Initial centre gloss — updated by mouse move
                  background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)',
                  mixBlendMode: 'screen',
                  transform: 'translateZ(1px)',
                  transition: 'background 60ms linear',
                }}
              />

              {/* Edge prismatic sheen — static rainbow rim */}
              <div aria-hidden="true" style={{
                position: 'absolute',
                inset: 0,
                zIndex: 8,
                pointerEvents: 'none',
                background: [
                  'linear-gradient(135deg,',
                  '  rgba(232,245,66,0.06) 0%,',
                  '  rgba(242,167,195,0.06) 33%,',
                  '  rgba(123,79,212,0.06) 66%,',
                  '  transparent 100%',
                  ')',
                ].join(''),
                mixBlendMode: 'screen',
              }} />

            </div>
          </div>

        </div>{/* end 3D scene container */}

        {/* ── PRODUCT NAME — 3D extruded text ──────────────────────────────── */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          padding: '28px 20px 0',
          position: 'relative',
          zIndex: 3,
        }}>

          {/* Main product name — chalk with lemon/purple stacked extrusion */}
          <div
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 'clamp(44px, 9vw, 72px)',
              color: '#F5F0E8',
              textTransform: 'uppercase',
              lineHeight: 0.9,
              letterSpacing: '0.02em',
              textShadow: [
                '1px 1px 0 #E8F542',
                '2px 2px 0 #E8F542',
                '3px 3px 0 #F2A7C3',
                '4px 4px 0 #F2A7C3',
                '5px 5px 0 #7B4FD4',
                '6px 6px 0 #7B4FD4',
                '8px 8px 20px rgba(123,79,212,0.35)',
              ].join(', '),
              animation: 'fl-text-breathe 5s ease-in-out infinite',
            }}
          >
            {product?.name ?? '---'}
          </div>

          {/* Color line — smaller, lemon yellow with grape extrusion */}
          <div
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 'clamp(20px, 4vw, 32px)',
              color: '#E8F542',
              textTransform: 'uppercase',
              lineHeight: 1,
              letterSpacing: '0.18em',
              marginTop: 6,
              textShadow: '2px 2px 0 #7B4FD4, 4px 4px 8px rgba(123,79,212,0.4)',
            }}
          >
            {product?.color ?? '---'}
          </div>
        </div>

        {/* ── PRICE CHIP ───────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 20,
          position: 'relative',
          zIndex: 3,
          // Float it slightly in 3D space with a subtle perspective shadow
          transform: 'perspective(400px) rotateX(4deg)',
          transformOrigin: '50% 100%',
        }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#E8F542',
              color: '#0A0A0A',
              padding: '8px 22px',
              // Y2K chip — hard shadow for depth
              boxShadow: '3px 3px 0 #7B4FD4, 6px 6px 0 rgba(123,79,212,0.35)',
              position: 'relative',
            }}
          >
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              opacity: 0.6,
            }}>
              PRICE
            </span>
            <span style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 28,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}>
              {product?.price ?? '---'}
            </span>
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 8,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              opacity: 0.55,
            }}>
              ZAR
            </span>
          </div>
        </div>

        {/* ── DETAIL STRIP ─────────────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(16px, 4vw, 36px)',
          marginTop: 20,
          padding: '0 20px',
          position: 'relative',
          zIndex: 3,
        }}>
          {[
            { label: 'Material',  value: '100% Cotton Yarn' },
            { label: 'Technique', value: 'Hand Crocheted'   },
            { label: 'Season',    value: 'SS001'             },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 8,
                letterSpacing: '0.28em',
                color: '#5A5040',
                textTransform: 'uppercase',
                margin: '0 0 3px',
              }}>
                {label}
              </p>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#C8B89A',
                margin: 0,
                letterSpacing: '0.06em',
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
        <div aria-hidden="true" style={{
          width: 'calc(100% - 40px)',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(232,245,66,0.18), rgba(242,167,195,0.14), transparent)',
          margin: '22px 20px 0',
        }} />

        {/* ── CTA — ORDER NOW ──────────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          padding: '20px 20px 8px',
          position: 'relative',
          zIndex: 3,
        }}>
          <button
            onClick={() => product && onCheckout([{ product, quantity: 1 }])}
            style={{
              width: '100%',
              padding: '18px 24px',
              background: '#E8F542',
              border: 'none',
              color: '#0A0A0A',
              fontFamily: 'Anton, sans-serif',
              fontSize: 14,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              cursor: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              // Hard offset shadow — same Y2K language as price chip
              boxShadow: '4px 4px 0 #7B4FD4, 8px 8px 0 rgba(123,79,212,0.25)',
              transition: [
                'background 160ms ease',
                'box-shadow 160ms ease',
                'transform   160ms cubic-bezier(0.34,1.56,0.64,1)',
              ].join(', '),
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = '#F5FF60'
              e.currentTarget.style.transform   = 'translate(-2px, -2px)'
              e.currentTarget.style.boxShadow   = '6px 6px 0 #7B4FD4, 10px 10px 0 rgba(123,79,212,0.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = '#E8F542'
              e.currentTarget.style.transform   = 'translate(0,0)'
              e.currentTarget.style.boxShadow   = '4px 4px 0 #7B4FD4, 8px 8px 0 rgba(123,79,212,0.25)'
            }}
          >
            <ShoppingBag size={16} />
            ORDER NOW
          </button>
        </div>


      </div>{/* end fl-panel */}

      {/* ── KEYFRAMES + DATA-STATE TRANSITIONS ─────────────────────────────── */}
      <style>{`

        /* ── Open state — overlay ── */
        .fl-overlay[data-state="open"] {
          opacity: 1 !important;
          visibility: visible !important;
          transition:
            opacity     360ms cubic-bezier(0.16,1,0.3,1),
            visibility  0ms 0ms !important;
        }

        /* ── Open state — panel ── */
        .fl-overlay[data-state="open"] .fl-panel[data-state="open"] {
          transform: translateY(0) !important;
          opacity: 1 !important;
        }

        /* ── Ambient glow pulse ── */
        @keyframes fl-glow-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }

        /* ── Product name extrusion breathe ── */
        @keyframes fl-text-breathe {
          0%, 100% {
            text-shadow:
              1px 1px 0 #E8F542, 2px 2px 0 #E8F542,
              3px 3px 0 #F2A7C3, 4px 4px 0 #F2A7C3,
              5px 5px 0 #7B4FD4, 6px 6px 0 #7B4FD4,
              8px 8px 20px rgba(123,79,212,0.35);
          }
          50% {
            text-shadow:
              1px 1px 0 #E8F542, 2px 2px 0 #E8F542,
              3px 3px 0 #F2A7C3, 4px 4px 0 #F2A7C3,
              5px 5px 0 #7B4FD4, 6px 6px 0 #7B4FD4,
              8px 8px 40px rgba(123,79,212,0.65),
              0px 0px 30px rgba(232,245,66,0.15);
          }
        }

        /* ── Diamond shape rotations — each at its own speed ── */
        @keyframes fl-diamond-spin-0 {
          from { transform: translateZ(-120px) rotateZ(0deg); }
          to   { transform: translateZ(-120px) rotateZ(360deg); }
        }
        @keyframes fl-diamond-spin-1 {
          from { transform: translateZ(-60px) rotateZ(0deg); }
          to   { transform: translateZ(-60px) rotateZ(360deg); }
        }
        @keyframes fl-diamond-spin-2 {
          from { transform: translateZ(-20px) rotateZ(0deg); }
          to   { transform: translateZ(-20px) rotateZ(360deg); }
        }
        @keyframes fl-diamond-spin-3 {
          from { transform: translateZ(-80px) rotateZ(0deg); }
          to   { transform: translateZ(-80px) rotateZ(360deg); }
        }

        /* ── Reduced motion: strip all animated values ── */
        @media (prefers-reduced-motion: reduce) {
          .fl-overlay, .fl-panel {
            transition: opacity 120ms linear !important;
            transform: none !important;
          }
          .fl-panel {
            transform: none !important;
            opacity: 1 !important;
          }
          [style*="fl-glow-pulse"],
          [style*="fl-diamond-spin"],
          [style*="fl-text-breathe"] {
            animation: none !important;
          }
        }

        /* ── Panel scrollbar styling ── */
        .fl-panel::-webkit-scrollbar {
          width: 3px;
        }
        .fl-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .fl-panel::-webkit-scrollbar-thumb {
          background: rgba(232,245,66,0.20);
        }

      `}</style>

    </div>
  )
}
