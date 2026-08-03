// ─── Paystack checkout (client side) ──────────────────────────────────────────
// No secret key here and no amount here. The browser asks /api/paystack/initialize
// for an access code — the server has already locked the amount to that code, so
// nothing on this side can change what gets charged.

const INLINE_SRC = 'https://js.paystack.co/v2/inline.js'
export const PENDING_REF_KEY = 'lrt_pending_paystack_ref'

export interface CheckoutLine {
  id: string
  quantity: number
  size?: string
  customColor?: string
}

export interface InitPayload {
  items: CheckoutLine[]
  customer: { name: string; email: string; phone: string }
  country: 'lesotho' | 'southafrica'
  location: string
  lockerId?: string
}

export interface InitResult {
  reference: string
  accessCode: string
  authorizationUrl: string
  subtotal: number
  shipping: number
  total: number
}

export interface VerifyResult {
  paid: boolean
  status: string
  reference: string
  amount: number
  currency: string
  channel: string | null
  paidAt: string | null
  customerName: string
  items: string
}

interface PaystackPopInstance {
  resumeTransaction: (
    accessCode: string,
    handlers?: {
      onSuccess?: (t: { reference: string }) => void
      onCancel?: () => void
      onError?: (e: unknown) => void
    },
  ) => void
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance
  }
}

let scriptPromise: Promise<boolean> | null = null

/** Loads Paystack's inline script once. Resolves false if it can't load. */
function loadInlineScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.PaystackPop) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<boolean>(resolve => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${INLINE_SRC}"]`)
    const script = existing ?? document.createElement('script')
    const done = (ok: boolean) => resolve(ok && !!window.PaystackPop)

    script.addEventListener('load', () => done(true))
    script.addEventListener('error', () => done(false))

    if (!existing) {
      script.src = INLINE_SRC
      script.async = true
      document.head.appendChild(script)
    }

    // Don't hang the checkout on a blocked or slow CDN.
    setTimeout(() => done(!!window.PaystackPop), 8000)
  })

  return scriptPromise
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return body?.error || 'Could not start the payment. Please try again.'
}

const OFFLINE =
  'Could not reach our payment service. Check your connection, or pay manually below.'

/** fetch() rejects on network failure — turn that into something a shopper can act on. */
async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new Error(OFFLINE)
  }
}

/**
 * Whether the server can actually take a card right now. Any failure answers
 * "no" — a checkout that quietly falls back to M-Pesa/EFT is fine, a card
 * button that cannot charge anything is not.
 */
export async function cardPaymentAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/paystack/status')
    if (!res.ok) return false
    const body = (await res.json()) as { enabled?: boolean }
    return body.enabled === true
  } catch {
    return false
  }
}

/** Server-side transaction creation. Throws with a user-safe message. */
export async function initializePayment(payload: InitPayload): Promise<InitResult> {
  const res = await request('/api/paystack/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as InitResult
}

/** Asks the server whether a reference actually got paid. */
export async function verifyPayment(reference: string): Promise<VerifyResult> {
  const res = await request(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as VerifyResult
}

export type PayOutcome =
  | { kind: 'success'; reference: string }
  | { kind: 'cancelled' }
  | { kind: 'redirecting' }

/**
 * Opens the Paystack popup. If the inline script is unavailable — ad blocker,
 * offline CDN, strict extension — falls back to a full-page redirect so the
 * customer can still pay.
 */
export function openPaystack(init: InitResult): Promise<PayOutcome> {
  return new Promise(resolve => {
    // Survives the redirect fallback so the app can resolve it on return.
    try {
      sessionStorage.setItem(PENDING_REF_KEY, init.reference)
    } catch {
      // Private mode with storage disabled — popup path still works.
    }

    const redirect = () => {
      window.location.href = init.authorizationUrl
      resolve({ kind: 'redirecting' })
    }

    loadInlineScript().then(ok => {
      if (!ok || !window.PaystackPop) return redirect()
      try {
        const popup = new window.PaystackPop()
        popup.resumeTransaction(init.accessCode, {
          onSuccess: t => resolve({ kind: 'success', reference: t?.reference || init.reference }),
          onCancel: () => resolve({ kind: 'cancelled' }),
          onError: () => redirect(),
        })
      } catch {
        redirect()
      }
    })
  })
}

/** Reads and clears a reference left behind by the redirect fallback. */
export function takePendingReference(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('paystack_ref')
  let stored: string | null = null
  try {
    stored = sessionStorage.getItem(PENDING_REF_KEY)
    sessionStorage.removeItem(PENDING_REF_KEY)
  } catch {
    // ignore
  }
  return fromUrl || stored
}
