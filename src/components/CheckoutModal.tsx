import { useEffect, useRef, useState, useCallback } from 'react'
import { X, MapPin, CheckCircle2, ChevronRight, CreditCard, Loader2 } from 'lucide-react'
import { type CartItem } from './ProductModal'
import { sendOrderEmail } from '../lib/email'
import { cardPaymentAvailable, initializePayment, openPaystack, verifyPayment } from '../lib/paystack'
import PudoLockerPicker from './PudoLockerPicker'

type Country = 'lesotho' | 'southafrica'

interface Form {
  name: string
  phone: string
  email: string
  country: Country | ''
  province: string
  district: string
  address: string
  lockerId: string
}

const DISTRICTS = [
  'Maseru', 'Leribe', 'Berea', 'Mafeteng', "Mohale's Hoek",
  'Quthing', "Qacha's Nek", 'Mokhotlong', 'Butha-Buthe', 'Thaba-Tseka',
]
const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape',
]

const LESOTHO_TOWNS: Record<string, string[]> = {
  'Maseru':         ['Maseru CBD', 'Ha Thetsane', 'Qoaling', 'Mazenod', 'Roma', 'Morija', 'Lithabaneng', 'Mapeleng', 'Sekamaneng', 'Koalabata', 'Hamabote'],
  'Leribe':         ['Hlotse', 'Maputsoe', 'Peka', 'Kolojane', 'Likhoele', 'Ha Lejone'],
  'Berea':          ['Teyateyaneng', 'Mapoteng', 'Kolonyama', 'Khubetsoana', 'Bochabela', 'Semonkong'],
  'Mafeteng':       ['Mafeteng Town', 'Matsieng', 'Mpharane', 'Ha Ramabanta'],
  "Mohale's Hoek":  ["Mohale's Hoek Town", 'Mphaki', 'Tosing', 'Moyeni'],
  'Quthing':        ['Quthing Town', 'Mount Moorosi', 'Qarikoe'],
  "Qacha's Nek":    ["Qacha's Nek Town", 'Sehlabathebe'],
  'Mokhotlong':     ['Mokhotlong Town', 'Mapholaneng', 'Sani Pass Area'],
  'Butha-Buthe':    ['Butha-Buthe Town', 'Oxbow', 'Lesobeng', 'Muela'],
  'Thaba-Tseka':    ['Thaba-Tseka Town', 'Katse', 'Mohlanapeng', 'Mashai'],
}

function genRef(name: string) {
  return name.trim() || 'ORDER'
}

const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(245,240,232,0.12)',
  color: '#F5F0E8',
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  padding: '12px 14px',
  outline: 'none',
  borderRadius: 0,
  boxSizing: 'border-box',
  transition: 'border-color 200ms ease',
}

const LABEL: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 9,
  letterSpacing: '0.28em',
  color: '#C8B89A',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 6,
}

export default function CheckoutModal({
  items,
  onClose,
}: {
  items: CartItem[]
  onClose: () => void
}) {
  const [step, setStep]       = useState<1 | 2 | 3>(1)
  const [form, setForm]       = useState<Form>({ name: '', phone: '', email: '', country: '', province: '', district: '', address: '', lockerId: '' })
  const [orderRef, setOrderRef]   = useState('')
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [sending, setSending]     = useState(false)
  const [copied, setCopied]       = useState(false)
  const [, setEmailSent]          = useState(false)
  const [payState, setPayState]   = useState<'idle' | 'busy' | 'paid' | 'error'>('idle')
  const [payError, setPayError]   = useState('')
  const [paidChannel, setPaidChannel] = useState('')
  // Kept apart from orderRef: the manual EFT/M-Pesa reference already went out in
  // the order email, so a started-then-abandoned card attempt must not replace it.
  const [cardRef, setCardRef]     = useState('')
  // null = not yet known. The card button stays hidden until the server
  // confirms it can actually charge, so a missing key never shows a dead button.
  const [cardAvailable, setCardAvailable] = useState<boolean | null>(null)
  const overlayRef        = useRef<HTMLDivElement>(null)
  const panelRef          = useRef<HTMLDivElement>(null)
  const isOpen            = items.length > 0

  // Reset form on each open
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setOrderRef('')
      setEmailSent(false)
      setPayState('idle')
      setPayError('')
      setPaidChannel('')
      setCardRef('')
      setForm({ name: '', phone: '', email: '', country: '', province: '', district: '', address: '', lockerId: '' })
    }
  }, [isOpen])

  // Open/close animation
  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return
    if (isOpen) {
      overlay.dataset.state = 'open'
      panel.dataset.state   = 'open'
      const w = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow     = 'hidden'
      document.body.style.paddingRight = `${w}px`
    } else {
      overlay.dataset.state = 'closed'
      panel.dataset.state   = 'closed'
      document.body.style.overflow     = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  // Asked once per checkout, not per render. Result is cached server-side for
  // a minute, so this costs almost nothing.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    cardPaymentAvailable().then(ok => { if (!cancelled) setCardAvailable(ok) })
    return () => { cancelled = true }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }, [onClose])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const shipping  = form.country === 'lesotho' ? 50 : form.country === 'southafrica' ? 100 : 0
  const subtotal  = items.reduce((sum, i) => sum + (parseInt(i.product.price.replace('R', '')) || 0) * i.quantity, 0)
  const total     = subtotal + shipping
  const days      = form.country === 'lesotho' ? '3–6' : '7–9'
  const step1Valid = !!(
    form.name && form.phone && form.email && form.country && form.address &&
    (form.country === 'lesotho' ? form.district : form.province)
  )

  const copyAcct = () => {
    const value = form.country === 'lesotho' ? '56944303' : '63148027287'
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  // Card payment. The server fixes the amount and only the server may declare
  // an order paid — the popup's own success event is treated as a hint to go
  // and verify, never as proof.
  const payWithCard = async () => {
    if (!form.country) return
    setPayState('busy')
    setPayError('')

    try {
      const init = await initializePayment({
        items: items.map(i => ({
          id: i.product.id,
          quantity: i.quantity,
          size: i.size,
          customColor: i.customColor,
        })),
        customer: { name: form.name, email: form.email, phone: form.phone },
        country: form.country,
        location: form.country === 'lesotho'
          ? `${form.district} — ${form.address}`
          : `${form.province} · ${form.address}`,
        lockerId: form.lockerId,
      })

      setCardRef(init.reference)
      const outcome = await openPaystack(init)

      if (outcome.kind === 'redirecting') return          // page is navigating away
      if (outcome.kind === 'cancelled') { setPayState('idle'); return }

      const result = await verifyPayment(outcome.reference)
      if (!result.paid) {
        setPayState('error')
        setPayError('That payment did not go through. You can try again or pay manually below.')
        return
      }

      setPaidChannel(result.channel ?? 'card')
      setPayState('paid')
    } catch (err) {
      setPayState('error')
      setPayError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="co-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
      data-state="closed"
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: 0, visibility: 'hidden',
        transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1), visibility 0ms 320ms',
      }}
    >
      <div
        ref={panelRef}
        className="co-panel"
        data-state="closed"
        style={{
          position: 'relative',
          width: '100%', maxWidth: 520,
          maxHeight: 'calc(100dvh - 32px)',
          background: '#0A0A0A',
          border: '1px solid rgba(245,240,232,0.10)',
          boxShadow: '0 0 0 1px rgba(232,245,66,0.06), 0 32px 80px rgba(0,0,0,0.88)',
          overflow: 'hidden',
          transform: 'translateY(40px) scale(0.94)',
          transition: 'transform 380ms cubic-bezier(0.16,1,0.3,1), opacity 380ms cubic-bezier(0.16,1,0.3,1)',
          opacity: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top accent stripe */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#7B4FD4 0%,#F2A7C3 40%,#E8F542 100%)', flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          padding: '18px 20px 16px',
          borderBottom: '1px solid rgba(245,240,232,0.07)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.3em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 3px' }}>
              LRT THREADZ
            </p>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#F5F0E8', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
              {step === 1 ? 'YOUR DETAILS' : step === 2 ? 'ORDER SUMMARY' : 'COMPLETE PAYMENT'}
            </h2>
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {([1, 2, 3] as const).map(s => (
              <div key={s} style={{
                height: 6,
                width: s === step ? 22 : 6,
                background: s === step ? '#E8F542' : s < step ? '#7B4FD4' : 'rgba(245,240,232,0.14)',
                transition: 'width 280ms ease, background 280ms ease',
              }} />
            ))}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close checkout"
            style={{
              width: 34, height: 34, flexShrink: 0,
              background: 'rgba(245,240,232,0.18)',
              border: '1.5px solid rgba(245,240,232,0.55)',
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

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '22px 20px' }}>

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Multi-item product preview */}
              {items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
                  {items.map((item, i) => (
                    <div key={`${item.product.id}-${item.size ?? ''}-${i}`} style={{
                      display: 'flex', gap: 12, padding: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(245,240,232,0.07)',
                    }}>
                      <img src={item.product.src} alt={item.product.name}
                        style={{ width: 54, height: 54, objectFit: 'cover', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#F5F0E8', textTransform: 'uppercase', margin: '0 0 2px' }}>
                          {item.product.name}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#C8B89A', margin: '0 0 3px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {item.product.color}{item.size ? ` · ${item.size}` : ''}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                        </p>
                        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#E8F542', margin: 0 }}>
                          R{(parseInt(item.product.price.replace('R', '')) || 0) * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="co-name" style={LABEL}>Full Name</label>
                <input
                  id="co-name"
                  style={INPUT} placeholder="Your full name" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,245,66,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                />
              </div>

              <div>
                <label htmlFor="co-phone" style={LABEL}>Phone Number</label>
                <input
                  id="co-phone"
                  style={INPUT} placeholder="+266 or +27..." value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,245,66,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                />
              </div>

              <div>
                <label htmlFor="co-email" style={LABEL}>Email Address</label>
                <input
                  id="co-email"
                  style={INPUT} type="email" placeholder="your@email.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,245,66,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                />
              </div>

              {/* Country selector */}
              <div>
                <label style={LABEL}>Country</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['lesotho', 'southafrica'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => { set('country', c); set('province', ''); set('district', ''); set('address', '') }}
                      style={{
                        padding: '13px 12px',
                        background: form.country === c ? 'rgba(232,245,66,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${form.country === c ? 'rgba(232,245,66,0.55)' : 'rgba(245,240,232,0.10)'}`,
                        color: form.country === c ? '#E8F542' : '#C8B89A',
                        fontFamily: 'Anton, sans-serif',
                        fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                        cursor: 'none',
                        transition: 'all 180ms ease',
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5,
                        textAlign: 'left',
                      }}
                    >
                      <span>{c === 'lesotho' ? 'Lesotho' : 'South Africa'}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.12em', opacity: 0.75, color: form.country === c ? '#E8F542' : '#C8B89A' }}>
                        {c === 'lesotho' ? 'R50 · 3–6 days' : 'R100 · 7–9 days'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* District (Lesotho) */}
              {form.country === 'lesotho' && (
                <div>
                  <label style={LABEL}>District</label>
                  <select
                    style={{ ...INPUT, appearance: 'none' as React.CSSProperties['appearance'] }}
                    value={form.district}
                    onChange={e => { set('district', e.target.value); set('address', '') }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,245,66,0.5)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                  >
                    <option value="" style={{ background: '#0A0A0A' }}>Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d} style={{ background: '#111111' }}>{d}</option>)}
                  </select>
                </div>
              )}

              {/* Town / Area (Lesotho — shown when district is selected) */}
              {form.country === 'lesotho' && form.district && (() => {
                const towns = LESOTHO_TOWNS[form.district] ?? []
                return (
                  <div>
                    <label style={LABEL}>Town / Area</label>
                    <select
                      style={{ ...INPUT, appearance: 'none' as React.CSSProperties['appearance'] }}
                      value={form.address}
                      onChange={e => { set('address', e.target.value) }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,245,66,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                    >
                      <option value="" style={{ background: '#0A0A0A' }}>Select town / area</option>
                      {towns.map(t => <option key={t} value={t} style={{ background: '#111111' }}>{t}</option>)}
                    </select>
                  </div>
                )
              })()}

              {/* Province (South Africa) */}
              {form.country === 'southafrica' && (
                <div>
                  <label style={LABEL}>Province</label>
                  <select
                    style={{ ...INPUT, appearance: 'none' as React.CSSProperties['appearance'] }}
                    value={form.province}
                    onChange={e => set('province', e.target.value)}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(232,245,66,0.5)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.12)'}
                  >
                    <option value="" style={{ background: '#0A0A0A' }}>Select province</option>
                    {PROVINCES.map(p => <option key={p} value={p} style={{ background: '#111111' }}>{p}</option>)}
                  </select>
                </div>
              )}

              {/* Pudo Locker (South Africa only) */}
              {form.country === 'southafrica' && (
                <div>
                  <label style={LABEL}>Nearest Pudo Locker</label>
                  <PudoLockerPicker
                    value={form.address}
                    lockerId={form.lockerId}
                    onChange={(locker) => {
                      setForm(f => ({
                        ...f,
                        address: locker ? locker.name : '',
                        lockerId: locker ? locker.id : '',
                      }))
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Order Summary ── */}
          {step === 2 && items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Handmade notice */}
              <div style={{
                padding: '14px 16px',
                background: 'rgba(242,167,195,0.07)',
                border: '1px solid rgba(242,167,195,0.22)',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>✦</span>
                <div>
                  <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: '#F2A7C3', textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 5px' }}>
                    100% HANDMADE TO ORDER
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', margin: 0, lineHeight: 1.6 }}>
                    Every LRT piece is hand-crocheted just for you after we receive your order. Delivery takes a little longer because of this — but the quality is worth it.
                  </p>
                </div>
              </div>

              {/* Order line items */}
              <div style={{ border: '1px solid rgba(245,240,232,0.08)' }}>
                {items.map((item, i) => (
                  <div key={`${item.product.id}-${item.size ?? ''}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(245,240,232,0.06)' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A' }}>
                      {item.product.name} — {item.product.color}{item.size ? ` · ${item.size}` : ''}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                    </span>
                    <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#F5F0E8' }}>
                      R{(parseInt(item.product.price.replace('R', '')) || 0) * item.quantity}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid rgba(245,240,232,0.06)' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A' }}>
                    Shipping ({form.country === 'lesotho' ? 'Lesotho' : 'South Africa'})
                  </span>
                  <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#F5F0E8' }}>R{shipping}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(232,245,66,0.05)' }}>
                  <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#E8F542', textTransform: 'uppercase', letterSpacing: '0.12em' }}>TOTAL</span>
                  <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#E8F542' }}>R{total}</span>
                </div>
              </div>

              {/* Delivery info */}
              <div style={{
                padding: '14px 16px',
                background: 'rgba(123,79,212,0.07)',
                border: '1px solid rgba(123,79,212,0.22)',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <MapPin size={15} color="#7B4FD4" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, color: '#A47EFF', textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 5px' }}>
                    {form.country === 'lesotho' ? 'DELIVERY TO LESOTHO' : 'PUDO LOCKER DELIVERY'}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', margin: '0 0 5px', lineHeight: 1.5 }}>
                    {form.country === 'lesotho' ? `${form.district} — ${form.address}` : `${form.province} · ${form.address}`}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#7B4FD4', margin: 0, letterSpacing: '0.08em' }}>
                    Estimated: {days} business days after payment confirmed
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Confirmed header */}
              <div style={{ textAlign: 'center', padding: '6px 0 8px' }}>
                <CheckCircle2 size={38} color="#E8F542" style={{ display: 'block', margin: '0 auto 12px' }} />
                <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#F5F0E8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                  {payState === 'paid' ? 'PAYMENT RECEIVED' : 'ORDER PLACED'}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', margin: 0 }}>
                  {payState === 'paid'
                    ? `Paid by ${paidChannel} — we're on it. No further action needed.`
                    : cardAvailable === true
                      ? (form.country === 'lesotho' ? 'Pay by card below, or use M-Pesa' : 'Pay by card below, or use EFT')
                      : (form.country === 'lesotho' ? 'Complete your M-Pesa payment below to confirm' : 'Complete your EFT below to confirm')}
                </p>
              </div>

              {/* Order reference chip */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(232,245,66,0.06)',
                border: '1px solid rgba(232,245,66,0.22)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 3px' }}>
                    Your Reference
                  </p>
                  <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#E8F542', margin: 0, letterSpacing: '0.06em' }}>
                    {payState === 'paid' ? cardRef : orderRef}
                  </p>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.18em', color: '#C8B89A', textTransform: 'uppercase', margin: 0, textAlign: 'right' }}>
                  {payState === 'paid'
                    ? <>QUOTE THIS IF<br />YOU CONTACT US</>
                    : <>USE THIS AS<br />PAYMENT REF</>}
                </p>
              </div>

              {/* ── Card payment (Paystack) — only when the server can charge ── */}
              {payState !== 'paid' && cardAvailable === true && (
                <div>
                  <button
                    onClick={payWithCard}
                    disabled={payState === 'busy'}
                    style={{
                      width: '100%', padding: '16px',
                      background: payState === 'busy' ? 'rgba(232,245,66,0.35)' : '#E8F542',
                      border: 'none', color: '#0A0A0A',
                      fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase',
                      cursor: payState === 'busy' ? 'wait' : 'none',
                      transition: 'background 200ms ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxSizing: 'border-box',
                    }}
                  >
                    {payState === 'busy' ? (
                      <>
                        <Loader2 size={16} className="lrt-spin" /> OPENING SECURE CHECKOUT
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} /> PAY R{total} BY CARD
                      </>
                    )}
                  </button>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5A5040', textAlign: 'center', margin: '8px 0 0', letterSpacing: '0.06em' }}>
                    Secured by Paystack · instant confirmation, no proof of payment needed
                  </p>

                  {payState === 'error' && (
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#F2A7C3',
                      margin: '10px 0 0', padding: '10px 12px', lineHeight: 1.5,
                      background: 'rgba(242,167,195,0.07)', border: '1px solid rgba(242,167,195,0.25)',
                    }}>
                      {payError}
                    </p>
                  )}

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(245,240,232,0.10)' }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.28em', color: '#5A5040', textTransform: 'uppercase' }}>
                      or pay manually
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(245,240,232,0.10)' }} />
                  </div>
                </div>
              )}

              {payState !== 'paid' && (<>
              {/* Payment details table */}
              <div style={{ border: '1px solid rgba(245,240,232,0.10)' }}>
                <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(245,240,232,0.07)' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', margin: 0 }}>
                    {form.country === 'lesotho' ? 'M-Pesa Payment Details' : 'Bank Transfer Details'}
                  </p>
                </div>
                {(form.country === 'lesotho'
                  ? [
                      { label: 'Method',         value: 'M-Pesa' },
                      { label: 'M-Pesa Number',  value: '56944303', highlight: true },
                      { label: 'Account Name',   value: 'Malisebo Sehapi' },
                      { label: 'Amount',         value: `R${total}`, highlight: true },
                    ]
                  : [
                      { label: 'Bank',           value: 'FNB' },
                      { label: 'Account Holder', value: 'Lerato Sehapi' },
                      { label: 'Account Number', value: '63148027287', highlight: true },
                      { label: 'Branch Code',    value: '250655' },
                      { label: 'Amount',         value: `R${total}`, highlight: true },
                      { label: 'Reference',      value: orderRef, highlight: true },
                    ]
                ).map(({ label, value, highlight }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(245,240,232,0.05)',
                  }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5A5040', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                      {label}
                    </span>
                    <span style={{
                      fontFamily: highlight ? 'Anton, sans-serif' : 'Inter, sans-serif',
                      fontSize: highlight ? 15 : 13,
                      color: highlight ? '#F5F0E8' : '#C8B89A',
                      letterSpacing: highlight ? '0.04em' : '0',
                    }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Copy account number */}
              <button
                onClick={copyAcct}
                style={{
                  width: '100%', padding: '13px',
                  background: copied ? 'rgba(232,245,66,0.10)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${copied ? 'rgba(232,245,66,0.50)' : 'rgba(245,240,232,0.12)'}`,
                  color: copied ? '#E8F542' : '#C8B89A',
                  fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                  cursor: 'none', transition: 'all 200ms ease',
                }}
              >
                {copied ? '✓ COPIED TO CLIPBOARD' : form.country === 'lesotho' ? 'COPY M-PESA NUMBER' : 'COPY ACCOUNT NUMBER'}
              </button>

              {/* Proof of payment instructions */}
              <div style={{
                padding: '14px 16px',
                background: 'rgba(242,167,195,0.06)',
                border: '1px solid rgba(242,167,195,0.18)',
              }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', margin: 0, lineHeight: 1.7 }}>
                  {form.country === 'lesotho' ? (
                    <>
                      <span style={{ color: '#F2A7C3', fontWeight: 600 }}>After sending M-Pesa</span>, screenshot your payment confirmation and send it to us with your name on Instagram{' '}
                      <a href="https://instagram.com/lrt_threadz" target="_blank" rel="noopener noreferrer" style={{ color: '#F5F0E8', fontWeight: 600, textDecoration: 'none' }}>@lrt_threadz</a>{' '}
                      or WhatsApp <span style={{ color: '#E8F542', fontFamily: 'Anton, sans-serif', fontSize: 13 }}>078 150 6401</span>.
                      We'll confirm within 24 hours and start your piece.
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#F2A7C3', fontWeight: 600 }}>After paying</span>, send your proof of payment + reference{' '}
                      <span style={{ color: '#E8F542', fontFamily: 'Anton, sans-serif', fontSize: 13 }}>{orderRef}</span>{' '}
                      to us on Instagram{' '}
                      <a href="https://instagram.com/lrt_threadz" target="_blank" rel="noopener noreferrer" style={{ color: '#F5F0E8', fontWeight: 600, textDecoration: 'none' }}>@lrt_threadz</a>{' '}
                      or email{' '}
                      <a href="mailto:lrtthreadz@gmail.com" style={{ color: '#E8F542', textDecoration: 'none', fontWeight: 600 }}>lrtthreadz@gmail.com</a>.
                      We'll confirm within 24 hours and start making your piece.
                    </>
                  )}
                </p>
              </div>
              </>)}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(245,240,232,0.07)', flexShrink: 0 }}>
          {step === 1 && (
            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              style={{
                width: '100%', padding: '14px',
                background: step1Valid ? '#E8F542' : 'rgba(255,255,255,0.05)',
                border: 'none',
                color: step1Valid ? '#0A0A0A' : '#3A3028',
                fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
                cursor: step1Valid ? 'none' : 'not-allowed',
                transition: 'background 200ms ease, color 200ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              CONTINUE TO SUMMARY <ChevronRight size={15} />
            </button>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: '0 0 90px', padding: '14px',
                  background: 'transparent',
                  border: '1px solid rgba(245,240,232,0.14)',
                  color: '#C8B89A',
                  fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                  cursor: 'none', transition: 'border-color 200ms ease, color 200ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.30)'; e.currentTarget.style.color = '#F5F0E8' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.14)'; e.currentTarget.style.color = '#C8B89A' }}
              >
                BACK
              </button>
              <button
                onClick={async () => {
                  const ref = genRef(form.name)
                  setOrderRef(ref)
                  setSending(true)

                  const itemLines = items.map(i =>
                    `${i.product.name} (${i.customColor ?? i.product.color}${i.size ? ', ' + i.size : ''}${i.quantity > 1 ? ' x' + i.quantity : ''}) — R${(parseInt(i.product.price.replace('R','')) || 0) * i.quantity}`
                  ).join(' | ')
                  const location = form.country === 'lesotho'
                    ? `${form.district} — ${form.address}`
                    : `${form.province} · ${form.address}`
                  const paymentMethod = form.country === 'lesotho'
                    ? 'M-Pesa — 56944303 (Malisebo Sehapi)'
                    : 'EFT — FNB 63148027287 (Lerato Sehapi)'

                  // Send order to owner automatically via FormSubmit — customer cannot edit
                  try {
                    await fetch('https://formsubmit.co/ajax/lrtthreadz@gmail.com', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                      body: JSON.stringify({
                        _subject: `New Order — ${form.name}`,
                        _template: 'table',
                        _captcha: 'false',
                        'Order Ref': ref,
                        'Customer Name': form.name,
                        'Phone': form.phone,
                        'Email': form.email,
                        'Country': form.country === 'lesotho' ? 'Lesotho' : 'South Africa',
                        'Items': itemLines,
                        'Subtotal': `R${subtotal}`,
                        'Shipping': `R${shipping}`,
                        'Total': `R${total}`,
                        'Delivery': location,
                        'Est. Delivery': `${days} business days`,
                        'Payment': paymentMethod,
                      }),
                    })
                    setEmailSent(true)
                  } catch {
                    // silent — still advance to step 3
                  }

                  // Build WhatsApp proof-of-payment link
                  const waMsg = `Hi! I just placed an order on lrt_threadz.\nName: ${form.name}\nOrder: ${items.map(i => i.product.name).join(', ')}\nTotal: R${total}\n\nHere is my proof of payment:`
                  setWhatsappUrl(`https://wa.me/27781506401?text=${encodeURIComponent(waMsg)}`)

                  // EmailJS backup
                  sendOrderEmail({
                    orderRef: ref,
                    customerName: form.name,
                    customerEmail: form.email,
                    customerPhone: form.phone,
                    productName: itemLines,
                    productColor: items[0]?.product.color ?? '',
                    productPrice: `R${subtotal}`,
                    size: items.map(i => i.size ?? 'N/A').join(', '),
                    shippingFee: shipping,
                    total,
                    country: form.country === 'lesotho' ? 'Lesotho' : 'South Africa',
                    location,
                    deliveryDays: days,
                  }).catch(() => {})

                  setSending(false)
                  setStep(3)
                }}
                style={{
                  flex: 1, padding: '14px',
                  background: '#E8F542', border: 'none',
                  color: '#0A0A0A',
                  fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
                  cursor: 'none', transition: 'background 200ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5FF60'}
                onMouseLeave={e => e.currentTarget.style.background = '#E8F542'}
              >
                {sending ? 'SENDING...' : 'CONFIRM ORDER'} {!sending && <ChevronRight size={15} />}
              </button>
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Card payers are already confirmed — no screenshot to send. */}
              {payState !== 'paid' && (<>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%', padding: '15px',
                  background: '#25D366', border: 'none',
                  color: '#fff',
                  fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
                  cursor: 'none', transition: 'background 200ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  textDecoration: 'none', boxSizing: 'border-box',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1ebe5a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#25D366')}
              >
                📎 SEND PROOF OF PAYMENT
              </a>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5A5040', textAlign: 'center', margin: 0, letterSpacing: '0.06em' }}>
                Opens WhatsApp · attach your payment screenshot
              </p>
              </>)}
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '13px',
                  background: 'transparent',
                  border: '1px solid rgba(245,240,232,0.14)',
                  color: '#C8B89A',
                  fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                  cursor: 'none', transition: 'border-color 200ms ease, color 200ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.30)'; e.currentTarget.style.color = '#F5F0E8' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.14)'; e.currentTarget.style.color = '#C8B89A' }}
              >
                CLOSE
              </button>
            </div>
          )}
        </div>

        <style>{`
          .co-overlay[data-state="open"] {
            opacity: 1 !important;
            visibility: visible !important;
            transition: opacity 320ms cubic-bezier(0.16,1,0.3,1), visibility 0ms 0ms !important;
          }
          .co-overlay[data-state="open"] > .co-panel[data-state="open"] {
            transform: translateY(0) scale(1) !important;
            opacity: 1 !important;
          }
          @keyframes lrt-spin { to { transform: rotate(360deg); } }
          .lrt-spin { animation: lrt-spin 900ms linear infinite; }
          @media (prefers-reduced-motion: reduce) {
            .lrt-spin { animation-duration: 2400ms; }
          }
        `}</style>
      </div>
    </div>
  )
}
