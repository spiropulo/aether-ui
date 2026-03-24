/**
 * REST API for PDF estimate upload and management.
 * POST   /api/v1/estimate/projects/:id/sync-pdf — uploads a PDF; imports into that project (Project PDF Sync agent).
 * GET    /api/v1/estimate/projects/:projectId/uploads — list PDF uploads for a project.
 * GET    /api/v1/estimate/uploads/:id/download — download a PDF by upload ID.
 * DELETE /api/v1/estimate/projects/:projectId/uploads/:id — delete a project-scoped upload.
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api'

function extractErrorMessage(data, status) {
  if (!data || typeof data !== 'object') return `Upload failed (${status})`
  const detail = data.detail ?? data.message ?? data.error
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    return typeof first === 'string' ? first : first?.msg ?? first?.message ?? JSON.stringify(first)
  }
  return data.detail ?? data.message ?? data.error ?? `Upload failed (${status})`
}

/**
 * Queue a PDF import into an existing project (async via Pub/Sub + Project PDF Sync agent).
 * POST /api/v1/estimate/projects/:projectId/sync-pdf
 */
export async function syncProjectFromPdf(projectId, file, { tenantId, uploadedBy, token } = {}) {
  const form = new FormData()
  const fileToUpload = (file instanceof File && file.type)
    ? file
    : new File([file], file.name || 'estimate.pdf', { type: 'application/pdf' })
  form.append('file', fileToUpload, fileToUpload.name)

  const params = new URLSearchParams()
  if (tenantId) params.set('tenant_id', tenantId)
  if (uploadedBy) params.set('uploaded_by', uploadedBy)
  const query = params.toString()

  const url = `${BASE}/v1/estimate/projects/${encodeURIComponent(projectId)}/sync-pdf${query ? `?${query}` : ''}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
    })
  } catch (err) {
    throw new Error(err.message || 'Network error. Please check your connection and try again.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = extractErrorMessage(data, res.status)
    throw new Error(msg)
  }
  return data
}

/**
 * Get a single PDF upload record by ID (includes runContext, agentActivityLog).
 */
export async function getPdfUpload(uploadId, tenantId, { token } = {}) {
  const url = `${BASE}/v1/estimate/uploads/${encodeURIComponent(uploadId)}?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Failed to get upload (${res.status})`)
  }
  return data
}

/**
 * List PDF uploads for a single project (import/sync), newest first.
 */
export async function getPdfUploadsForProject(projectId, tenantId, { token } = {}) {
  const url = `${BASE}/v1/estimate/projects/${encodeURIComponent(projectId)}/uploads?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Failed to list project uploads (${res.status})`)
  }
  return Array.isArray(data) ? data : (data?.items ?? data?.uploads ?? [])
}

/**
 * Download a PDF by upload record ID. Returns a Blob.
 */
export async function downloadPdf(uploadId, tenantId, { token } = {}) {
  const url = `${BASE}/v1/estimate/uploads/${encodeURIComponent(uploadId)}/download?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail ?? data.message ?? `Download failed (${res.status})`)
  }
  return res.blob()
}

/**
 * Request agentic project pricing. Triggers the Tenant-Adaptive agent to enrich
 * the project with pricing using tenant and project training data.
 * POST /api/v1/estimate/price-project
 */
const PRICING_REQUEST_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes — agent may take several minutes

export async function requestProjectPricing(projectId, tenantId, { token } = {}) {
  const params = new URLSearchParams()
  if (tenantId) params.set('tenant_id', tenantId)
  if (projectId) params.set('project_id', projectId)
  const url = `${BASE}/v1/estimate/price-project?${params.toString()}`
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PRICING_REQUEST_TIMEOUT_MS)

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. The agent may still be processing — try refreshing the project.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Pricing request failed (${res.status})`)
  }
  return data
}

/**
 * Export project as PDF. Returns a Blob.
 * GET /api/v1/estimate/projects/:projectId/export
 */
export async function exportProjectPdf(projectId, tenantId, { token } = {}) {
  const url = `${BASE}/v1/estimate/projects/${encodeURIComponent(projectId)}/export?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail ?? data.message ?? `Export failed (${res.status})`)
  }
  return res.blob()
}

/**
 * Delete a PDF upload that belongs to the given project.
 */
export async function deletePdfUploadForProject(projectId, uploadId, tenantId, { token } = {}) {
  const url = `${BASE}/v1/estimate/projects/${encodeURIComponent(projectId)}/uploads/${encodeURIComponent(uploadId)}?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'DELETE', headers })
  if (res.status === 204) return
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Failed to delete upload (${res.status})`)
  }
  return data
}
