import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const SLIDES = [
  { src: '/images/hero-beanie-closeup.jpg', bg: '#0A0A0F', label: 'SS001 — SLOUCHY',    ghostText: 'SLOUCHY',    objectPos: 'center 72%' },
  { src: '/images/hero-model.jpg',          bg: '#F72585', label: 'SS001 — BALACLAVA',  ghostText: 'BALACLAVA',  objectPos: 'center 15%' },
  { src: '/images/lifestyle-phone.jpg',     bg: '#0096C7', label: 'SS001 — FITTED CAP', ghostText: 'FITTED CAP', objectPos: 'center top' },
  { src: '/images/lifestyle-chains.jpg',    bg: '#7B1040', label: 'SS001 — BUNNY HAT',  ghostText: 'BUNNY HAT',  objectPos: 'center top' },
  { src: '/images/lifestyle-money.jpg',     bg: '#111111', label: 'SS001 — BUNNY HAT',  ghostText: 'BUNNY HAT',  objectPos: 'center 25%' },
]

const N = SLIDES.length

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchX  = useRef(0)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (isAnimating) return
    setIsAnimating(true)
    setActiveIndex(prev => dir === 'next' ? (prev + 1) % N : (prev + N - 1) % N)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating])

  const stopAuto = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null }
  }, [])

  // Auto-advance every 4 seconds — direct setIndex, no dependency chain
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setIsAnimating(true)
      setActiveIndex(prev => (prev + 1) % N)
      setTimeout(() => setIsAnimating(false), 500)
    }, 2000)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [])

  const slide = SLIDES[activeIndex]

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', minHeight: 600, backgroundColor: '#0A0A0A', fontFamily: 'Inter, sans-serif' }}
      onMouseEnter={stopAuto}
      onMouseLeave={() => {}}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) navigate(dx < 0 ? 'next' : 'prev')
      }}
    >
      {/* ── Solid colour bg — transitions per slide, fills entire viewport ── */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundColor: slide.bg,
          transition: 'background-color 650ms cubic-bezier(0.65,0,0.35,1)',
        }}
      />

      {/* ── Top colour vignette ── */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
          background: `linear-gradient(to bottom, ${slide.bg} 0%, transparent 100%)`,
          zIndex: 2, pointerEvents: 'none',
          transition: 'background 650ms cubic-bezier(0.65,0,0.35,1)',
        }}
      />

      {/* ── Bottom dark gradient ── */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: '45%', background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, transparent 100%)', zIndex: 6 }}
      />

      {/* ── Ghost text ── */}
      <div
        className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
        style={{ top: '16%', zIndex: 3 }}
      >
        <span style={{
          fontFamily: 'Anton, sans-serif', fontSize: 'clamp(72px, 18vw, 220px)',
          fontWeight: 900, color: 'white', opacity: 0.09, lineHeight: 1,
          letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          {slide.ghostText}
        </span>
      </div>

      {/* ── Brand label ── */}
      <div className="absolute top-6 left-4 sm:left-8" style={{ zIndex: 60 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'white', opacity: 0.9, letterSpacing: '0.22em' }}>
          lrt_threadz
        </span>
      </div>

      {/* ── Slide dots ── */}
      <div className="absolute top-6 right-4 sm:right-8 flex items-center gap-2" style={{ zIndex: 60 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!isAnimating && i !== activeIndex) {
                stopAuto(); setIsAnimating(true); setActiveIndex(i)
                setTimeout(() => setIsAnimating(false), 500)
              }
            }}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === activeIndex ? 22 : 5, height: 5,
              background: i === activeIndex ? '#E8F542' : 'rgba(255,255,255,0.4)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 300ms ease, background 300ms ease',
            }}
          />
        ))}
        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', marginLeft: 8 }}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
        </span>
      </div>

      {/* ── SINGLE ACTIVE CARD — no side cards, no background photos ── */}
      <div className="absolute inset-0" style={{ zIndex: 4 }}>
        <div
          key={activeIndex}
          style={{
            position: 'absolute',
            left: '50%', top: '44%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '72vw' : 360,
            aspectRatio: '3/4',
            clipPath: 'polygon(0% 1.5%, 2.5% 0%, 97.5% 0.5%, 100% 0%, 100% 98%, 97.5% 100%, 2.5% 99%, 0% 100%)',
            overflow: 'hidden',
            animation: 'hero-card-in 500ms cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          <img
            src={slide.src}
            alt={slide.label}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: slide.objectPos, display: 'block', userSelect: 'none' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 35%, transparent 60%, rgba(0,0,0,0.28) 100%)' }} />
        </div>
      </div>

      {/* ── Bottom-left: label + nav ── */}
      <div className="absolute" style={{ bottom: 28, left: 16, zIndex: 60, maxWidth: 320 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 'clamp(12px, 3vw, 18px)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'white', opacity: 0.95, margin: '0 0 4px 0' }}>
          lrt_threadz
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'white', opacity: 0.8, lineHeight: 1.55, margin: '0 0 16px 0' }}>
          Handmade crochet streetwear from Lesotho.<br />Every stitch is intentional. Presence That Speaks Louder Than Words.
        </p>
        <div className="flex gap-3">
          {([{ dir: 'prev' as const, Icon: ArrowLeft }, { dir: 'next' as const, Icon: ArrowRight }]).map(({ dir, Icon }) => (
            <button
              key={dir}
              onClick={() => navigate(dir)}
              aria-label={dir === 'prev' ? 'Previous slide' : 'Next slide'}
              style={{ width: 48, height: 48, background: 'transparent', border: '2px solid rgba(255,255,255,0.75)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 150ms ease, background 150ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              <Icon size={22} strokeWidth={2.25} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom-right: SHOP NOW ── */}
      <a
        href="#collection"
        className="absolute flex items-center gap-2"
        style={{ bottom: 28, right: 16, zIndex: 60, fontFamily: 'Anton, sans-serif', fontSize: 'clamp(18px, 3.5vw, 48px)', color: 'white', opacity: 0.95, letterSpacing: '-0.02em', lineHeight: 1, textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity 200ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.95')}
      >
        SHOP NOW <ArrowRight style={{ width: 'clamp(16px, 2.5vw, 36px)', height: 'clamp(16px, 2.5vw, 36px)' }} strokeWidth={2.25} />
      </a>
    </div>
  )
}
