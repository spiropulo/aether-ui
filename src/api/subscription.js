/**
 * REST API for AI pricing subscription.
 * GET  /api/v1/subscription/status
 * POST /api/v1/subscription/subscribe
 * POST /api/v1/subscription/cancel
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

export async function subscribeToPlan(tenantId, plan, { token } = {}) {
  const url = `${BASE}/v1/subscription/subscribe?tenant_id=${encodeURIComponent(tenantId)}&plan=${encodeURIComponent(plan)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? data.error ?? `Subscribe failed (${res.status})`)
  }
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
