import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadEstimatePdf } from '../api/estimate'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const MAX_SIZE_MB = 20
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function EstimateFromPdf() {
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null

  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const validateFile = useCallback((f) => {
    if (!f) return null
    if (f.type !== 'application/pdf') return 'Only PDF files are accepted.'
    if (f.size === 0) return 'The file is empty.'
    if (f.size > MAX_SIZE_BYTES) return `File exceeds the ${MAX_SIZE_MB} MB limit (${formatBytes(f.size)}).`
    return null
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    setError(validateFile(f))
    setResult(null)
    setFile(f || null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    setError(validateFile(f))
    setResult(null)
    setFile(f || null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || error) return
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      const data = await uploadEstimatePdf(file, {
        tenantId: tenantId ?? undefined,
        uploadedBy: user?.id ?? user?.username ?? undefined,
        token: token || undefined,
      })
      setResult(data)
      setFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estimate from PDF</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload a PDF estimate. The system will create a project and tasks automatically.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6">
              <Alert message={error} onDismiss={() => setError(null)} />
              <p className="text-xs text-gray-500 mt-2">
                Check your connection or contact your administrator if this persists.
              </p>
            </div>
          )}
          {result && (
            <div className="mb-6 p-6 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600 animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900 text-lg">Your PDF is being processed</p>
                  <p className="text-sm text-amber-800 mt-1">
                    The system is working on your file. AI analysis and project creation can take <strong>up to 10 minutes</strong>.
                    Please do not close this page or upload again — your estimate will appear in Projects when ready.
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-white/60 border border-amber-100">
                    <p className="text-xs font-medium text-amber-900">What happens next:</p>
                    <ul className="text-xs text-amber-800 mt-1 space-y-0.5 list-disc list-inside">
                      <li>Your PDF is stored securely</li>
                      <li>AI extracts projects, tasks, items, and labor from the estimate</li>
                      <li>A new project will appear in your Projects list</li>
                    </ul>
                  </div>
                  <div className="mt-3 text-xs text-amber-700 space-y-0.5">
                    {result.fileName && <p>File: {result.fileName}</p>}
                    {result.referenceId && <p>Reference: <code className="font-mono bg-amber-100 px-1 rounded">{result.referenceId}</code></p>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Link
                      to="/app/pdf-uploads"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900"
                    >
                      View all PDF uploads
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                    <Link
                      to="/app/projects"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900"
                    >
                      View projects
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-50/50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
              }`}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-base font-medium text-gray-900">
                  {file ? file.name : 'Drop a PDF here or click to browse'}
                </p>
                {file && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatBytes(file.size)} · Max {MAX_SIZE_MB} MB
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  PDF only, max {MAX_SIZE_MB} MB. The AI will create a project and tasks from the estimate.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => { setFile(null); setError(null); setResult(null) }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!file || !!error || uploading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading && <Spinner size="sm" />}
                {uploading ? 'Uploading…' : 'Upload & process'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
