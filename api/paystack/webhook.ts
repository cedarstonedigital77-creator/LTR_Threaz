import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'
import { getSecretKey } from '../_lib/paystack.js'

// Paystack POSTs here when a charge settles. This is the reliable confirmation
// path: it fires even if the customer closes the tab the instant they pay.
//
// Set the URL in Paystack Dashboard → Settings → API Keys & Webhooks:
//   https://lrtthreadz.com/api/paystack/webhook
//
// The signature is an HMAC of the exact bytes Paystack sent, so the body must
// be read raw — re-serialising a parsed object would change key order or
// spacing and the check would never pass. Hence bodyParser off.
//
// Note: this runtime does NOT support the Web-standard (Request) => Response
// handler signature; `request.text` is undefined there. Keep the (req, res)
// form.
export const config = { api: { bodyParser: false } }

const OWNER_EMAIL = 'lrtthreadz@gmail.com'

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function signatureMatches(raw: Buffer, header: string): boolean {
  let secret: string
  try {
    secret = getSecretKey()
  } catch {
    // No key configured, so no signature can be trusted. Reject cleanly rather
    // than throwing a 500 — Paystack retries on 5xx, and an unconfigured
    // endpoint would accumulate an ever-growing retry backlog.
    console.warn('[paystack] webhook received but PAYSTACK_SECRET_KEY is unset')
    return false
  }
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(header, 'utf8')
  // Length check first — timingSafeEqual throws on mismatched lengths.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

interface ChargeData {
  reference: string
  amount: number
  currency: string
  channel?: string
  paid_at?: string
  customer?: { email?: string }
  metadata?: Record<string, unknown>
}

async function notifyOwner(d: ChargeData): Promise<void> {
  const meta = (d.metadata ?? {}) as Record<string, unknown>
  const text = (k: string) => (typeof meta[k] === 'string' ? (meta[k] as string) : '—')

  await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `PAID ✅ ${text('customer_name')} — ${d.reference}`,
      _template: 'table',
      _captcha: 'false',
      'Order Ref': d.reference,
      Status: 'PAID via Paystack',
      'Customer Name': text('customer_name'),
      Email: d.customer?.email ?? '—',
      Phone: text('customer_phone'),
      Country: text('country'),
      Items: text('items'),
      Subtotal: `R${meta.subtotal ?? '—'}`,
      Shipping: `R${meta.shipping ?? '—'}`,
      'Amount Paid': `${d.currency} ${(d.amount / 100).toFixed(2)}`,
      Delivery: text('location'),
      'Locker ID': text('locker_id'),
      Channel: d.channel ?? '—',
      'Paid At': d.paid_at ?? '—',
    }),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  let raw: Buffer
  try {
    raw = await readRawBody(req)
  } catch {
    return res.status(400).json({ error: 'Could not read request body.' })
  }

  const header = req.headers['x-paystack-signature']
  const signature = Array.isArray(header) ? header[0] : header

  if (!signature || !signatureMatches(raw, signature)) {
    // Anyone can hit this URL — this check is what makes the endpoint trustworthy.
    console.warn('[paystack] webhook rejected: bad or missing signature')
    return res.status(401).json({ error: 'Invalid signature.' })
  }

  // Acknowledge before the slow part; Paystack retries anything slow or non-2xx.
  res.status(200).json({ received: true })

  try {
    const event = JSON.parse(raw.toString('utf8')) as { event: string; data: ChargeData }
    if (event.event === 'charge.success') {
      await notifyOwner(event.data)
    }
  } catch (err) {
    console.error('[paystack] webhook post-processing failed:', err)
  }
}
