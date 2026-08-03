import crypto from 'node:crypto'
import { getSecretKey } from '../_lib/paystack.js'

// Paystack POSTs here when a charge settles. This is the reliable confirmation
// path: it fires even if the customer closes the tab the instant they pay.
//
// Set the URL in Paystack Dashboard → Settings → API Keys & Webhooks:
//   https://<your-domain>/api/paystack/webhook
//
// This uses the Web-standard handler signature rather than (req, res) so that
// `request.text()` gives the body back byte-for-byte. The signature is an HMAC
// of the exact bytes Paystack sent — re-serialising a parsed object would change
// key order or spacing and the check would never pass.

const OWNER_EMAIL = 'lrtthreadz@gmail.com'

function signatureMatches(raw: string, header: string): boolean {
  let secret: string
  try {
    secret = getSecretKey()
  } catch {
    // No key configured, so no signature can be trusted. Reject rather than
    // letting the throw surface as a 500 — Paystack retries on 5xx, and an
    // unconfigured endpoint would collect an ever-growing retry backlog.
    console.warn('[paystack] webhook received but PAYSTACK_SECRET_KEY is unset')
    return false
  }
  const expected = crypto.createHmac('sha512', secret).update(raw, 'utf8').digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(header, 'utf8')
  // Length check first — timingSafeEqual throws on mismatched lengths.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

interface ChargeEvent {
  event: string
  data: {
    reference: string
    amount: number
    currency: string
    channel?: string
    paid_at?: string
    customer?: { email?: string }
    metadata?: Record<string, unknown>
  }
}

async function notifyOwner(d: ChargeEvent['data']): Promise<void> {
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

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } })
  }

  const raw = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  if (!signature || !signatureMatches(raw, signature)) {
    // Anyone can hit this URL — this check is what makes the endpoint trustworthy.
    console.warn('[paystack] webhook rejected: bad signature')
    return new Response(null, { status: 401 })
  }

  try {
    const event = JSON.parse(raw) as ChargeEvent
    if (event.event === 'charge.success') {
      await notifyOwner(event.data)
    }
  } catch (err) {
    // Still 200 — the signature was valid, so Paystack has done its part and
    // retrying would only replay a payload we already failed to handle.
    console.error('[paystack] webhook post-processing failed:', err)
  }

  return Response.json({ received: true })
}
