import { useEffect, useRef } from 'react'

// ─── Brand tokens ────────────────────────────────────────────────────────────
const LEMON = '#E8F542'
const BLUSH = '#F2A7C3'
const GRAPE = '#7B4FD4'

// ─── Particle shape catalogue ────────────────────────────────────────────────
type Shape = 'circle' | 'square' | 'star'

interface ParticleDef {
  id: number
  shape: Shape
  color: string
  angle: number      // radians
  distance: number   // px
  size: number       // px
  rotation: number   // deg, end rotation
  delay: number      // ms
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

function buildParticles(count: number): ParticleDef[] {
  const colors = [LEMON, BLUSH, GRAPE]
  const shapes: Shape[] = ['circle', 'square', 'star']

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: (i / count) * Math.PI * 2 + randomBetween(-0.25, 0.25),
    distance: randomBetween(80, 160),
    size: randomBetween(8, 16),
    rotation: randomBetween(120, 540) * (Math.random() < 0.5 ? 1 : -1),
    delay: randomBetween(0, 60),
  }))
}

// ─── SVG star path (5-point, fits inside a ~1 unit box centred at 0,0) ──────
const STAR_PATH =
  'M0,-1 L0.224,-0.309 L0.951,-0.309 L0.363,0.118 L0.588,0.809 L0,0.382 L-0.588,0.809 L-0.363,0.118 L-0.951,-0.309 L-0.224,-0.309 Z'

// ─── Keyframe injection (runs once) ─────────────────────────────────────────
let keyframesInjected = false
function ensureKeyframes() {
  if (keyframesInjected) return
  keyframesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    @keyframes lrt-check-pop {
      0%   { transform: scale(0);    opacity: 1; }
      60%  { transform: scale(1.3);  opacity: 1; }
      100% { transform: scale(1);    opacity: 1; }
    }
  `
  document.head.appendChild(style)
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AddToCartBurst({
  trigger,
}: {
  trigger: { x: number; y: number } | null
}) {
  // Stable particle set — rebuilt each time trigger fires
  const particlesRef = useRef<ParticleDef[]>([])

  // The actual rendered node is managed imperatively so we avoid stale closure
  // issues with multiple rapid clicks.
  const mountRef = useRef<HTMLDivElement | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    ensureKeyframes()
  }, [])

  useEffect(() => {
    if (!trigger) return

    // Clear any in-flight animation
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (mountRef.current) {
      mountRef.current.remove()
      mountRef.current = null
    }

    const PARTICLE_COUNT = Math.floor(randomBetween(12, 17)) // 12-16
    const particles = buildParticles(PARTICLE_COUNT)
    particlesRef.current = particles

    // ── Build DOM imperatively so we can drive phases without React re-renders ──
    const root = document.createElement('div')
    root.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 0; height: 0;
      z-index: 99999;
      pointer-events: none;
      overflow: visible;
    `
    document.body.appendChild(root)
    mountRef.current = root

    // Origin anchor
    const anchor = document.createElement('div')
    anchor.style.cssText = `
      position: absolute;
      top: ${trigger.y}px;
      left: ${trigger.x}px;
      width: 0; height: 0;
      overflow: visible;
    `
    root.appendChild(anchor)

    // ── Particle nodes ──
    const particleNodes: HTMLElement[] = []

    particles.forEach((def) => {
      const half = def.size / 2

      let el: HTMLElement

      if (def.shape === 'circle' || def.shape === 'square') {
        el = document.createElement('div')
        el.style.cssText = `
          position: absolute;
          top: ${-half}px;
          left: ${-half}px;
          width: ${def.size}px;
          height: ${def.size}px;
          background: ${def.color};
          border-radius: ${def.shape === 'circle' ? '50%' : '2px'};
          will-change: transform, opacity;
          transform: translate(0,0) rotate(0deg) scale(1);
          opacity: 1;
          pointer-events: none;
        `
      } else {
        // star via SVG
        const ns = 'http://www.w3.org/2000/svg'
        const svg = document.createElementNS(ns, 'svg')
        svg.setAttribute('viewBox', '-1 -1 2 2')
        svg.style.cssText = `
          position: absolute;
          top: ${-half}px;
          left: ${-half}px;
          width: ${def.size}px;
          height: ${def.size}px;
          will-change: transform, opacity;
          transform: translate(0,0) rotate(0deg) scale(1);
          opacity: 1;
          pointer-events: none;
        `
        const path = document.createElementNS(ns, 'path')
        path.setAttribute('d', STAR_PATH)
        path.setAttribute('fill', def.color)
        svg.appendChild(path)
        el = svg as unknown as HTMLElement
      }

      anchor.appendChild(el)
      particleNodes.push(el)
    })

    // ── Checkmark node ──
    const ns = 'http://www.w3.org/2000/svg'
    const checkWrap = document.createElement('div')
    checkWrap.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      opacity: 0;
      pointer-events: none;
    `
    // Circle backdrop
    const checkBg = document.createElement('div')
    checkBg.style.cssText = `
      position: absolute;
      top: -44px; left: -44px;
      width: 88px; height: 88px;
      border-radius: 50%;
      background: rgba(10,10,10,0.92);
      border: 3px solid #E8F542;
      box-shadow: 0 0 28px rgba(232,245,66,0.55), 0 0 0 6px rgba(232,245,66,0.12);
    `
    const checkSvg = document.createElementNS(ns, 'svg')
    checkSvg.setAttribute('viewBox', '0 0 24 24')
    checkSvg.style.cssText = `
      position: absolute;
      top: -34px; left: -34px;
      width: 68px; height: 68px;
      pointer-events: none;
    `
    const poly = document.createElementNS(ns, 'polyline')
    poly.setAttribute('points', '4,13 9,18 20,7')
    poly.setAttribute('fill', 'none')
    poly.setAttribute('stroke', LEMON)
    poly.setAttribute('stroke-width', '3.5')
    poly.setAttribute('stroke-linecap', 'round')
    poly.setAttribute('stroke-linejoin', 'round')
    checkSvg.appendChild(poly)
    checkWrap.appendChild(checkBg)
    checkWrap.appendChild(checkSvg)
    anchor.appendChild(checkWrap)

    // ── PHASE 1 (t=0ms): Fire particles ──
    // Give browser one frame to paint initial state before transitioning
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        particles.forEach((def, i) => {
          const el = particleNodes[i]
          const dx = Math.cos(def.angle) * def.distance
          const dy = Math.sin(def.angle) * def.distance
          el.style.transition = `
            transform 700ms cubic-bezier(0.2,0,0.8,1) ${def.delay}ms,
            opacity   700ms ease-in               ${def.delay}ms
          `
          el.style.transform = `translate(${dx}px,${dy}px) rotate(${def.rotation}deg) scale(0)`
          el.style.opacity = '0'
        })
      })
    })

    // ── PHASE 2 (t=200ms): Pop checkmark ──
    const t1 = setTimeout(() => {
      checkWrap.style.opacity = '1'
      checkSvg.style.animation = 'lrt-check-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards'
    }, 200)

    // ── PHASE 3 (t=700ms): Fade checkmark ──
    const t2 = setTimeout(() => {
      checkWrap.style.transition = 'opacity 150ms ease-out'
      checkWrap.style.opacity = '0'
    }, 700)

    // ── PHASE 4 (t=900ms): Destroy ──
    const t3 = setTimeout(() => {
      if (mountRef.current === root) {
        root.remove()
        mountRef.current = null
      }
    }, 900)

    timersRef.current = [t1, t2, t3]

    return () => {
      timersRef.current.forEach(clearTimeout)
      if (mountRef.current === root) {
        root.remove()
        mountRef.current = null
      }
    }
  }, [trigger])

  // Nothing to render into the React tree — everything is imperative DOM
  return null
}
