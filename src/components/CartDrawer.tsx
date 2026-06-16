import { useEffect, useRef } from 'react'
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'
import { type CartItem } from './ProductModal'

interface Props {
  items: CartItem[]
  open: boolean
  onClose: () => void
  onUpdateQty: (productId: string, size: string | undefined, delta: number) => void
  onRemove: (productId: string, size: string | undefined) => void
  onCheckout: () => void
}

export default function CartDrawer({ items, open, onClose, onUpdateQty, onRemove, onCheckout }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  const subtotal = items.reduce((sum, i) => sum + (parseInt(i.product.price.replace('R', '')) || 0) * i.quantity, 0)
  const count    = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={onClose}
        aria-label="Open cart"
        style={{
          position: 'fixed', bottom: 28, right: 24, zIndex: 8000,
          width: 54, height: 54,
          background: count > 0 ? '#E8F542' : 'rgba(10,10,10,0.92)',
          border: count > 0 ? 'none' : '1px solid rgba(245,240,232,0.18)',
          color: count > 0 ? '#0A0A0A' : '#F5F0E8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'none', transition: 'background 220ms ease, transform 180ms ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <ShoppingBag size={20} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: '#7B4FD4', color: '#fff',
            fontFamily: 'Anton, sans-serif', fontSize: 10,
            width: 20, height: 20, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            letterSpacing: '0.04em',
          }}>
            {count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 8100,
            background: 'rgba(10,10,10,0.72)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Drawer */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 8200,
          width: '100%', maxWidth: 420,
          background: '#0A0A0A',
          borderLeft: '1px solid rgba(245,240,232,0.10)',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 360ms cubic-bezier(0.16,1,0.3,1)',
          boxShadow: open ? '-24px 0 80px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {/* Top accent */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#7B4FD4 0%,#F2A7C3 40%,#E8F542 100%)', flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          padding: '18px 20px 16px',
          borderBottom: '1px solid rgba(245,240,232,0.07)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.3em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 3px' }}>
              LRT THREADZ
            </p>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#F5F0E8', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
              YOUR CART
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34,
              background: 'rgba(245,240,232,0.18)', border: '1.5px solid rgba(245,240,232,0.55)',
              color: '#FFFFFF', cursor: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 180ms ease, color 180ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E8F542'; e.currentTarget.style.color = '#0A0A0A' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.18)'; e.currentTarget.style.color = '#FFFFFF' }}
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <ShoppingBag size={36} color="rgba(245,240,232,0.12)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#3A3028', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                Your cart is empty
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item, i) => (
                <div key={`${item.product.id}-${item.size ?? ''}-${i}`} style={{
                  display: 'flex', gap: 12, padding: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(245,240,232,0.07)',
                }}>
                  <img src={item.product.src} alt={item.product.name}
                    style={{ width: 64, height: 64, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#F5F0E8', textTransform: 'uppercase', margin: '0 0 2px' }}>
                      {item.product.name}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#C8B89A', margin: '0 0 2px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {item.customColor ?? item.product.color}{item.size ? ` · ${item.size}` : ''}{item.customColor ? <span style={{ color: '#F2A7C3', marginLeft: 4 }}>· CUSTOM</span> : null}
                    </p>
                    <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#E8F542', margin: '0 0 8px' }}>
                      {item.product.price}
                    </p>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.size, -1)}
                        style={{
                          width: 26, height: 26,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,240,232,0.12)',
                          color: '#C8B89A', cursor: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'border-color 150ms ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.30)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                      ><Minus size={11} /></button>
                      <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#F5F0E8', minWidth: 18, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.size, 1)}
                        style={{
                          width: 26, height: 26,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,240,232,0.12)',
                          color: '#C8B89A', cursor: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'border-color 150ms ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.30)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                      ><Plus size={11} /></button>
                      <button
                        onClick={() => onRemove(item.product.id, item.size)}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none',
                          color: '#5A5040', cursor: 'none',
                          transition: 'color 150ms ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#F2A7C3'}
                        onMouseLeave={e => e.currentTarget.style.color = '#5A5040'}
                      ><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(245,240,232,0.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A' }}>Subtotal ({count} item{count !== 1 ? 's' : ''})</span>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#E8F542' }}>R{subtotal}</span>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5A5040', margin: '0 0 12px', letterSpacing: '0.08em' }}>
              Shipping calculated at checkout
            </p>
            <button
              onClick={() => { onClose(); onCheckout() }}
              style={{
                width: '100%', padding: '15px',
                background: '#E8F542', border: 'none', color: '#0A0A0A',
                fontFamily: 'Anton, sans-serif', fontSize: 12,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                cursor: 'none', transition: 'background 200ms ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5FF60'}
              onMouseLeave={e => e.currentTarget.style.background = '#E8F542'}
            >
              CHECKOUT
            </button>
          </div>
        )}
      </div>
    </>
  )
}
