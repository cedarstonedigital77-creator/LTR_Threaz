import type { VercelRequest, VercelResponse } from '@vercel/node'
import { priceOrder, CURRENCY, type Country } from '../_lib/catalog.js'
import { paystackFetch, generateReference, type InitializeResponse } from '../_lib/paystack.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:5173'
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const customer = (body.customer ?? {}) as Record<string, unknown>

    const country = body.country as Country
    if (country !== 'lesotho' && country !== 'southafrica') {
      return res.status(400).json({ error: 'Please select a delivery country.' })
    }

    const email = str(customer.email, 120).toLowerCase()
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' })
    }

    const name = str(customer.name, 80)
    const phone = str(customer.phone, 30)
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' })
    }

    // Amounts are recomputed from the catalog — the client's figures are ignored.
    const order = priceOrder(body.items, country)
    const reference = generateReference()

    const location = str(body.location, 200)
    const itemSummary = order.lines
      .map(l => `${l.name}${l.customColor ? ` (${l.customColor})` : ''}${l.size ? ` ${l.size}` : ''} x${l.quantity}`)
      .join(' | ')

    const data = await paystackFetch<InitializeResponse>('/transaction/initialize', {
      method: 'POST',
      body: {
        email,
        amount: order.amountInCents,
        currency: CURRENCY,
        reference,
        callback_url: `${siteUrl()}/?paystack_ref=${reference}`,
        metadata: {
          order_ref: reference,
          customer_name: name,
          customer_phone: phone,
          country: country === 'lesotho' ? 'Lesotho' : 'South Africa',
          location,
          locker_id: str(body.lockerId, 40),
          items: itemSummary,
          subtotal: order.subtotal,
          shipping: order.shipping,
          total: order.total,
          // Shown on the Paystack dashboard transaction view
          custom_fields: [
            { display_name: 'Customer', variable_name: 'customer_name', value: name },
            { display_name: 'Phone', variable_name: 'customer_phone', value: phone },
            { display_name: 'Items', variable_name: 'items', value: itemSummary },
            { display_name: 'Deliver To', variable_name: 'location', value: location },
          ],
        },
      },
    })

    return res.status(200).json({
      reference: data.reference,
      accessCode: data.access_code,
      authorizationUrl: data.authorization_url,
      // Echoed back so the UI can show the authoritative total, not its own guess
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start payment.'
    // Configuration problems are ours, not the customer's — don't leak them.
    if (message.includes('PAYSTACK_SECRET_KEY')) {
      console.error('[paystack] missing secret key')
      return res.status(500).json({ error: 'Card payment is not configured yet.' })
    }
    console.error('[paystack] initialize failed:', message)
    return res.status(400).json({ error: message })
  }
}
