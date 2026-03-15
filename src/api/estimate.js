/**
 * REST API for PDF estimate upload and management.
 * POST   /api/v1/estimate/process — uploads a PDF; backend creates project + tasks asynchronously.
 * GET    /api/v1/estimate/uploads — list all PDF uploads for a tenant.
 * GET    /api/v1/estimate/uploads/:id/download — download a PDF by upload ID.
 * DELETE /api/v1/estimate/uploads/:id — delete a PDF upload record.
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

export async function uploadEstimatePdf(file, { tenantId, uploadedBy, token } = {}) {
  const form = new FormData()
  // Ensure File has explicit type so multipart part gets Content-Type (fixes "Missing content type" error)
  const fileToUpload = (file instanceof File && file.type)
    ? file
    : new File([file], file.name || 'estimate.pdf', { type: 'application/pdf' })
  form.append('file', fileToUpload, fileToUpload.name)

  const params = new URLSearchParams()
  if (tenantId) params.set('tenant_id', tenantId)
  if (uploadedBy) params.set('uploaded_by', uploadedBy)
  const query = params.toString()

  const url = `${BASE}/v1/estimate/process${query ? `?${query}` : ''}`
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
  // 202 Accepted: PDF uploaded, queued for async processing (PdfUploadAcknowledgment)
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
 * List all PDF uploads for the current tenant.
 */
export async function getPdfUploads(tenantId, { token } = {}) {
  const url = `${BASE}/v1/estimate/uploads?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Failed to list uploads (${res.status})`)
  }
  // Backend may return array or { items: [...] }
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
 * Delete a PDF upload record by ID.
 * DELETE /api/v1/estimate/uploads/:id
 */
export async function deletePdfUpload(uploadId, tenantId, { token } = {}) {
  const url = `${BASE}/v1/estimate/uploads/${encodeURIComponent(uploadId)}?tenant_id=${encodeURIComponent(tenantId)}`
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'DELETE', headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail ?? data.message ?? `Failed to delete upload (${res.status})`)
  }
  return data
}
