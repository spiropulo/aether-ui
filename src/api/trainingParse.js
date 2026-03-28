/**
 * POST /api/v1/training/parse-pricing — natural language → structured pricing facts (via aether-app → aether-ai).
 */

import { restApiBase } from './backendPublicPaths'

const BASE = restApiBase()

export async function parseTrainingPricing({ text, projectTypeHint, unitHint, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}/v1/training/parse-pricing`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text: text ?? '',
      projectTypeHint: projectTypeHint || undefined,
      unitHint: unitHint || undefined,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail ?? data.message ?? `Parse failed (${res.status})`
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return data
}
