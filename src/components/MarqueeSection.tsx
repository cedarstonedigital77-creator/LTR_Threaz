const TEXT_1 = ['PRESENCE THAT SPEAKS LOUDER THAN WORDS', '✦', 'MADE IN LS', '✦', 'LRT_THREADZ', '✦', 'SS001', '✦']
const TEXT_2 = ['CROCHET STREETWEAR', '✦', 'BY LERATO SEHAPI', '✦', 'EST. NOW', '✦', 'PRESENCE THAT SPEAKS LOUDER THAN WORDS', '✦']

function Tape({ items, dir, bg, color, border }: {
  items: string[]
  dir: 'left' | 'right'
  bg: string
  color: string
  border?: string
}) {
  const repeated = [...items, ...items]
  return (
    <div
      className="overflow-hidden"
      style={{ background: bg, padding: '9px 0', borderTop: border }}
    >
      <div
        className={dir === 'left' ? 'marquee-left' : 'marquee-right'}
        style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}
      >
        {repeated.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 13,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color,
              padding: '0 18px',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MarqueeSection() {
  return (
    /* overflow-hidden on the outer wrapper clips the rotation bleed on mobile */
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <div
        className="marquee-pause"
        style={{ transform: 'rotate(-1.2deg)', margin: '-4px -40px' }}
      >
        <Tape items={TEXT_1} dir="left"  bg="#E8F542" color="#0A0A0A" />
        <Tape items={TEXT_2} dir="right" bg="#0A0A0A" color="#F2A7C3" border="1px solid rgba(242,167,195,0.4)" />
      </div>
    </div>
  )
}
