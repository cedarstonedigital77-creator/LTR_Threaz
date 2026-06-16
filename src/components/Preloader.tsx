import { useEffect, useState } from 'react'

const LINES = [
  { label: 'PRODUCTION', value: 'LRT_THREADZ' },
  { label: 'DIRECTOR',   value: 'LERATO SEHAPI' },
  { label: 'CAMERA',     value: 'VISION' },
  { label: 'SCENE',      value: '001' },
  { label: 'TAKE',       value: '2' },
]

interface Props { onComplete: () => void }

export default function Preloader({ onComplete }: Props) {
  const [phase, setPhase] = useState<'text' | 'snap' | 'curtain' | 'done'>('text')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('snap'),    1400)
    const t2 = setTimeout(() => setPhase('curtain'), 1900)
    const t3 = setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  if (phase === 'done') return null

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        zIndex: 9999,
        background: '#0A0A0A',
        animation: phase === 'curtain' ? 'preloader-curtain 700ms cubic-bezier(0.76,0,0.24,1) forwards' : 'none',
      }}
    >
      {/* Clapper stripes top */}
      <div
        className="w-64 sm:w-80 mb-0"
        style={{
          background: 'repeating-linear-gradient(-45deg, #F5F0E8 0px, #F5F0E8 10px, #0A0A0A 10px, #0A0A0A 20px)',
          height: 48,
          borderBottom: '2px solid #F5F0E8',
        }}
      />

      {/* Snap line */}
      {phase !== 'text' && (
        <div
          className="w-64 sm:w-80"
          style={{
            height: 2,
            background: '#F5F0E8',
            transformOrigin: 'left',
            animation: 'preloader-snap 300ms ease-out forwards',
          }}
        />
      )}

      {/* Clapperboard body */}
      <div
        className="w-64 sm:w-80"
        style={{
          background: '#F5F0E8',
          padding: '16px 20px',
          border: '2px solid #F5F0E8',
          borderTop: 'none',
        }}
      >
        {LINES.map((line, i) => (
          <div
            key={line.label}
            className="flex justify-between items-baseline"
            style={{
              borderBottom: i < LINES.length - 1 ? '1px solid rgba(10,10,10,0.15)' : 'none',
              padding: '5px 0',
              opacity: 0,
              animation: `fade-in-up 400ms ease forwards`,
              animationDelay: `${i * 90}ms`,
            }}
          >
            <span style={{ fontFamily: 'Anton', fontSize: 9, letterSpacing: '0.25em', color: '#0A0A0A', opacity: 0.5 }}>
              {line.label}
            </span>
            <span style={{ fontFamily: 'Anton', fontSize: 14, color: '#0A0A0A', letterSpacing: '0.05em' }}>
              {line.value}
            </span>
          </div>
        ))}
      </div>

      {/* Coming soon row */}
      <div
        className="w-64 sm:w-80 flex justify-between"
        style={{
          background: '#F5F0E8',
          borderTop: '2px solid #0A0A0A',
          padding: '6px 20px',
          opacity: 0,
          animation: 'fade-in-up 400ms ease 500ms forwards',
        }}
      >
        <span style={{ fontFamily: 'Anton', fontSize: 10, letterSpacing: '0.2em', color: '#0A0A0A' }}>COMING SOON</span>
        <span style={{ fontFamily: 'Anton', fontSize: 10, letterSpacing: '0.2em', color: '#0A0A0A' }}>001 / 2</span>
      </div>
    </div>
  )
}
