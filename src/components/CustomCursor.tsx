import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [hasMouse, setHasMouse] = useState(false)

  useEffect(() => {
    setHasMouse(window.matchMedia('(pointer: fine)').matches)
  }, [])

  useEffect(() => {
    if (!hasMouse) return
    let mouseX = 0, mouseY = 0
    let ringX = 0, ringY = 0
    let frame: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`
      }
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.12)
      ringY = lerp(ringY, mouseY, 0.12)
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`
      }
      frame = requestAnimationFrame(animate)
    }

    const onEnterLink = () => {
      if (!ringRef.current) return
      ringRef.current.style.width  = '56px'
      ringRef.current.style.height = '56px'
      ringRef.current.style.borderColor = '#E8F542'
    }
    const onLeaveLink = () => {
      if (!ringRef.current) return
      ringRef.current.style.width  = '32px'
      ringRef.current.style.height = '32px'
      ringRef.current.style.borderColor = '#F2A7C3'
    }

    window.addEventListener('mousemove', onMove)
    frame = requestAnimationFrame(animate)
    document.querySelectorAll('a, button, [data-cursor-large]').forEach(el => {
      el.addEventListener('mouseenter', onEnterLink)
      el.addEventListener('mouseleave', onLeaveLink)
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [hasMouse])

  if (!hasMouse) return null

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ zIndex: 9998, width: 7, height: 7, background: '#E8F542', transform: 'translate(-50%, -50%)' }}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          zIndex: 9997,
          width: 32,
          height: 32,
          border: '1.5px solid #F2A7C3',
          transform: 'translate(-50%, -50%)',
          transition: 'width 200ms ease, height 200ms ease, border-color 200ms ease',
        }}
        aria-hidden="true"
      />
    </>
  )
}
