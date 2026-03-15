import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPdfUploads, downloadPdf, deletePdfUpload } from '../api/estimate'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_LABELS = {
  PENDING: { label: 'Queued', color: 'bg-gray-100 text-gray-700' },
  PROCESSING: { label: 'Processing', color: 'bg-amber-100 text-amber-800' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
}

export default function PdfUploads() {
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null

  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUploads = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPdfUploads(tenantId, { token })
      setUploads(data)
    } catch (err) {
      setError(err.message)
      setUploads([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, token])

  useEffect(() => {
    fetchUploads()
    const interval = setInterval(fetchUploads, 10000)
    return () => clearInterval(interval)
  }, [fetchUploads])

  const handleDownload = async (upload) => {
    if (!tenantId) return
    setDownloadingId(upload.id)
    try {
      const blob = await downloadPdf(upload.id, tenantId, { token })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = upload.fileName || 'estimate.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !tenantId) return
    setDeleting(true)
    setError(null)
    try {
      await deletePdfUpload(deleteTarget.id, tenantId, { token })
      setUploads((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (!tenantId) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Alert message="You must be logged in to view PDF uploads." />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">PDF Uploads</h1>
        <p className="text-sm text-gray-500 mt-1">
          All PDFs you have uploaded for estimate processing. Download any file or open the linked project.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : uploads.length === 0 ? (
        <EmptyState
          title="No PDF uploads yet"
          description="Upload a PDF from the Estimate from PDF page to create projects automatically."
          action={
            <Link
              to="/app/estimate"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Upload a PDF
            </Link>
          }
          icon={
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Uploaded</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Size</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {uploads.map((upload) => {
                  const statusInfo = STATUS_LABELS[upload.status] ?? { label: upload.status ?? 'Unknown', color: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={upload.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-[200px]" title={upload.fileName}>
                              {upload.fileName || 'Unknown file'}
                            </div>
                            {upload.projectId && (
                              <Link
                                to={`/app/projects/${upload.projectId}`}
                                className="text-xs text-indigo-600 hover:text-indigo-700 mt-0.5 inline-block"
                              >
                                View project →
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusInfo.color}`}>
                            {upload.status === 'PROCESSING' && (
                              <Spinner size="sm" className="mr-1" />
                            )}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">
                          {formatDate(upload.uploadedAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                          {upload.fileSizeBytes != null ? formatBytes(upload.fileSizeBytes) : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleDownload(upload)}
                              disabled={downloadingId === upload.id}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                            >
                              {downloadingId === upload.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                              Download
                            </button>
                            <button
                              onClick={() => setDeleteTarget(upload)}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                              title="Delete upload"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete PDF upload"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.fileName || 'this upload'}"? This will remove the upload record. The associated project (if any) will not be deleted. This action cannot be undone.`
            : ''
        }
      />
    </div>
  )
}
