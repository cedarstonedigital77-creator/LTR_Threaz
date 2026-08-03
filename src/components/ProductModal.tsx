import { useEffect, useRef, useCallback, useState } from 'react'
import { X, ShoppingBag, ArrowUpRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  src: string
  name: string
  color: string
  price: string
  id: string
  featured?: boolean
  /** Made in one colourway only — suppresses the custom-colour picker. */
  fixedColour?: boolean
  // Grid-crop fields — for products shown from a collage image
  gridSrc?: string
  gridCol?: number   // 0 | 1 | 2
  gridRow?: number   // 0 | 1 | 2
  accentColor?: string
}

export interface CartItem {
  product: Product
  quantity: number
  size?: string
  customColor?: string
}

interface ProductModalProps {
  product: Product | null
  onClose: () => void
  onCheckout?: (p: Product, size?: string, customColor?: string) => void
  onFullLook?: (p: Product) => void
  onAddToCart?: (product: Product, size?: string, customColor?: string) => void
  onBurst?: (pos: { x: number; y: number }) => void
}

// Colors each product type already has — used to compute custom-order options
// All brand colours available across the full collection
const ALL_BRAND_COLORS = ['Black', 'Blush', 'White', 'Grape', 'Cement', 'Chocolate', 'Baby Blue', 'Baby Pink', 'Lime', 'Cherry Red', 'Red', 'Green']

// ─── Constants ────────────────────────────────────────────────────────────────

const SOLD = 'SOLD'

// Color dot map — maps color names from the PRODUCTS array to brand swatches
const COLOR_SWATCHES: Record<string, string> = {
  Black:        '#0A0A0A',
  Blush:        '#F2A7C3',
  White:        '#F5F0E8',
  Grape:        '#7B4FD4',
  Pearl:        '#E8E0D0',
  Cement:       '#8A8A8A',
  'Hot Pink':   '#FF4D88',
  SS001:        '#E8F542',
  'Baby Blue':  '#4A90D9',
  'Cherry Red': '#D94A4A',
  'Baby Pink':  '#D91A6E',
  Chocolate:    '#6B3A2A',
  Gold:         '#C9A84C',
  'Deep Purple':'#3D1A6B',
  Red:          '#CC1414',
  Green:        '#1A7A2E',
  Lime:         '#A8D400',
  // Spider Season. Two-tone pieces split the dot rather than fall back to the
  // grey placeholder, which read as a broken swatch next to "BLACK/RED".
  Pink:         '#FF2E93',
  'Red/Black':  'linear-gradient(135deg, #E01B24 0 50%, #0A0A0A 50% 100%)',
  'Black/Red':  'linear-gradient(135deg, #0A0A0A 0 50%, #E01B24 50% 100%)',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductModal({ product, onClose, onCheckout, onFullLook, onAddToCart, onBurst }: ProductModalProps) {
  const overlayRef  = useRef<HTMLDivElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)
  const closeRef    = useRef<HTMLButtonElement>(null)
  const isOpen      = product !== null
  const isSold      = product?.price === SOLD
  const isCap       = !!(product?.id.startsWith('BC'))
  const [capSize, setCapSize]         = useState<string>('')
  const [customColor, setCustomColor] = useState<string>('')
  const [justAdded, setJustAdded]     = useState(false)
  const addToCartBtnRef               = useRef<HTMLButtonElement>(null)

  // Most products can be custom-ordered in any brand colour. Pieces marked
  // fixedColour are made in one colourway only, so offering a palette would
  // promise something that cannot be crocheted.
  const customColors = product?.fixedColour ? [] : ALL_BRAND_COLORS

  // ── Animation state via data attribute (no GSAP dep needed) ──────────────
  // CSS does the heavy lifting; we toggle data-state="open" / "closed"
  // to drive transitions. This avoids any forced reflow timing hacks.

  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return

    if (isOpen) {
      // Mount the overlay visible, then immediately set open so the
      // browser paints the initial state before transitioning.
      overlay.dataset.state = 'open'
      panel.dataset.state   = 'open'
      // Lock body scroll, preserve scrollbar width to prevent layout shift
      const scrollbarW = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow     = 'hidden'
      document.body.style.paddingRight = `${scrollbarW}px`
      // Focus trap — move focus into modal
      setTimeout(() => closeRef.current?.focus(), 50)
    } else {
      overlay.dataset.state = 'closed'
      panel.dataset.state   = 'closed'
      document.body.style.overflow     = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  // ── Reset cap size when product changes ──────────────────────────────────
  useEffect(() => { setCapSize(''); setCustomColor('') }, [product?.id])

  // ── ESC key ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // ── Click outside (backdrop) ─────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose]
  )

  // Keep the overlay in the DOM at all times so exit animation plays;
  // visibility: hidden prevents screen-reader access when closed.
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={product ? `${product.name} — ${product.color}` : 'Product detail'}
      data-state="closed"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        // Backdrop: near-black with grain-compatible opacity
        background: 'rgba(10,10,10,0.88)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        // Animation
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1), visibility 0ms 320ms',
      }}
      // Inline style overrides driven by data-state
      // We handle this via a <style> tag below rather than Tailwind so the
      // values stay co-located with the component and are fully type-safe.
    >

      {/* ── MODAL PANEL ──────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        data-state="closed"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 960,
          maxHeight: 'calc(100dvh - 32px)',
          background: '#0A0A0A',
          border: '1px solid rgba(245,240,232,0.10)',
          // Subtle inset glow — brand signature
          boxShadow: '0 0 0 1px rgba(232,245,66,0.06), 0 32px 80px rgba(0,0,0,0.80)',
          display: 'grid',
          // Desktop: 55/45 split. Mobile collapses to single column.
          gridTemplateColumns: '1fr',
          gridTemplateRows: 'auto 1fr',
          overflow: 'hidden',
          // Animation — panel slides up from 40px, scales from 0.94
          transform: 'translateY(40px) scale(0.94)',
          transition: [
            'transform 380ms cubic-bezier(0.16,1,0.3,1)',
            'opacity  380ms cubic-bezier(0.16,1,0.3,1)',
          ].join(', '),
          opacity: 0,
        }}
      >

        {/* ── ACCENT LINE — brand stripe across top ──────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #7B4FD4 0%, #F2A7C3 40%, #E8F542 100%)',
            zIndex: 10,
          }}
        />

        {/* ── CLOSE BUTTON ───────────────────────────────────────────────── */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close product detail"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 20,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10,10,10,0.78)',
            border: '2px solid rgba(255,255,255,0.80)',
            color: '#FFFFFF',
            cursor: 'none',
            boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
            transition: 'background 180ms ease, border-color 180ms ease, transform 180ms cubic-bezier(0.34,1.56,0.64,1)',
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
            el.style.background    = 'rgba(10,10,10,0.78)'
            el.style.borderColor   = 'rgba(255,255,255,0.80)'
            el.style.color         = '#FFFFFF'
            el.style.transform     = 'rotate(0deg) scale(1)'
          }}
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* ── INNER LAYOUT: image + detail (responsive grid) ─────────────── */}
        <div
          className="modal-inner"
          style={{
            display: 'grid',
            // Single column by default (mobile); desktop overridden below
            gridTemplateColumns: '1fr',
            gridTemplateRows: 'auto',
            overflow: 'auto',
            maxHeight: 'calc(100dvh - 32px)',
          }}
        >
          {/* IMAGE PANE */}
          <div
            className="modal-image-pane"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#111111',
              // Mobile: fixed aspect ratio. Desktop: full height fill (handled below)
              aspectRatio: '4/3',
            }}
          >
            {product && product.gridSrc ? (
              /* Grid-crop display — CSS background-position technique */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url('${product.gridSrc}')`,
                  backgroundSize: '300% 300%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `${(product.gridCol! / 2) * 100}% ${(product.gridRow! / 2) * 100}%`,
                  animation: 'modal-kenburns 8000ms cubic-bezier(0.25,0.46,0.45,0.94) forwards',
                }}
                role="img"
                aria-label={`${product.name} — ${product.color}`}
              />
            ) : product ? (
              <img
                src={product.src}
                alt={`${product.name} — ${product.color}`}
                loading="eager"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  animation: 'modal-kenburns 8000ms cubic-bezier(0.25,0.46,0.45,0.94) forwards',
                }}
              />
            ) : null}

            {/* SOLD overlay — covers image with branded treatment */}
            {isSold && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(10,10,10,0.72)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Anton, sans-serif',
                    fontSize: 'clamp(48px, 12vw, 72px)',
                    color: '#F5F0E8',
                    letterSpacing: '0.08em',
                    opacity: 0.18,
                    textTransform: 'uppercase',
                    userSelect: 'none',
                  }}
                >
                  SOLD
                </span>
              </div>
            )}

            {/* HANDMADE badge — mirrors ProductCard */}
            <div
              style={{
                position: 'absolute',
                bottom: 14,
                left: 14,
                background: '#F2A7C3',
                color: '#0A0A0A',
                fontFamily: 'Anton, sans-serif',
                fontSize: 9,
                letterSpacing: '0.28em',
                padding: '3px 8px',
                textTransform: 'uppercase',
              }}
            >
              HANDMADE
            </div>
          </div>

          {/* DETAIL PANE */}
          <div
            className="modal-detail-pane"
            style={{
              padding: '36px 28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              overflowY: 'auto',
            }}
          >
            {product && (
              <>
                {/* ── SKU TAG ────────────────────────────────────────────── */}
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 10,
                    letterSpacing: '0.30em',
                    color: '#C8B89A',
                    textTransform: 'uppercase',
                    margin: '0 0 14px',
                  }}
                >
                  SKU / {product.id}
                </p>

                {/* ── PRODUCT NAME ───────────────────────────────────────── */}
                <h2
                  style={{
                    fontFamily: 'Anton, sans-serif',
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    color: '#F5F0E8',
                    textTransform: 'uppercase',
                    lineHeight: 0.95,
                    margin: '0 0 6px',
                    letterSpacing: '0.01em',
                  }}
                >
                  {product.name}
                </h2>

                {/* ── COLOR ROW ──────────────────────────────────────────── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '0 0 28px',
                  }}
                >
                  {/* Swatch dot */}
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      background: COLOR_SWATCHES[product.color] ?? '#888888',
                      border: '1px solid rgba(245,240,232,0.20)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 12,
                      letterSpacing: '0.18em',
                      color: '#C8B89A',
                      textTransform: 'uppercase',
                    }}
                  >
                    {product.color}
                  </span>
                </div>

                {/* ── DIVIDER ────────────────────────────────────────────── */}
                <div
                  aria-hidden="true"
                  style={{
                    height: 1,
                    background: 'linear-gradient(90deg, rgba(245,240,232,0.12) 0%, transparent 100%)',
                    margin: '0 0 28px',
                  }}
                />

                {/* ── PRODUCT DETAILS BLOCK ─────────────────────────────── */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 24px',
                    margin: '0 0 32px',
                  }}
                >
                  {[
                    { label: 'Material',   value: '100% Cotton Yarn' },
                    { label: 'Technique',  value: 'Hand Crocheted'   },
                    { label: 'Season',     value: 'SS001'             },
                    { label: 'Origin',     value: 'Lesotho'           },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.22em', color: '#5A5040', textTransform: 'uppercase', margin: '0 0 3px' }}>
                        {label}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#C8B89A', margin: 0 }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── PRICE + CTA ────────────────────────────────────────── */}
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>

                  {/* Price */}
                  <p
                    style={{
                      fontFamily: 'Anton, sans-serif',
                      fontSize: isSold ? 22 : 36,
                      color: isSold ? '#5A5040' : '#E8F542',
                      margin: '0 0 18px',
                      letterSpacing: isSold ? '0.20em' : '0.01em',
                      textTransform: 'uppercase',
                      textDecoration: isSold ? 'line-through' : 'none',
                    }}
                  >
                    {product.price}
                  </p>

                  {/* CTA buttons */}
                  {isSold ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '15px 24px',
                          background: 'rgba(245,240,232,0.04)',
                          border: '1px solid rgba(245,240,232,0.10)',
                          color: '#5A5040',
                          fontFamily: 'Anton, sans-serif',
                          fontSize: 13,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                        }}
                      >
                        <ShoppingBag size={14} />
                        SOLD OUT
                      </button>
                      <button
                        style={{
                          width: '100%',
                          padding: '14px 24px',
                          background: 'transparent',
                          border: '1px solid rgba(123,79,212,0.40)',
                          color: '#7B4FD4',
                          fontFamily: 'Anton, sans-serif',
                          fontSize: 12,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          cursor: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          transition: 'border-color 200ms ease, color 200ms ease, background 200ms ease',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget
                          el.style.borderColor = 'rgba(123,79,212,0.90)'
                          el.style.background  = 'rgba(123,79,212,0.10)'
                          el.style.color       = '#A47EFF'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget
                          el.style.borderColor = 'rgba(123,79,212,0.40)'
                          el.style.background  = 'transparent'
                          el.style.color       = '#7B4FD4'
                        }}
                      >
                        <ArrowUpRight size={14} />
                        NOTIFY ME FOR NEXT DROP
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Cap size picker */}
                      {isCap && (
                        <div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', marginBottom: 8 }}>SIZE</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                            {(['Small', 'Medium'] as const).map(s => (
                              <button
                                key={s}
                                onClick={() => setCapSize(s)}
                                style={{
                                  padding: '10px 6px',
                                  background: capSize === s ? 'rgba(232,245,66,0.10)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${capSize === s ? 'rgba(232,245,66,0.55)' : 'rgba(245,240,232,0.12)'}`,
                                  color: capSize === s ? '#E8F542' : '#C8B89A',
                                  fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.12em',
                                  textTransform: 'uppercase', cursor: 'none', transition: 'all 180ms ease',
                                }}
                              >{s}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CUSTOM COLOUR picker */}
                      {customColors.length > 0 && (
                        <div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', marginBottom: 8 }}>
                            CUSTOM COLOUR <span style={{ color: '#5A5040' }}>· +2–3 days</span>
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {customColors.map(c => (
                              <button
                                key={c}
                                title={c}
                                onClick={() => setCustomColor(prev => prev === c ? '' : c)}
                                style={{
                                  width: 26, height: 26,
                                  borderRadius: '50%',
                                  background: COLOR_SWATCHES[c] ?? '#888',
                                  border: customColor === c
                                    ? '2px solid #E8F542'
                                    : '2px solid rgba(245,240,232,0.18)',
                                  cursor: 'none',
                                  transition: 'border-color 160ms ease, transform 160ms ease',
                                  transform: customColor === c ? 'scale(1.18)' : 'scale(1)',
                                  boxShadow: customColor === c ? `0 0 0 3px rgba(232,245,66,0.20)` : 'none',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = customColor === c ? 'scale(1.18)' : 'scale(1.08)'}
                                onMouseLeave={e => e.currentTarget.style.transform = customColor === c ? 'scale(1.18)' : 'scale(1)'}
                              />
                            ))}
                          </div>
                          {customColor && (
                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#E8F542', margin: '6px 0 0', letterSpacing: '0.1em' }}>
                              Custom: {customColor}
                            </p>
                          )}
                        </div>
                      )}

                      {/* ADD TO CART */}
                      <button
                        ref={addToCartBtnRef}
                        onClick={() => {
                          if (!product || (isCap && !capSize)) return
                          const r = addToCartBtnRef.current?.getBoundingClientRect()
                          if (r) onBurst?.({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
                          onAddToCart?.(product, capSize || undefined, customColor || undefined)
                          setJustAdded(true)
                          setTimeout(() => setJustAdded(false), 1300)
                        }}
                        disabled={isCap && !capSize}
                        style={{
                          width: '100%', padding: '16px 24px',
                          background: justAdded ? '#F5FF60' : (isCap && !capSize) ? 'rgba(255,255,255,0.05)' : '#E8F542',
                          border: 'none',
                          color: (isCap && !capSize) ? '#3A3028' : '#0A0A0A',
                          fontFamily: 'Anton, sans-serif', fontSize: 13,
                          letterSpacing: '0.22em', textTransform: 'uppercase',
                          cursor: (isCap && !capSize) ? 'not-allowed' : 'none',
                          overflow: 'hidden', position: 'relative',
                          transition: 'background 200ms ease',
                          minHeight: 52,
                        }}
                        onMouseEnter={e => { if (!(isCap && !capSize) && !justAdded) e.currentTarget.style.background = '#F5FF60' }}
                        onMouseLeave={e => { if (!(isCap && !capSize) && !justAdded) e.currentTarget.style.background = '#E8F542' }}
                      >
                        {/* Normal label — slides up on add */}
                        <span style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          transform: justAdded ? 'translateY(-110%)' : 'translateY(0)',
                          opacity: justAdded ? 0 : 1,
                          transition: justAdded
                            ? 'transform 300ms cubic-bezier(0.4,0,0.6,1), opacity 180ms ease'
                            : 'transform 350ms cubic-bezier(0.34,1.56,0.64,1), opacity 200ms ease',
                        }}>
                          <ShoppingBag size={14} />
                          {isCap && !capSize ? 'SELECT A SIZE' : 'ADD TO CART'}
                        </span>
                        {/* Added label — slides in from below */}
                        <span style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transform: justAdded ? 'translateY(0)' : 'translateY(110%)',
                          opacity: justAdded ? 1 : 0,
                          transition: justAdded
                            ? 'transform 380ms cubic-bezier(0.34,1.56,0.64,1), opacity 200ms ease'
                            : 'transform 280ms cubic-bezier(0.4,0,0.6,1), opacity 160ms ease',
                        }}>
                          ✓ ADDED TO CART
                        </span>
                        {/* Invisible spacer keeps button height stable */}
                        <span style={{ visibility: 'hidden', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ShoppingBag size={14} />
                          ADD TO CART
                        </span>
                      </button>

                      {/* ORDER NOW (instant checkout) */}
                      <button
                        onClick={() => product && (!isCap || capSize) && onCheckout?.(product, capSize || undefined, customColor || undefined)}
                        disabled={isCap && !capSize}
                        style={{
                          width: '100%', padding: '13px 24px',
                          background: 'transparent',
                          border: `1px solid ${(isCap && !capSize) ? 'rgba(245,240,232,0.08)' : 'rgba(245,240,232,0.22)'}`,
                          color: (isCap && !capSize) ? '#3A3028' : '#C8B89A',
                          fontFamily: 'Anton, sans-serif', fontSize: 12,
                          letterSpacing: '0.22em', textTransform: 'uppercase',
                          cursor: (isCap && !capSize) ? 'not-allowed' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          transition: 'border-color 200ms ease, color 200ms ease',
                        }}
                        onMouseEnter={e => { if (!(isCap && !capSize)) { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.40)'; e.currentTarget.style.color = '#F5F0E8' } }}
                        onMouseLeave={e => { if (!(isCap && !capSize)) { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.22)'; e.currentTarget.style.color = '#C8B89A' } }}
                      >
                        ORDER NOW
                      </button>

                      {/* VIEW FULL LOOK */}
                      <button
                        onClick={() => product && onFullLook?.(product)}
                        style={{
                          width: '100%', padding: '13px 24px', background: 'transparent',
                          border: '1px solid rgba(245,240,232,0.12)', color: '#5A5040',
                          fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.22em',
                          textTransform: 'uppercase', cursor: 'none', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: 10,
                          transition: 'border-color 200ms ease, color 200ms ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.30)'; e.currentTarget.style.color = '#C8B89A' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'; e.currentTarget.style.color = '#5A5040' }}
                      >
                        <ArrowUpRight size={13} />
                        VIEW FULL LOOK
                      </button>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── KEYFRAME STYLES + RESPONSIVE BREAKPOINT ────────────────────────── */}
      <style>{`
        /* Overlay open state */
        [role="dialog"][data-state="open"] {
          opacity: 1 !important;
          visibility: visible !important;
          transition: opacity 320ms cubic-bezier(0.16,1,0.3,1), visibility 0ms 0ms !important;
        }

        /* Panel open state */
        [role="dialog"][data-state="open"] > div[data-state="open"] {
          transform: translateY(0) scale(1) !important;
          opacity: 1 !important;
        }

        /* Ken Burns — slow creep from 100% → 106% */
        @keyframes modal-kenburns {
          from { transform: scale(1.04); }
          to   { transform: scale(1.10); }
        }

        /* ── Desktop layout (≥ 640px) ─────────────────────────────────── */
        @media (min-width: 640px) {
          .modal-inner {
            grid-template-columns: 55% 45% !important;
            grid-template-rows: 1fr !important;
            max-height: calc(100dvh - 32px) !important;
          }
          .modal-image-pane {
            aspect-ratio: unset !important;
            height: 100% !important;
            min-height: 480px !important;
          }
          .modal-detail-pane {
            overflow-y: auto !important;
            padding: 52px 36px 36px !important;
          }
        }

        /* ── Reduced motion ───────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"], [role="dialog"] > div {
            transition: opacity 120ms linear !important;
            transform: none !important;
          }
          @keyframes modal-kenburns {
            from { transform: none; }
            to   { transform: none; }
          }
        }
      `}</style>
    </div>
  )
}
