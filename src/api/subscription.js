/**
 * REST API for AI pricing subscription.
 * GET   /api/v1/subscription/status
 * POST  /api/v1/subscription/checkout-session (upgrade from Free → paid)
 * POST  /api/v1/subscription/confirm (after Stripe redirect)
 * PATCH /api/v1/subscription/billing-reminder
 * POST  /api/v1/subscription/subscribe (direct, when Stripe not used)
 * POST  /api/v1/subscription/cancel
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function getSubscriptionStatus(tenantId, { token } = {}) {
  const url = `${BASE}/v1/subscription/status?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Failed to get subscription (${res.status})`)
  }
  return data
}

/** Create Stripe Checkout Session for upgrade. Returns { url, sessionId }. Redirect user to url. */
export async function createCheckoutSession(tenantId, plan, successUrl, cancelUrl, { token } = {}) {
  const params = new URLSearchParams({
    tenant_id: tenantId,
    plan,
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  const url = `${BASE}/v1/subscription/checkout-session?${params}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? data.error ?? `Checkout failed (${res.status})`)
  }
  if (data.error) throw new Error(data.error)
  return data
}

/** Confirm upgrade after returning from Stripe Checkout. */
export async function confirmCheckout(tenantId, sessionId, { token } = {}) {
  const params = new URLSearchParams({ tenant_id: tenantId, session_id: sessionId })
  const url = `${BASE}/v1/subscription/confirm?${params}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Confirm failed (${res.status})`)
  }
  return data
}

/** Create billing portal session to add/update payment method. Returns { url }. */
export async function createBillingPortalSession(tenantId, returnUrl, { token } = {}) {
  const params = new URLSearchParams({ tenant_id: tenantId, return_url: returnUrl })
  const url = `${BASE}/v1/subscription/billing-portal?${params}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? data.error ?? `Failed (${res.status})`)
  }
  if (data.error) throw new Error(data.error)
  return data
}

/** Toggle billing reminder email. optOut: true = no reminders, false = reminders on (default). */
export async function setBillingReminder(tenantId, optOut, { token } = {}) {
  const params = new URLSearchParams({ tenant_id: tenantId, opt_out: String(optOut) })
  const url = `${BASE}/v1/subscription/billing-reminder?${params}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'PATCH', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Update failed (${res.status})`)
  }
  return data
}

export async function subscribeToPlan(tenantId, plan, { token } = {}) {
  const url = `${BASE}/v1/subscription/subscribe?tenant_id=${encodeURIComponent(tenantId)}&plan=${encodeURIComponent(plan)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? data.error ?? `Subscribe failed (${res.status})`)
  }
  if (data.error) throw new Error(data.error)
  return data
}

export async function cancelSubscription(tenantId, { token } = {}) {
  const url = `${BASE}/v1/subscription/cancel?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Cancel failed (${res.status})`)
  }
  return data
}

export async function resumeSubscription(tenantId, { token } = {}) {
  const url = `${BASE}/v1/subscription/resume?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? data.error ?? `Resume failed (${res.status})`)
  }
  if (data.error) throw new Error(data.error)
  return data
}
