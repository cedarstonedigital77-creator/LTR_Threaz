// ─── Paystack API client ──────────────────────────────────────────────────────
// PAYSTACK_SECRET_KEY is a server-only environment variable. It must never be
// given a VITE_ prefix — anything VITE_-prefixed is inlined into the browser
// bundle and readable by anyone who opens devtools.

const PAYSTACK_BASE = 'https://api.paystack.co'

export function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not set.')
  }
  return key
}

/** True when running against Paystack test keys (sk_test_...). */
export function isTestMode(): boolean {
  return getSecretKey().startsWith('sk_test_')
}

export async function paystackFetch<T>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' },
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })

  const json = (await res.json().catch(() => null)) as
    | { status: boolean; message?: string; data?: T }
    | null

  if (!res.ok || !json?.status) {
    throw new Error(json?.message || `Paystack request failed (${res.status}).`)
  }
  return json.data as T
}

/** LRT-XXXXXX-XXXX — unique per attempt, safe to show the customer. */
export function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LRT-${stamp}-${rand}`
}

export interface InitializeResponse {
  authorization_url: string
  access_code: string
  reference: string
}

export interface VerifyResponse {
  status: string // 'success' | 'failed' | 'abandoned' | ...
  reference: string
  amount: number // cents
  currency: string
  paid_at: string | null
  channel: string | null
  customer: { email: string }
  metadata: Record<string, unknown> | null
}
