import type { VercelRequest, VercelResponse } from '@vercel/node'
import { paystackFetch, type VerifyResponse } from '../_lib/paystack.js'

// The only endpoint allowed to declare an order paid. The browser's own
// "success" callback proves nothing — it can be faked from devtools — so the
// result always comes from asking Paystack directly.

const REF_RE = /^LRT-[A-Z0-9]+-[A-Z0-9]+$/

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const raw = req.query.reference
  const reference = Array.isArray(raw) ? raw[0] : raw

  if (!reference || !REF_RE.test(reference)) {
    return res.status(400).json({ error: 'Invalid payment reference.' })
  }

  try {
    const data = await paystackFetch<VerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    )

    const paid = data.status === 'success'
    const meta = (data.metadata ?? {}) as Record<string, unknown>

    return res.status(200).json({
      paid,
      status: data.status,
      reference: data.reference,
      // Cents back to rands for display
      amount: data.amount / 100,
      currency: data.currency,
      channel: data.channel,
      paidAt: data.paid_at,
      customerName: typeof meta.customer_name === 'string' ? meta.customer_name : '',
      items: typeof meta.items === 'string' ? meta.items : '',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed.'
    console.error('[paystack] verify failed:', message)
    return res.status(502).json({ error: 'Could not confirm payment. Please contact us.' })
  }
}
