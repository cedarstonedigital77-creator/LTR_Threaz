import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'

interface ToastItem {
  id: number
  name: string
  color: string
  customColor?: string
}

interface Props {
  toast: ToastItem | null
}

export type { ToastItem }

export default function CartToast({ toast }: Props) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<ToastItem | null>(null)

  useEffect(() => {
    if (!toast) return
    setCurrent(toast)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2400)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 96,
        right: 24,
        zIndex: 8300,
        maxWidth: 260,
        background: '#111111',
        border: '1px solid rgba(232,245,66,0.30)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        background: '#E8F542',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ShoppingBag size={13} color="#0A0A0A" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: '#E8F542', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 2px' }}>
          Added to cart
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#C8B89A', margin: 0, letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.name} — {current?.customColor ?? current?.color}
        </p>
      </div>
    </div>
  )
}
