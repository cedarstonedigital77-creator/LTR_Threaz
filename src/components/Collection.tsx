import { useRef, useEffect, useState, useCallback } from 'react'
import { Pin, ShoppingBag } from 'lucide-react'
import ProductModal, { type Product, type CartItem } from './ProductModal'
import CheckoutModal from './CheckoutModal'
import ComingSoon from './ComingSoon'
import FullLookModal from './FullLookModal'
import CartDrawer from './CartDrawer'
import AddToCartBurst from './AddToCartBurst'
import CartToast, { type ToastItem } from './CartToast'

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const BUNNY_HATS = [
  { src: '/images/product-bunny-black.jpg',  name: 'Bunny Hat', color: 'Black',  price: 'R220', id: 'BB01' },
  { src: '/images/product-bunny-pink.jpg',   name: 'Bunny Hat', color: 'Blush', price: 'R220', id: 'BB02' },
  { src: '/images/product-bunny-white.jpg',  name: 'Bunny Hat', color: 'White', price: 'R220', id: 'BB03' },
  { src: '/images/product-bunny-purple.jpg', name: 'Bunny Hat', color: 'Grape', price: 'R220', id: 'BB04' },
]

const SLOUCHYS = [
  { src: '/images/product-slouchy-white.jpg', name: 'Slouchy Hat', color: 'Pearl',    price: 'R180', id: 'SH01' },
  { src: '/images/product-slouchy-black.jpg', name: 'Slouchy Hat', color: 'Black',    price: 'R180', id: 'SH02' },
  { src: '/images/product-slouchy-grey.jpg',  name: 'Slouchy Hat', color: 'Cement',   price: 'R180', id: 'SH03' },
  { src: '/images/product-slouchy-pink.jpg',  name: 'Slouchy Hat', color: 'Hot Pink', price: 'R180', id: 'SH04' },
]

const PRODUCTS = [...BUNNY_HATS, ...SLOUCHYS]

const BALACLAVAS = [
  { src: '/images/balaclava-brown.jpg',  name: 'Bear Balaclava', color: 'Chocolate', price: 'R250', id: 'BAL01' },
  { src: '/images/balaclava-white.jpg',  name: 'Bear Balaclava', color: 'White',     price: 'R250', id: 'BAL02' },
  { src: '/images/balaclava-purple.jpg', name: 'Bear Balaclava', color: 'Grape',     price: 'R250', id: 'BAL03' },
  { src: '/images/balaclava-black.jpg',  name: 'Bear Balaclava', color: 'Black',     price: 'R250', id: 'BAL04' },
]

const CAPS = [
  { src: '/images/cap-blue.jpg',       name: 'Bunny Fitted Cap', color: 'Baby Blue',  price: 'R450', id: 'BC01' },
  { src: '/images/cap-pink.jpg',       name: 'Bunny Fitted Cap', color: 'Baby Pink',  price: 'R450', id: 'BC02' },
  { src: '/images/cap-black.jpg',      name: 'Bunny Fitted Cap', color: 'Black',      price: 'R450', id: 'BC03' },
  { src: '/images/cap-green.jpg',      name: 'Bunny Fitted Cap', color: 'Lime',       price: 'R450', id: 'BC04' },
  { src: '/images/cap-red.jpg',        name: 'Bunny Fitted Cap', color: 'Cherry Red', price: 'R450', id: 'BC05' },
  { src: '/images/cap-chocolate.jpg',  name: 'Bunny Fitted Cap', color: 'Chocolate',  price: 'R450', id: 'BC06' },
]

function ProductCard({ product, onClick }: { product: typeof PRODUCTS[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative overflow-hidden group"
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name} — ${product.color}`}
      style={{ cursor: 'none', height: '100%', display: 'block' }}
      data-cursor-large="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <img
        src={product.src}
        alt={`${product.name} — ${product.color}`}
        loading="lazy"
        decoding="async"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 600ms cubic-bezier(0.25,0.46,0.45,0.94)',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
        }}
      />

      {/* HANDMADE badge */}
      <div
        className="absolute top-3 left-3"
        style={{
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

      {/* Pin icon hover */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          color: '#F2A7C3',
          transform: hovered ? 'scale(1) rotate(45deg)' : 'scale(0) rotate(0deg)',
          transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <Pin size={18} />
      </div>

      {/* Mobile static info — always visible on touch */}
      <div
        className="sm:hidden"
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(10,10,10,0.93) 0%, transparent 100%)',
          padding: '28px 12px 10px',
          pointerEvents: 'none',
        }}
      >
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: '#F5F0E8', textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>
          {product.name}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#C8B89A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{product.color}</span>
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#E8F542' }}>{product.price}</span>
        </div>
      </div>

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,10,0.88) 0%, transparent 50%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 350ms ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#F5F0E8', textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>
          {product.name}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '4px 0 10px' }}>
          {product.color}
        </p>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#E8F542' }}>{product.price}</span>
          <div
            style={{
              background: '#E8F542',
              color: '#0A0A0A',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <ShoppingBag size={13} />
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.15em' }}>ADD</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Collection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const isMobile = useIsMobile()
  const [activeProduct, setActiveProduct]   = useState<Product | null>(null)
  const [checkoutItems, setCheckoutItems]   = useState<CartItem[]>([])
  const [fullLookProduct, setFullLookProduct] = useState<Product | null>(null)
  const [cart, setCart]           = useState<CartItem[]>([])
  const [cartOpen, setCartOpen]   = useState(false)
  const [burstTrigger, setBurstTrigger] = useState<{ x: number; y: number } | null>(null)
  const [toast, setToast]         = useState<ToastItem & { ts: number } | null>(null)
  const toastIdRef                = useRef(0)

  const openModal     = useCallback((p: Product) => setActiveProduct(p), [])
  const closeModal    = useCallback(() => setActiveProduct(null), [])
  const openFullLook  = useCallback((p: Product) => { setActiveProduct(null); setFullLookProduct(p) }, [])
  const closeFullLook = useCallback(() => setFullLookProduct(null), [])

  const openCheckout  = useCallback((items: CartItem[]) => {
    setActiveProduct(null)
    setFullLookProduct(null)
    setCheckoutItems(items)
  }, [])
  const closeCheckout = useCallback(() => setCheckoutItems([]), [])

  const handleAddToCart = useCallback((product: Product, size?: string, customColor?: string) => {
    setCart(prev => {
      const key = (i: CartItem) => `${i.product.id}-${i.size ?? ''}-${i.customColor ?? ''}`
      const newKey = `${product.id}-${size ?? ''}-${customColor ?? ''}`
      const existing = prev.find(i => key(i) === newKey)
      if (existing) {
        return prev.map(i => key(i) === newKey ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1, size, customColor }]
    })
    setCartOpen(true)
    // Fire toast
    const id = ++toastIdRef.current
    setToast({ id, name: product.name, color: product.color, customColor, ts: Date.now() })
    setTimeout(() => setToast(t => (t?.id === id ? null : t)), 3000)
  }, [])

  const handleUpdateQty = useCallback((productId: string, size: string | undefined, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product.id === productId && i.size === size
        ? { ...i, quantity: Math.max(1, i.quantity + delta) }
        : i
      )
    )
  }, [])

  const handleRemove = useCallback((productId: string, size: string | undefined) => {
    setCart(prev => prev.filter(i => !(i.product.id === productId && i.size === size)))
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="collection" ref={sectionRef} style={{ background: '#0A0A0A', padding: '80px 16px 80px', overflow: 'hidden' }}>

      {/* Section header */}
      <div
        className="mb-10 sm:mb-14"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(48px)',
          transition: 'opacity 700ms var(--ease-out-expo), transform 700ms var(--ease-out-expo)',
        }}
      >
        <div className="flex items-end gap-4 sm:gap-6 flex-wrap">
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', color: '#F5F0E8', lineHeight: 0.9, textTransform: 'uppercase' }}>
            THE DROP
          </span>
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', color: '#E8F542', lineHeight: 0.9, textTransform: 'uppercase', transform: 'translateY(8px)' }}>
            SS001
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.25em', color: '#C8B89A', textTransform: 'uppercase', marginTop: 12 }}>
          4 PIECES. ALL HANDMADE. ALL RARE.
        </p>
      </div>

      {/* ── BUNNY HATS ── */}
      <div style={{ marginTop: 'clamp(32px, 4vw, 48px)' }}>
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 16px', opacity: 0.7 }}>
          BUNNY HATS — R220 EACH
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 4 : 6 }}>
          {BUNNY_HATS.map(p => (
            <div key={p.id} style={{ height: isMobile ? 180 : 300, minHeight: 0 }}>
              <ProductCard product={p} onClick={() => openModal(p)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── SLOUCHY HATS ── */}
      <div style={{ marginTop: 'clamp(32px, 4vw, 48px)' }}>
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 16px', opacity: 0.7 }}>
          SLOUCHY HATS — R180 EACH
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 4 : 6 }}>
          {SLOUCHYS.map(p => (
            <div key={p.id} style={{ height: isMobile ? 180 : 300, minHeight: 0 }}>
              <ProductCard product={p} onClick={() => openModal(p)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── BEAR BALACLAVAS ── */}
      <div style={{ marginTop: 'clamp(32px, 4vw, 48px)' }}>
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 16px', opacity: 0.7 }}>
          BEAR BALACLAVAS — R250 EACH
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 4 : 6,
          }}
        >
          {BALACLAVAS.map(p => (
            <div key={p.id} style={{ height: isMobile ? 200 : 320, minHeight: 0 }}>
              <ProductCard product={p} onClick={() => openModal(p)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── BUNNY FITTED CAPS ── */}
      <div style={{ marginTop: 'clamp(32px, 4vw, 48px)' }}>
        <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase', margin: '0 0 16px', opacity: 0.7 }}>
          BUNNY FITTED CAPS — R450 EACH
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 4 : 6,
          }}
        >
          {CAPS.map(p => (
            <div key={p.id} style={{ height: isMobile ? 180 : 280, minHeight: 0 }}>
              <ProductCard product={p} onClick={() => openModal(p)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── MORE COMING SOON ── */}
      <ComingSoon />

      {/* Modals */}
      <ProductModal
        product={activeProduct}
        onClose={closeModal}
        onCheckout={(p, size, customColor) => openCheckout([{ product: p, quantity: 1, size, customColor }])}
        onFullLook={openFullLook}
        onAddToCart={handleAddToCart}
        onBurst={pos => {
          setBurstTrigger(pos)
          setTimeout(() => setBurstTrigger(null), 950)
        }}
      />
      <CheckoutModal items={checkoutItems} onClose={closeCheckout} />
      <FullLookModal product={fullLookProduct} onClose={closeFullLook} onCheckout={openCheckout} />
      <CartDrawer
        items={cart}
        open={cartOpen}
        onClose={() => setCartOpen(prev => !prev)}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemove}
        onCheckout={() => openCheckout(cart)}
      />
      <AddToCartBurst trigger={burstTrigger} />
      <CartToast toast={toast} />
    </section>
  )
}
