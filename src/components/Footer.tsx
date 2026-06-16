import { Mail, ArrowUpRight, Phone } from 'lucide-react'

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export default function Footer() {
  return (
    <footer style={{ background: '#0A0A0A', borderTop: '1px solid rgba(200,184,154,0.12)' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '64px 24px 32px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 48,
            marginBottom: 64,
          }}
        >
          {/* Brand block */}
          <div>
            <p
              style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: 28,
                color: '#F5F0E8',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                margin: '0 0 12px',
              }}
            >
              lrt_threadz
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#C8B89A', lineHeight: 1.6, marginBottom: 20 }}>
              © {new Date().getFullYear()} Lerato Sehapi.<br />
              All pieces handmade in Lesotho.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a
                href="https://instagram.com/lrt_threadz"
                aria-label="Instagram"
                style={{ color: '#C8B89A', transition: 'color 200ms ease', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F2A7C3')}
                onMouseLeave={e => (e.currentTarget.style.color = '#C8B89A')}
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href="mailto:lrtthreadz@gmail.com"
                aria-label="Email"
                style={{ color: '#C8B89A', transition: 'color 200ms ease', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F2A7C3')}
                onMouseLeave={e => (e.currentTarget.style.color = '#C8B89A')}
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 10, letterSpacing: '0.3em', color: '#C8B89A', textTransform: 'uppercase', marginBottom: 16 }}>
              NAVIGATE
            </p>
            {[
              { label: 'Shop',     href: '#collection' },
              { label: 'About',   href: '#about' },
              { label: 'The Drop', href: '#collection' },
              { label: 'Contact', href: 'mailto:lrtthreadz@gmail.com' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  display: 'block',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  color: '#F5F0E8',
                  textDecoration: 'none',
                  marginBottom: 10,
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E8F542')}
                onMouseLeave={e => (e.currentTarget.style.color = '#F5F0E8')}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 10, letterSpacing: '0.3em', color: '#C8B89A', textTransform: 'uppercase', marginBottom: 16 }}>
              CONTACT
            </p>
            <a
              href="https://instagram.com/lrt_threadz"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'Inter, sans-serif', fontSize: 14,
                color: '#F5F0E8', textDecoration: 'none', marginBottom: 10,
                transition: 'color 200ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F2A7C3')}
              onMouseLeave={e => (e.currentTarget.style.color = '#F5F0E8')}
            >
              <InstagramIcon size={14} /> @lrt_threadz <ArrowUpRight size={13} />
            </a>
            <a
              href="mailto:lrtthreadz@gmail.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#E8F542',
                textDecoration: 'none',
                marginBottom: 10,
                transition: 'color 200ms ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5FF60')}
              onMouseLeave={e => (e.currentTarget.style.color = '#E8F542')}
            >
              <Mail size={13} />
              lrtthreadz@gmail.com
            </a>
            <a
              href="tel:0781506401"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontFamily: 'Anton, sans-serif', fontSize: 15,
                color: '#F5F0E8', textDecoration: 'none',
                letterSpacing: '0.06em', marginBottom: 6,
                transition: 'color 200ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8F542')}
              onMouseLeave={e => (e.currentTarget.style.color = '#F5F0E8')}
            >
              <Phone size={14} /> 078 150 6401
            </a>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#C8B89A', margin: 0 }}>
              Made in Lesotho
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(200,184,154,0.12)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.28em', color: '#C8B89A', textTransform: 'uppercase' }}>
            PRESENCE THAT SPEAKS LOUDER THAN WORDS
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.12em', color: '#C8B89A', textTransform: 'uppercase', opacity: 0.6 }}>
            MADE BY CEDARSTONE DIGITAL
          </span>
        </div>
      </div>
    </footer>
  )
}
