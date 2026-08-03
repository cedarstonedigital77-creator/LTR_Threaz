// ─── Server-side source of truth for pricing ─────────────────────────────────
// The browser sends product IDs and quantities only. Every amount charged is
// recomputed here. Never trust a price that arrived over the wire — a tampered
// request could otherwise buy a R450 cap for R1.
//
// Keep in sync with src/components/Collection.tsx and BunnyCapsSection.tsx.

export const CURRENCY = 'ZAR'

export interface CatalogEntry {
  name: string
  price: number // rands
}

export const CATALOG: Record<string, CatalogEntry> = {
  // Bunny Hats — R220
  BB01: { name: 'Bunny Hat', price: 220 },
  BB02: { name: 'Bunny Hat', price: 220 },
  BB03: { name: 'Bunny Hat', price: 220 },
  BB04: { name: 'Bunny Hat', price: 220 },

  // Slouchy Hats — R180
  SH01: { name: 'Slouchy Hat', price: 180 },
  SH02: { name: 'Slouchy Hat', price: 180 },
  SH03: { name: 'Slouchy Hat', price: 180 },
  SH04: { name: 'Slouchy Hat', price: 180 },

  // Bear Balaclavas — R250
  BAL01: { name: 'Bear Balaclava', price: 250 },
  BAL02: { name: 'Bear Balaclava', price: 250 },
  BAL03: { name: 'Bear Balaclava', price: 250 },
  BAL04: { name: 'Bear Balaclava', price: 250 },

  // Bunny Fitted Caps — R450
  BC01: { name: 'Bunny Fitted Cap', price: 450 },
  BC02: { name: 'Bunny Fitted Cap', price: 450 },
  BC03: { name: 'Bunny Fitted Cap', price: 450 },
  BC04: { name: 'Bunny Fitted Cap', price: 450 },
  BC05: { name: 'Bunny Fitted Cap', price: 450 },
  BC06: { name: 'Bunny Fitted Cap', price: 450 },
  BC07: { name: 'Bunny Fitted Cap', price: 450 },
  BC08: { name: 'Bunny Fitted Cap', price: 450 },
  BC09: { name: 'Bunny Fitted Cap', price: 450 },

  // Spider Season — R400. Names carry the colour because order emails list the
  // catalog name only, and "Brooklyn" alone would not tell you which to make.
  SP01: { name: 'Brooklyn Spider Cap (Black)', price: 400 },
  SP02: { name: 'Queens Spider Cap (Red)', price: 400 },
  SP03: { name: 'Ghost Spider Cap (Pink)', price: 400 },
  SP04: { name: 'Harlem Spider Beanie (Red/Black)', price: 150 },
  SP05: { name: 'Halo Spider Beanie (Pink)', price: 150 },
  SP06: { name: 'Bronx Spider Beanie (Black/Red)', price: 150 },
}

export const SHIPPING: Record<Country, number> = {
  lesotho: 50,
  southafrica: 100,
}

export type Country = 'lesotho' | 'southafrica'

export const MAX_QUANTITY_PER_LINE = 20
export const MAX_LINES = 30

export interface IncomingLine {
  id: string
  quantity: number
  size?: string
  customColor?: string
}

export interface PricedLine {
  id: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  size?: string
  customColor?: string
}

export interface PricedOrder {
  lines: PricedLine[]
  subtotal: number
  shipping: number
  total: number
  amountInCents: number
}

/**
 * Recompute an order from IDs + quantities alone.
 * Throws on anything unrecognised rather than silently charging the wrong amount.
 */
export function priceOrder(items: unknown, country: Country): PricedOrder {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty.')
  }
  if (items.length > MAX_LINES) {
    throw new Error('Too many items in cart.')
  }

  const lines: PricedLine[] = items.map((raw, i) => {
    const item = raw as IncomingLine
    const id = typeof item?.id === 'string' ? item.id.trim() : ''
    const entry = CATALOG[id]
    if (!entry) {
      throw new Error(`Unknown product at position ${i + 1}.`)
    }

    const quantity = Number(item?.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new Error(`Invalid quantity for ${entry.name}.`)
    }

    return {
      id,
      name: entry.name,
      quantity,
      unitPrice: entry.price,
      lineTotal: entry.price * quantity,
      size: typeof item?.size === 'string' ? item.size.slice(0, 40) : undefined,
      customColor: typeof item?.customColor === 'string' ? item.customColor.slice(0, 40) : undefined,
    }
  })

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const shipping = SHIPPING[country]
  if (shipping === undefined) {
    throw new Error('Invalid delivery country.')
  }
  const total = subtotal + shipping

  return { lines, subtotal, shipping, total, amountInCents: total * 100 }
}
