import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, X } from 'lucide-react'
import { PUDO_LOCKERS, type PudoLocker } from '../data/pudoLockers'

interface Props {
  value: string
  lockerId: string
  onChange: (locker: PudoLocker | null) => void
}

const BASE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(245,240,232,0.12)',
  color: '#F5F0E8',
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 200ms ease',
}

export default function PudoLockerPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = value
    ? PUDO_LOCKERS.find(l => l.name === value || l.address === value) ?? null
    : null

  const filtered = query.trim().length >= 1
    ? PUDO_LOCKERS.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.city.toLowerCase().includes(query.toLowerCase()) ||
        l.province.toLowerCase().includes(query.toLowerCase()) ||
        l.address.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 80)
    : PUDO_LOCKERS.slice(0, 80)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (locker: PudoLocker) => {
    onChange(locker)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    setOpen(true)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Selected state */}
      {selected ? (
        <div style={{
          ...BASE,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
          border: '1px solid rgba(232,245,66,0.40)',
          background: 'rgba(232,245,66,0.04)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#E8F542', margin: '0 0 3px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {selected.name}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#C8B89A', margin: 0, lineHeight: 1.5 }}>
              {selected.address}
            </p>
          </div>
          <button
            onClick={clear}
            aria-label="Change locker"
            style={{
              background: 'none', border: 'none', color: '#5A5040',
              cursor: 'none', padding: 0, flexShrink: 0, marginTop: 2,
              transition: 'color 160ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F2A7C3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5A5040')}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Search input */
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: '#5A5040', pointerEvents: 'none',
          }} />
          <input
            style={{ ...BASE, paddingLeft: 36, borderColor: focused ? 'rgba(232,245,66,0.5)' : 'rgba(245,240,232,0.12)' }}
            placeholder="Search by locker name or town..."
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => { setFocused(true); setOpen(true) }}
            onBlur={() => setFocused(false)}
          />
        </div>
      )}

      {/* Dropdown */}
      {open && !selected && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: '#111111',
          border: '1px solid rgba(245,240,232,0.12)',
          borderTop: 'none',
          maxHeight: 260,
          overflowY: 'auto',
          boxShadow: '0 16px 40px rgba(0,0,0,0.72)',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#5A5040', textAlign: 'center' }}>
              No lockers found for "{query}"
            </div>
          ) : (
            <>
              {filtered.map(locker => (
                <button
                  key={locker.id}
                  onMouseDown={() => select(locker)}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(245,240,232,0.05)',
                    padding: '12px 14px', cursor: 'none',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,245,66,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <MapPin size={12} color="#7B4FD4" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'Anton, sans-serif', fontSize: 12,
                      color: '#F5F0E8', margin: '0 0 2px',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {locker.name}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5A5040', margin: 0, lineHeight: 1.4 }}>
                      {locker.city}{locker.city && locker.province ? ', ' : ''}{locker.province}
                    </p>
                  </div>
                </button>
              ))}
              {filtered.length === 80 && (
                <div style={{ padding: '10px 14px', fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5A5040', textAlign: 'center', letterSpacing: '0.1em' }}>
                  TYPE TO NARROW DOWN · {PUDO_LOCKERS.length} LOCKERS TOTAL
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
