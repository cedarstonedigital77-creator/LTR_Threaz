import type { VercelRequest, VercelResponse } from '@vercel/node'

// Tells the storefront whether card payment is actually usable, so the
// "Pay by card" button never appears on a site that cannot take a card.
// The moment a live key is added in Vercel this flips to true on its own —
// no redeploy, no code change.
//
// Deliberately exposes a boolean and nothing else: no key, no prefix, no length.

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const key = process.env.PAYSTACK_SECRET_KEY ?? ''
  const live = key.startsWith('sk_live_')
  const test = key.startsWith('sk_test_')

  // A test key cannot move real money. Showing a working-looking card flow that
  // settles nothing is worse than showing no card option at all, so test keys
  // only enable the button on preview deployments.
  const isProduction = process.env.VERCEL_ENV === 'production'
  const enabled = live || (test && !isProduction)

  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60')
  return res.status(200).json({ enabled })
}
