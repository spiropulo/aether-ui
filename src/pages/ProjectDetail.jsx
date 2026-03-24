import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_PROJECT,
  GET_PROJECT_STATUS,
  GET_SUGGESTED_PROJECT_STATUSES,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  GET_TASKS,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  GET_OFFERS,
  GET_OFFERS_BY_PROJECT,
  GET_PROJECT_EMAILS,
  SEND_PROJECT_EMAIL,
  GET_PROJECT_PRICING_RUNS,
  DELETE_PRICING_RUN,
  DELETE_ALL_PRICING_RUNS_FOR_PROJECT,
  PROJECT_STATUS_OPTIONS,
} from '../api/projects'
import { GET_USER_PROFILES } from '../api/users'
import {
  downloadPdf,
  getPdfUpload,
  getPdfUploadsForProject,
  deletePdfUploadForProject,
  requestProjectPricing,
  exportProjectPdf,
  syncProjectFromPdf,
} from '../api/estimate'
import EmailComposeModal from '../components/EmailComposeModal'
import ProjectMessageHistoryItem from '../components/ProjectMessageHistoryItem'
import WeeklyEfficiencyPanel, { toDateInputValue } from '../components/WeeklyEfficiencyPanel'
import {
  GET_TENANT_TRAINING,
  GET_PROJECT_TRAINING,
  CREATE_PROJECT_TRAINING,
  UPDATE_TRAINING,
  DELETE_TRAINING,
} from '../api/training'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import Alert from '../components/ui/Alert'
import TrainingDataForm from '../components/TrainingDataForm'
import CalendarColorSwatchSelect from '../components/ui/CalendarColorSwatchSelect'
import { CALENDAR_COLORS } from '../components/ui/calendarColors'

const PAGE_SIZE = 20

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Parse YYYY-MM-DD (or YYYY-MM-DDTHH:mm:ss) as local date to avoid timezone shifts */
function parseDateOnly(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).split('T')[0]
  const parts = s.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function formatCurrency(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

function formatBytes(n) {
  if (n == null || Number.isNaN(n)) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** Align loosely with server E.164 normalization for deduping SMS recipients in the UI. */
function normalizePhoneForSms(phone) {
  if (!phone || typeof phone !== 'string') return null
  const t = phone.trim()
  if (!t) return null
  if (t.startsWith('+')) {
    const rest = t.slice(1).replace(/\D/g, '')
    return rest ? `+${rest}` : null
  }
  const digits = t.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 10) return `+${digits}`
  return null
}

function memberDisplayName(m) {
  if (!m) return 'Unknown member'
  return (
    m.displayName ||
    [m.firstName, m.lastName].filter(Boolean).join(' ').trim() ||
    m.username ||
    m.email ||
    m.id
  )
}

/** One row per unique assignee, with resolved contacts for the message modal. */
function messageRecipientMembers(assigneeIds, teamMembers) {
  const seen = new Set()
  const out = []
  for (const id of assigneeIds ?? []) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    const m = teamMembers.find((t) => t.id === id)
    const emailRaw = m?.email?.trim()
    const email = emailRaw || null
    const phoneE164 = m?.phoneNumber ? normalizePhoneForSms(m.phoneNumber) : null
    out.push({
      id,
      displayName: memberDisplayName(m),
      email,
      phoneE164,
    })
  }
  return out
}

function messageTargetsForAssigneeIds(assigneeIds, teamMembers) {
  const members = messageRecipientMembers(assigneeIds, teamMembers)
  const toEmails = [...new Set(members.map((r) => r.email).filter(Boolean))]
  const toPhoneNumbers = [...new Set(members.map((r) => r.phoneE164).filter(Boolean))]
  return { toEmails, toPhoneNumbers, members }
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const PDF_STATUS_LABELS = {
  PENDING: { label: 'Queued', color: 'bg-gray-100 text-gray-700' },
  PROCESSING: { label: 'Processing', color: 'bg-amber-100 text-amber-800' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
}

function offerAmount(offer) {
  if (offer.total != null && !Number.isNaN(offer.total)) return offer.total
  const q = offer.quantity ?? 0
  const c = offer.unitCost ?? 0
  return q * c
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  return { startPad: first.getDay(), days: last.getDate() }
}

// ─── Pricing run card ─────────────────────────────────────────────────────────
function PricingRunCard({ run, formatDate, formatCurrency, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [copiedSection, setCopiedSection] = useState(null)
  const handleCopy = (text, section) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 1500)
    })
  }
  const runAt = run.runAt ? formatDate(run.runAt) : '—'
  const toolCalls = run.toolCallsMade ?? 0
  let offersSnapshot = null
  try {
    if (run.offersSnapshot) offersSnapshot = JSON.parse(run.offersSnapshot)
  } catch { /* invalid JSON */ }
  const projectTotal = offersSnapshot?.projectTotal ?? null
  const offers = offersSnapshot?.offers ?? []
  let toolCallLogParsed = null
  try {
    if (run.toolCallLog) toolCallLogParsed = JSON.parse(run.toolCallLog)
  } catch { /* invalid JSON */ }
  let activityLogParsed = null
  try {
    if (run.agentActivityLog) activityLogParsed = JSON.parse(run.agentActivityLog)
  } catch { /* invalid JSON */ }

  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-sm font-medium text-gray-900">
              {runAt}
              {toolCalls > 0 && (
                <span className="ml-2 text-gray-500 font-normal">
                  {toolCalls} tool call{toolCalls !== 1 ? 's' : ''}
                </span>
              )}
            </p>
            {projectTotal != null && (
              <span className="text-sm font-semibold text-indigo-700">
                {formatCurrency(projectTotal)}
              </span>
            )}
          </div>
          {(run.report || run.agentReport) && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{run.report || run.agentReport}</p>
          )}
          {offers.length > 0 && !expanded && (
            <p className="text-xs text-gray-500 mt-1">
              {offers.length} offer{offers.length !== 1 ? 's' : ''} priced
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {expanded ? 'Less' : 'Details'}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(run)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {(run.report || run.agentReport) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Report</p>
                <button
                  type="button"
                  onClick={() => handleCopy(run.report || run.agentReport || '', 'report')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {copiedSection === 'report' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans overflow-x-auto p-4 rounded-lg bg-white border border-gray-100 max-h-64 overflow-y-auto select-text cursor-text leading-relaxed">
                {run.report || run.agentReport}
              </pre>
            </div>
          )}
          {offers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Prices set ({formatCurrency(projectTotal)} total)
              </p>
              <div className="rounded-lg bg-white border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Offer</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Unit cost</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((o, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-3 py-2 text-gray-900">{o.name ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{o.quantity ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(o.unitCost)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!run.report && run.agentReport && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent report</p>
                <button
                  type="button"
                  onClick={() => handleCopy(run.agentReport, 'agentReport')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {copiedSection === 'agentReport' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto p-3 rounded-lg bg-white border border-gray-100 max-h-48 overflow-y-auto select-text cursor-text">
                {run.agentReport}
              </pre>
            </div>
          )}
          {(toolCallLogParsed?.length > 0 || activityLogParsed?.length > 0) && (
            <details className="group">
              <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700">
                Technical details (tool calls, activity log)
              </summary>
              <div className="mt-3 space-y-3">
                {toolCallLogParsed && Array.isArray(toolCallLogParsed) && toolCallLogParsed.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Tool calls</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(JSON.stringify(toolCallLogParsed, null, 2), 'toolCalls')}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {copiedSection === 'toolCalls' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto p-3 rounded-lg bg-gray-50 border border-gray-100 max-h-40 overflow-y-auto select-text cursor-text">
                      {JSON.stringify(toolCallLogParsed, null, 2)}
                    </pre>
                  </div>
                )}
                {activityLogParsed && Array.isArray(activityLogParsed) && activityLogParsed.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Activity log</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(JSON.stringify(activityLogParsed, null, 2), 'activityLog')}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {copiedSection === 'activityLog' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto p-3 rounded-lg bg-gray-50 border border-gray-100 max-h-40 overflow-y-auto select-text cursor-text">
                      {JSON.stringify(activityLogParsed, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Project Calendar (tasks with dates) ────────────────────────────────────────
function ProjectCalendar({ projectId, tasks, onSwitchToTasks, refetchTasks }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const tasksWithDates = tasks.filter((t) => t.startDate || t.endDate)
  const { startPad, days } = getDaysInMonth(viewDate.year, viewDate.month)
  const monthName = new Date(viewDate.year, viewDate.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const tasksByDay = {}
  for (let d = 1; d <= days; d++) {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    tasksByDay[dateStr] = tasksWithDates.filter((t) => {
      if ((t.calendarExcludedDates ?? []).includes(dateStr)) return false
      const start = parseDateOnly(t.startDate)
      const end = t.endDate ? parseDateOnly(t.endDate) : null
      const endDay = end ? new Date(end) : null
      if (endDay) endDay.setHours(23, 59, 59, 999)
      const cell = new Date(viewDate.year, viewDate.month, d)
      cell.setHours(0, 0, 0, 0)
      if (start && cell < start) return false
      if (endDay && cell > endDay) return false
      return true
    })
  }

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">{monthName}</span>
          <button
            onClick={() => setViewDate((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setViewDate({ year: today.getFullYear(), month: today.getMonth() })}
            className="ml-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-4">
          Assign start and end dates to tasks in the Tasks tab to see them here. Days removed on a task&apos;s calendar are hidden here and excluded from labor efficiency.
        </p>
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
          {dayHeaders.map((h) => (
            <div key={h} className="bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
              {h}
            </div>
          ))}
          {Array.from({ length: startPad }, (_, i) => (
            <div key={`pad-${i}`} className="bg-gray-50 min-h-[80px] p-2" />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1
            const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const dayTasks = tasksByDay[dateStr] ?? []
            const isToday = dateStr === todayStr

            return (
              <div
                key={d}
                className={`min-h-[80px] p-2 bg-white ${isToday ? 'ring-2 ring-indigo-400 ring-inset rounded' : ''}`}
              >
                <span
                  className={`inline-block w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                  }`}
                >
                  {d}
                </span>
                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 3).map((t) => {
                    const color = t.calendarColor || '#6366F1'
                    return (
                      <Link
                        key={t.id}
                        to={`/app/projects/${projectId}/tasks/${t.id}`}
                        className="block truncate text-xs px-1.5 py-0.5 rounded transition-opacity hover:opacity-90"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                          borderLeft: `3px solid ${color}`,
                        }}
                        title={`${t.name} — ${t.startDate ? formatDate(t.startDate) : '?'} to ${t.endDate ? formatDate(t.endDate) : '?'}`}
                      >
                        {t.name}
                      </Link>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <span className="text-xs text-gray-500 px-1">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {tasksWithDates.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title="No tasks with dates"
              description="Edit a task in the Tasks tab and add a start date or end date to see it on the calendar."
              action={
                <button
                  onClick={() => { refetchTasks?.(); onSwitchToTasks?.() }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Go to Tasks
                </button>
              }
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Project edit form ────────────────────────────────────────────────────────
function ProjectForm({ initial, suggestedStatuses = [], teamMembers = [], isAdmin = false, onSubmit, loading, error }) {
  const statusOptions =
    suggestedStatuses.length > 0 ? suggestedStatuses : PROJECT_STATUS_OPTIONS
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    addressLine1: initial?.addressLine1 ?? '',
    addressLine2: initial?.addressLine2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    postalCode: initial?.postalCode ?? '',
    country: initial?.country ?? '',
    laborWorkdayStart: initial?.laborWorkdayStart ?? '',
    laborWorkdayEnd: initial?.laborWorkdayEnd ?? '',
  })
  const [laborRows, setLaborRows] = useState(() =>
    (initial?.laborRateOverrides ?? []).map((o) => ({
      userProfileId: o.userProfileId,
      hourlyRate: String(o.hourlyRate),
    })),
  )
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status.trim() || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      addressLine1: form.addressLine1.trim() || null,
      addressLine2: form.addressLine2.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      postalCode: form.postalCode.trim() || null,
      country: form.country.trim() || null,
    }
    if (isAdmin) {
      payload.laborRateOverrides = laborRows
        .filter((r) => r.userProfileId && r.hourlyRate.trim() !== '')
        .map((r) => ({ userProfileId: r.userProfileId, hourlyRate: parseFloat(r.hourlyRate) }))
      payload.laborWorkdayStart = form.laborWorkdayStart.trim() || null
      payload.laborWorkdayEnd = form.laborWorkdayEnd.trim() || null
    }
    onSubmit(payload)
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input name="name" required value={form.name} onChange={handleChange} placeholder="Project name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Brief description…" className={`${inputClass} resize-none`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
        <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
          <option value="">— None —</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {form.status && !statusOptions.includes(form.status) ? (
            <option value={form.status}>{form.status} (other)</option>
          ) : null}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
          <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">End date</label>
          <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inputClass} />
        </div>
      </div>
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Address (for location-based pricing)</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Street address</label>
            <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="123 Main St" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apt, suite, etc. (optional)</label>
            <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Suite 100" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="San Francisco" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State / Province</label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="CA" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal code</label>
              <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="94102" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <input name="country" value={form.country} onChange={handleChange} placeholder="USA" className={inputClass} />
            </div>
          </div>
        </div>
      </div>
      {isAdmin && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Labor efficiency workday (optional)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Override the workspace default workday window for planned/actual hours on this project. Leave blank to use Settings. Use 24-hour times (e.g. 08:00 and 17:00).
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Workday start</label>
              <input
                name="laborWorkdayStart"
                type="time"
                value={form.laborWorkdayStart}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Workday end</label>
              <input
                name="laborWorkdayEnd"
                type="time"
                value={form.laborWorkdayEnd}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Labor rates on this project</h3>
          <p className="text-xs text-gray-500 mb-3">
            Override a team member&apos;s default hourly rate for the Estimator on this project only. Task calendar dates and assignees drive labor duration.
          </p>
          <div className="space-y-2">
            {laborRows.map((row, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Member</label>
                  <select
                    value={row.userProfileId}
                    onChange={(e) => {
                      const v = e.target.value
                      setLaborRows((rows) => rows.map((r, i) => (i === idx ? { ...r, userProfileId: v } : r)))
                    }}
                    className={inputClass}
                  >
                    <option value="">— Select —</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-xs font-medium text-gray-600 mb-1">$/hr</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.hourlyRate}
                    onChange={(e) => {
                      const v = e.target.value
                      setLaborRows((rows) => rows.map((r, i) => (i === idx ? { ...r, hourlyRate: v } : r)))
                    }}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLaborRows((rows) => rows.filter((_, i) => i !== idx))}
                  className="text-xs text-red-600 hover:text-red-700 px-2 py-2.5"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLaborRows((rows) => [...rows, { userProfileId: '', hourlyRate: '' }])}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              + Add override
            </button>
          </div>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          Save changes
        </button>
      </div>
    </form>
  )
}

function taskFormOfferAssigneesLabel(offer, teamMembers) {
  if (!offer?.assigneeIds?.length) return 'No assignees'
  const names = offer.assigneeIds.map(
    (id) => teamMembers.find((m) => m.id === id)?.displayName || teamMembers.find((m) => m.id === id)?.username || id,
  )
  return names.filter(Boolean).join(', ') || '—'
}

// ─── Task form ────────────────────────────────────────────────────────────────
function TaskForm({ initial, onSubmit, loading, error, teamMembers, offers = [] }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    calendarColor: initial?.calendarColor ?? CALENDAR_COLORS[0].value,
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      assigneeIds: initial?.assigneeIds ?? [],
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      calendarColor: form.calendarColor || null,
    })
  }
  const taskExists = Boolean(initial?.id)
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input name="name" required value={form.name} onChange={handleChange} placeholder="Task name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Short summary of the task name" className={`${inputClass} resize-none`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date (for calendar)</label>
          <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">End date (for calendar)</label>
          <div className="flex gap-2 items-stretch">
            <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className={`${inputClass} flex-1 min-w-0`} />
            <CalendarColorSwatchSelect
              value={form.calendarColor}
              onChange={(v) => setForm((p) => ({ ...p, calendarColor: v }))}
              triggerClassName="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 hover:bg-gray-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition h-full min-h-[42px]"
            />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Team</h3>
        {!taskExists ? (
          <p className="text-sm text-gray-500">Create the task first, then open it to add offers and assign team members.</p>
        ) : offers.length === 0 ? (
          <p className="text-sm text-gray-500">No offers yet. Open this task to add offers and assign team members.</p>
        ) : (
          <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {offers.map((offer) => (
              <li key={offer.id} className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{offer.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{taskFormOfferAssigneesLabel(offer, teamMembers)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const tenantId = user?.tenantId
  const isAdmin = user?.role === 'ADMIN'

  const [activeTab, setActiveTab] = useState('tasks')
  const [taskOffset, setTaskOffset] = useState(0)
  const [taskSearch, setTaskSearch] = useState('')
  const [taskSearchInput, setTaskSearchInput] = useState('')
  const [taskSortBy, setTaskSortBy] = useState('name')
  const [taskSortDir, setTaskSortDir] = useState('asc')
  const [trainingOffset, setTrainingOffset] = useState(0)

  const [projectModal, setProjectModal] = useState(false)
  const [taskModal, setTaskModal] = useState(null)
  const [trainingModal, setTrainingModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [downloadingPdfId, setDownloadingPdfId] = useState(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingResult, setPricingResult] = useState(null)
  const [pricingModal, setPricingModal] = useState(false)
  const [projectPdfs, setProjectPdfs] = useState([])
  const [projectPdfsLoading, setProjectPdfsLoading] = useState(false)
  const [projectPdfsError, setProjectPdfsError] = useState(null)
  const [deleteProjectPdfTarget, setDeleteProjectPdfTarget] = useState(null)
  const [deletingProjectPdf, setDeletingProjectPdf] = useState(false)
  const [emailModal, setEmailModal] = useState(null) // { type, taskId?, taskName?, recipients, modalKey, defaultSubject, defaultBody }
  const [emailSearch, setEmailSearch] = useState('')
  const [emailSearchInput, setEmailSearchInput] = useState('')
  const [laborWeekDate, setLaborWeekDate] = useState(() => toDateInputValue(new Date()))
  const [laborWeekMode, setLaborWeekMode] = useState('ISO_MONDAY')
  const [laborAssigneeFilter, setLaborAssigneeFilter] = useState('')
  const [laborTaskFilter, setLaborTaskFilter] = useState('')
  const [pricingRunsSearch, setPricingRunsSearch] = useState('')
  const [pricingRunsSearchInput, setPricingRunsSearchInput] = useState('')
  const [pricingConfirmOpen, setPricingConfirmOpen] = useState(false)
  const [exportPdfConfirmOpen, setExportPdfConfirmOpen] = useState(false)
  const pdfImportInputRef = useRef(null)
  const [pdfImportBusy, setPdfImportBusy] = useState(false)
  const [deletePricingRunTarget, setDeletePricingRunTarget] = useState(null)
  const [deleteAllPricingRunsOpen, setDeleteAllPricingRunsOpen] = useState(false)

  const [mutationError, setMutationError] = useState(null)

  const { data: projectData, loading: projectLoading, refetch: refetchProject } = useQuery(GET_PROJECT, {
    variables: { id: projectId, tenantId },
    skip: !tenantId,
  })

  const { data: statusPollData } = useQuery(GET_PROJECT_STATUS, {
    variables: { id: projectId, tenantId },
    skip: !tenantId || !projectData?.project,
    pollInterval: 5000,
    fetchPolicy: 'no-cache',
  })

  const { data: statusData } = useQuery(GET_SUGGESTED_PROJECT_STATUSES)
  const suggestedStatuses = statusData?.suggestedProjectStatuses ?? []

  const taskSearchActive = taskSearch.trim().length > 0

  useEffect(() => {
    setTaskOffset(0)
  }, [taskSearch, taskSortBy, taskSortDir])

  useEffect(() => {
    if (!isAdmin && (activeTab === 'training' || activeTab === 'pricingRuns')) {
      setActiveTab('tasks')
    }
  }, [isAdmin, activeTab])

  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(GET_TASKS, {
    variables: {
      projectId,
      tenantId,
      page: taskSearchActive ? { limit: 500, offset: 0 } : { limit: PAGE_SIZE, offset: taskOffset },
    },
    skip: !tenantId,
  })

  const { data: calendarTasksData, refetch: refetchCalendarTasks } = useQuery(GET_TASKS, {
    variables: { projectId, tenantId, page: { limit: 500, offset: 0 } },
    skip: !tenantId || activeTab !== 'calendar',
  })

  const { data: trainingData, loading: trainingLoading, refetch: refetchTraining } = useQuery(GET_PROJECT_TRAINING, {
    variables: { tenantId, projectId, page: { limit: PAGE_SIZE, offset: trainingOffset } },
    skip: !tenantId || activeTab !== 'training',
  })

  const { data: offersByProjectData, refetch: refetchOffers } = useQuery(GET_OFFERS_BY_PROJECT, {
    variables: { tenantId, projectId },
    skip: !tenantId || !projectId,
    fetchPolicy: 'network-only',
  })

  /** Up to 500 tasks — used on PDFs tab to require ≥1 task with ≥1 offer before client export. */
  const { data: exportClientTasksData, loading: exportClientTasksLoading } = useQuery(GET_TASKS, {
    variables: { projectId, tenantId, page: { limit: 500, offset: 0 } },
    skip: !tenantId || !projectId || activeTab !== 'pdfs',
    fetchPolicy: 'network-only',
  })

  // Check if training data is configured (required for Request Pricing)
  const { data: tenantTrainingCheck } = useQuery(GET_TENANT_TRAINING, {
    variables: { tenantId, page: { limit: 1, offset: 0 } },
    skip: !tenantId,
  })
  /** Used only for pricing checklist `hasProjectTraining`; must refetch after project training mutations (separate cache key from the tab list query). */
  const { data: projectTrainingCheck, refetch: refetchProjectTrainingCheck } = useQuery(GET_PROJECT_TRAINING, {
    variables: { tenantId, projectId, page: { limit: 1, offset: 0 } },
    skip: !tenantId || !projectId,
  })
  const { data: teamData } = useQuery(GET_USER_PROFILES, {
    variables: { tenantId, page: { limit: 100, offset: 0 } },
    skip: !tenantId,
  })
  const { data: emailsData, refetch: refetchEmails } = useQuery(GET_PROJECT_EMAILS, {
    variables: { projectId, tenantId },
    skip: !tenantId || !projectId,
  })
  const { data: pricingRunsData, loading: pricingRunsLoading, refetch: refetchPricingRuns } = useQuery(GET_PROJECT_PRICING_RUNS, {
    variables: { projectId, tenantId },
    skip: !tenantId || !projectId || !isAdmin,
  })
  const teamMembers = teamData?.userProfiles?.items ?? []

  const taskModalTaskId = taskModal?.mode === 'edit' && taskModal?.task?.id ? taskModal.task.id : null
  const { data: taskModalOffersData } = useQuery(GET_OFFERS, {
    variables: { projectId, taskId: taskModalTaskId, tenantId, page: { limit: 100, offset: 0 } },
    skip: !tenantId || !projectId || !taskModalTaskId,
  })
  const taskModalOffers = taskModalOffersData?.offers?.items ?? []
  const projectEmails = emailsData?.projectEmails ?? []
  const emailSearchLower = emailSearch.trim().toLowerCase()
  const filteredEmails = emailSearchLower
    ? projectEmails.filter((e) => {
        const subject = (e.subject ?? '').toLowerCase()
        const body = (e.body ?? '').toLowerCase()
        const phones = (e.toPhoneNumbers ?? []).join(' ').toLowerCase()
        const channels = (e.deliveryChannels ?? []).join(' ').toLowerCase()
        const toStr = (e.toEmails ?? []).join(' ').toLowerCase()
        return (
          subject.includes(emailSearchLower) ||
          body.includes(emailSearchLower) ||
          toStr.includes(emailSearchLower) ||
          phones.includes(emailSearchLower) ||
          channels.includes(emailSearchLower)
        )
      })
    : projectEmails

  const projectPricingRuns = pricingRunsData?.projectPricingRuns ?? []
  const pricingRunsSearchLower = pricingRunsSearch.trim().toLowerCase()
  const filteredPricingRuns = pricingRunsSearchLower
    ? projectPricingRuns.filter((run) => {
        const report = (run.report ?? run.agentReport ?? '').toLowerCase()
        const toolLog = (run.toolCallLog ?? '').toLowerCase()
        const activityLog = (run.agentActivityLog ?? '').toLowerCase()
        const runAt = (run.runAt ?? '').toLowerCase()
        const offersSnap = (run.offersSnapshot ?? '').toLowerCase()
        return report.includes(pricingRunsSearchLower) || toolLog.includes(pricingRunsSearchLower) || activityLog.includes(pricingRunsSearchLower) || runAt.includes(pricingRunsSearchLower) || offersSnap.includes(pricingRunsSearchLower)
      })
    : projectPricingRuns

  const hasTenantTraining = (tenantTrainingCheck?.tenantTrainingData?.total ?? 0) > 0
  const hasProjectTraining = (projectTrainingCheck?.projectTrainingData?.total ?? 0) > 0
  const hasTrainingData = hasTenantTraining || hasProjectTraining

  const [updateProject, { loading: updatingProject }] = useMutation(UPDATE_PROJECT, {
    onCompleted: () => { setProjectModal(false); refetchProject() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteProject, { loading: deletingProject }] = useMutation(DELETE_PROJECT, {
    onCompleted: () => navigate('/app/projects'),
    onError: (e) => setMutationError(e.message),
  })

  const [createTask, { loading: creatingTask }] = useMutation(CREATE_TASK, {
    onCompleted: () => { setTaskModal(null); refetchTasks(); refetchCalendarTasks?.() },
    onError: (e) => setMutationError(e.message),
  })

  const [updateTask, { loading: updatingTask }] = useMutation(UPDATE_TASK, {
    onCompleted: () => { setTaskModal(null); refetchTasks(); refetchCalendarTasks?.() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteTask, { loading: deletingTask }] = useMutation(DELETE_TASK, {
    onCompleted: () => { setDeleteTarget(null); refetchTasks(); refetchOffers() },
    onError: (e) => setMutationError(e.message),
  })

  const [createTraining, { loading: creatingTraining }] = useMutation(CREATE_PROJECT_TRAINING, {
    onCompleted: () => {
      setTrainingModal(null)
      refetchTraining()
      refetchProjectTrainingCheck()
    },
    onError: (e) => setMutationError(e.message),
  })

  const [updateTraining, { loading: updatingTraining }] = useMutation(UPDATE_TRAINING, {
    onCompleted: () => {
      setTrainingModal(null)
      refetchTraining()
      refetchProjectTrainingCheck()
    },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteTraining, { loading: deletingTraining }] = useMutation(DELETE_TRAINING, {
    onCompleted: () => {
      setDeleteTarget(null)
      refetchTraining()
      refetchProjectTrainingCheck()
    },
    onError: (e) => setMutationError(e.message),
  })

  const [sendProjectEmail, { loading: sendingEmail }] = useMutation(SEND_PROJECT_EMAIL, {
    onCompleted: () => { setEmailModal(null); refetchEmails() },
    onError: (e) => setMutationError(e.message),
  })

  const [deletePricingRun, { loading: deletingPricingRun }] = useMutation(DELETE_PRICING_RUN, {
    onCompleted: () => { setDeletePricingRunTarget(null); refetchPricingRuns() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteAllPricingRuns, { loading: deletingAllPricingRuns }] = useMutation(DELETE_ALL_PRICING_RUNS_FOR_PROJECT, {
    onCompleted: () => {
      setDeleteAllPricingRunsOpen(false)
      setPricingRunsSearch('')
      setPricingRunsSearchInput('')
      refetchPricingRuns()
    },
    onError: (e) => setMutationError(e.message),
  })

  const loadProjectPdfs = useCallback(async () => {
    if (!tenantId || !projectId) return
    setProjectPdfsLoading(true)
    setProjectPdfsError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const data = await getPdfUploadsForProject(projectId, tenantId, { token })
      setProjectPdfs(data)
    } catch (e) {
      setProjectPdfsError(e.message)
      setProjectPdfs([])
    } finally {
      setProjectPdfsLoading(false)
    }
  }, [tenantId, projectId])

  useEffect(() => {
    if (activeTab !== 'pdfs') return
    loadProjectPdfs()
    const t = setInterval(loadProjectPdfs, 10000)
    return () => clearInterval(t)
  }, [activeTab, loadProjectPdfs])

  const project = projectData?.project
  const displayStatus = statusPollData?.project?.status ?? project?.status
  const sourcePdfUploadId = statusPollData?.project?.sourcePdfUploadId ?? project?.sourcePdfUploadId
  const hasAddress = (project?.addressLine1?.trim?.()?.length > 0) ||
    (project?.city?.trim?.()?.length > 0 && project?.country?.trim?.()?.length > 0)
  const pricingInProgress = displayStatus === 'PRICING' || pricingLoading

  const handleRequestPricing = async () => {
    if (!isAdmin || !tenantId || !projectId) return
    setPricingLoading(true)
    setMutationError(null)
    setPricingResult(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const result = await requestProjectPricing(projectId, tenantId, { token })
      setPricingResult(result)
      setPricingModal(true)
      refetchProject()
      refetchTasks()
      refetchOffers()
      refetchPricingRuns()
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('address')) {
        setMutationError(
          'Set the project address before requesting pricing. Edit the project and add at least street address or city + country.'
        )
      } else if (msg.toLowerCase().includes('training data')) {
        setMutationError(
          'Configure tenant or project training data first. Add global training under AI Training, or add project-specific training in the Custom Training Data tab below.'
        )
      } else if (msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('billing')) {
        setMutationError(
          'AI pricing limit reached for this billing period. Upgrade your plan in Settings or wait until the next cycle.'
        )
      } else {
        setMutationError(msg)
      }
    } finally {
      setPricingLoading(false)
    }
  }

  const handleExportProjectPdf = async () => {
    if (!projectId || !tenantId) return
    setExportingPdf(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const blob = await exportProjectPdf(projectId, tenantId, { token })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${project?.name || 'estimate'}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_')
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setMutationError(err.message)
    } finally {
      setExportingPdf(false)
    }
  }

  const handleDownloadProjectPdfRow = async (upload) => {
    if (!tenantId) return
    setDownloadingPdfId(upload.id)
    setProjectPdfsError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const blob = await downloadPdf(upload.id, tenantId, { token })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = upload.fileName || 'estimate.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setProjectPdfsError(err.message)
    } finally {
      setDownloadingPdfId(null)
    }
  }

  const handleConfirmDeleteProjectPdf = async () => {
    if (!deleteProjectPdfTarget || !tenantId || !projectId) return
    setDeletingProjectPdf(true)
    setProjectPdfsError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      await deletePdfUploadForProject(projectId, deleteProjectPdfTarget.id, tenantId, { token })
      setDeleteProjectPdfTarget(null)
      await loadProjectPdfs()
      await refetchProject()
    } catch (err) {
      setProjectPdfsError(err.message)
    } finally {
      setDeletingProjectPdf(false)
    }
  }

  const pollPdfImportUntilDone = async (uploadId) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
    const maxAttempts = 300
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const rec = await getPdfUpload(uploadId, tenantId, { token })
      const st = rec?.status
      if (st === 'COMPLETED') return
      if (st === 'FAILED') throw new Error('PDF import failed. Check the upload record or try again.')
    }
    throw new Error('Timed out waiting for PDF import. Try refreshing the page.')
  }

  const handlePdfImportChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !projectId || !tenantId) return
    if (file.type !== 'application/pdf') {
      setMutationError('Only PDF files are accepted.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setMutationError('File exceeds the 20 MB limit.')
      return
    }
    setMutationError(null)
    setPdfImportBusy(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const ack = await syncProjectFromPdf(projectId, file, {
        tenantId,
        uploadedBy: user?.id ?? user?.username,
        token,
      })
      const refId = ack.referenceId ?? ack.reference_id
      if (!refId) throw new Error('No upload reference returned.')
      await pollPdfImportUntilDone(refId)
      await refetchProject()
      await refetchTasks()
      await refetchOffers()
      await loadProjectPdfs()
      if (activeTab === 'calendar') await refetchCalendarTasks()
    } catch (err) {
      setMutationError(err.message)
    } finally {
      setPdfImportBusy(false)
    }
  }

  const rawTasks = tasksData?.tasks?.items ?? []
  const rawTaskTotal = tasksData?.tasks?.total ?? 0

  const taskSearchLower = taskSearch.trim().toLowerCase()
  const filteredTasks = taskSearchLower
    ? rawTasks.filter(
        (t) =>
          (t.name ?? '').toLowerCase().includes(taskSearchLower) ||
          (t.description ?? '').toLowerCase().includes(taskSearchLower)
      )
    : rawTasks

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const mul = taskSortDir === 'asc' ? 1 : -1
    if (taskSortBy === 'name') {
      return mul * ((a.name ?? '').localeCompare(b.name ?? ''))
    }
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return mul * (aDate - bDate)
  })

  const taskTotal = taskSearchActive ? filteredTasks.length : rawTaskTotal
  const tasks = taskSearchActive
    ? sortedTasks.slice(taskOffset, taskOffset + PAGE_SIZE)
    : sortedTasks
  const trainings = trainingData?.projectTrainingData?.items ?? []

  // Compute task totals and project total from offers
  const offersByProject = offersByProjectData?.offersByProject ?? []
  const taskTotals = {}
  let projectTotal = 0
  for (const offer of offersByProject) {
    const amt = offerAmount(offer)
    if (!Number.isNaN(amt)) {
      taskTotals[offer.taskId] = (taskTotals[offer.taskId] ?? 0) + amt
      projectTotal += amt
    }
  }

  const exportClientTaskIdSet = new Set(
    (exportClientTasksData?.tasks?.items ?? []).map((t) => t.id).filter(Boolean),
  )
  const canExportForClient =
    !exportClientTasksLoading &&
    offersByProject.some((o) => o.taskId && exportClientTaskIdSet.has(o.taskId))

  const allTasksForMessaging = calendarTasksData?.tasks?.items ?? tasksData?.tasks?.items ?? []
  const projectMessageAssigneeIds = [...new Set([
    ...allTasksForMessaging.flatMap((t) => t.assigneeIds ?? []),
    ...offersByProject.flatMap((o) => o.assigneeIds ?? []),
  ])]
  const { members: projectRecipients } = messageTargetsForAssigneeIds(projectMessageAssigneeIds, teamMembers)
  const canMessageProjectTeam = projectRecipients.some((r) => r.email || r.phoneE164)
  const projectWithEmail = projectRecipients.filter((r) => r.email).length
  const projectWithPhone = projectRecipients.filter((r) => r.phoneE164).length

  const trainingTotal = trainingData?.projectTrainingData?.total ?? 0

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Project not found.{' '}
        <Link to="/app/projects" className="text-indigo-600 font-medium">Go back</Link>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {pricingInProgress && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <Spinner size="sm" />
          <span className="font-medium">AI is pricing this project</span>
          <span className="text-amber-700 text-sm">Pricing each offer (tasks set the schedule on the calendar). The project is locked until pricing completes. This may take a few minutes.</span>
        </div>
      )}
      {mutationError && (
        <div className="mb-6">
          <Alert message={mutationError} />
        </div>
      )}
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/app/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{project.name}</span>
      </nav>

      {/* Project header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {displayStatus && (
                <span className="inline-block max-w-md px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 break-words whitespace-normal">
                  {displayStatus}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {project.startDate && <span>Start: {formatDate(project.startDate)}</span>}
                {project.endDate && <span>Due: {formatDate(project.endDate)}</span>}
              </div>
            )}
            {[project.addressLine1, project.city, project.state, project.postalCode, project.country].some(Boolean) && (
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {[project.addressLine1, project.addressLine2, [project.city, project.state, project.postalCode].filter(Boolean).join(', '), project.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {isAdmin && (
              <div className="flex flex-col items-end gap-1">
                {(!hasTrainingData || !hasAddress) && !pricingInProgress && (
                  <div className="text-xs text-amber-700 space-y-0.5 text-right">
                    <p className="font-medium">Pricing checklist:</p>
                    <ul className="list-none">
                      {!hasAddress && (
                        <li>☐ Set project <button type="button" onClick={() => { setMutationError(null); setProjectModal(true) }} className="hover:underline font-medium">address</button></li>
                      )}
                      {hasAddress && <li>☑ Address set</li>}
                      {!hasTrainingData && (
                        <li>☐ Add <Link to="/app/training" className="hover:underline font-medium">global training</Link> or <button type="button" onClick={() => setActiveTab('training')} className="hover:underline font-medium">project training</button></li>
                      )}
                      {hasTrainingData && <li>☑ Training data configured</li>}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => setPricingConfirmOpen(true)}
                  disabled={pricingInProgress || !hasTrainingData || !hasAddress}
                  title={
                    pricingInProgress ? 'Pricing in progress…' :
                    !hasTrainingData ? 'Configure tenant or project training data before requesting pricing.' :
                    !hasAddress ? 'Set the project address before requesting pricing.' : undefined
                  }
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-indigo-50"
                >
                  {pricingLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {pricingLoading ? (
                    <>
                      Pricing…
                      <span className="text-indigo-500/80 font-normal">(may take a few minutes)</span>
                    </>
                  ) : (
                    'Request pricing'
                  )}
                </button>
              </div>
            )}
            <button
              onClick={() => { setMutationError(null); setProjectModal(true) }}
              disabled={pricingInProgress}
              title={pricingInProgress ? 'Project is locked during pricing' : undefined}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setDeleteTarget({ type: 'project', item: project })}
              disabled={pricingInProgress}
              title={pricingInProgress ? 'Project is locked during pricing' : undefined}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Project total panel */}
      {isAdmin && (
        <div className="mb-6 p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Project total</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(projectTotal)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'tasks', label: 'Tasks' },
          { key: 'calendar', label: 'Calendar' },
          ...(isAdmin
            ? [
                { key: 'training', label: 'Custom Training Data' },
                { key: 'pricingRuns', label: 'Pricing runs' },
              ]
            : []),
          { key: 'emails', label: 'Messages' },
          { key: 'labor', label: 'Weekly efficiency' },
          { key: 'pdfs', label: 'PDFs' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                Tasks <span className="text-gray-400 font-normal text-sm ml-1">({taskTotal})</span>
              </h2>
              <form
                onSubmit={(e) => { e.preventDefault(); setTaskSearch(taskSearchInput); setTaskOffset(0) }}
                className="flex gap-2 flex-1 max-w-sm"
              >
                <input
                  value={taskSearchInput}
                  onChange={(e) => setTaskSearchInput(e.target.value)}
                  placeholder="Search tasks…"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
                <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                  Search
                </button>
                {taskSearch && (
                  <button type="button" onClick={() => { setTaskSearch(''); setTaskSearchInput(''); setTaskOffset(0) }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                    Clear
                  </button>
                )}
              </form>
            </div>
            <button
              onClick={() => { setMutationError(null); setTaskModal({ mode: 'create' }) }}
              disabled={pricingInProgress}
              title={pricingInProgress ? 'Project is locked during pricing' : undefined}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New task
            </button>
          </div>

          {tasksLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : tasks.length === 0 ? (
            <EmptyState
              title={taskSearch ? 'No matching tasks' : 'No tasks yet'}
              description={taskSearch ? 'Try a different search term.' : 'Add tasks to break this project down into trackable pieces of work.'}
              action={
                !taskSearch && !pricingInProgress && (
                  <button
                    onClick={() => { setMutationError(null); setTaskModal({ mode: 'create' }) }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    + New task
                  </button>
                )
              }
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              }
            />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-3">
                      <button
                        onClick={() => {
                          if (taskSortBy === 'name') setTaskSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                          else { setTaskSortBy('name'); setTaskSortDir('asc') }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        Task
                        {taskSortBy === 'name' && (
                          <span className="text-gray-400">{taskSortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 hidden sm:table-cell">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Offer progress</span>
                    </th>
                    {isAdmin && (
                      <th className="text-right px-6 py-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Task total</span>
                      </th>
                    )}
                    <th className="text-left px-6 py-3 hidden md:table-cell">
                      <button
                        onClick={() => {
                          if (taskSortBy === 'createdAt') setTaskSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                          else { setTaskSortBy('createdAt'); setTaskSortDir('asc') }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        Created
                        {taskSortBy === 'createdAt' && (
                          <span className="text-gray-400">{taskSortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/app/projects/${projectId}/tasks/${task.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {task.name}
                        </Link>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-sm truncate">{task.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                        {task.offerCompletionPercent != null ? (
                          <span className="font-medium text-emerald-700 tabular-nums">{Math.round(task.offerCompletionPercent)}%</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(taskTotals[task.id])}
                        </td>
                      )}
                      <td className="px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                        {task.createdAt ? formatDate(task.createdAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {(() => {
                            const taskRecipients = messageRecipientMembers(task.assigneeIds, teamMembers)
                            if (!taskRecipients.some((r) => r.email || r.phoneE164)) return null
                            return (
                            <button
                              onClick={() => {
                                setMutationError(null)
                                setEmailModal({
                                  type: 'task',
                                  taskId: task.id,
                                  taskName: task.name,
                                  recipients: taskRecipients,
                                  modalKey: Date.now(),
                                  defaultSubject: `Task: ${task.name}`,
                                  defaultBody: `Hi,\n\nRegarding task "${task.name}" in project "${project?.name ?? ''}":\n\n`,
                                })
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Message task assignees (email and/or text)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                            )
                          })()}
                          <button
                            onClick={() => { setMutationError(null); setTaskModal({ mode: 'edit', task }) }}
                            disabled={pricingInProgress}
                            title={pricingInProgress ? 'Project is locked during pricing' : undefined}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'task', item: task })}
                            disabled={pricingInProgress}
                            title={pricingInProgress ? 'Project is locked during pricing' : undefined}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination offset={taskOffset} limit={PAGE_SIZE} total={taskTotal} onPageChange={setTaskOffset} />
            </>
          )}
        </div>
      )}

      {/* Calendar tab */}
      {activeTab === 'calendar' && (
        <ProjectCalendar
          projectId={projectId}
          tasks={calendarTasksData?.tasks?.items ?? []}
          onSwitchToTasks={() => setActiveTab('tasks')}
          refetchTasks={() => { refetchTasks(); refetchCalendarTasks() }}
        />
      )}

      {/* Training data tab */}
      {isAdmin && activeTab === 'pricingRuns' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                Pricing runs <span className="text-gray-400 font-normal text-sm ml-1">({filteredPricingRuns.length}{pricingRunsSearch ? ` of ${projectPricingRuns.length}` : ''})</span>
              </h2>
              <form
                onSubmit={(e) => { e.preventDefault(); setPricingRunsSearch(pricingRunsSearchInput) }}
                className="flex gap-2 flex-1 max-w-sm"
              >
                <input
                  value={pricingRunsSearchInput}
                  onChange={(e) => setPricingRunsSearchInput(e.target.value)}
                  placeholder="Search report, tool calls, activity…"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
                <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                  Search
                </button>
                {pricingRunsSearch && (
                  <button type="button" onClick={() => { setPricingRunsSearch(''); setPricingRunsSearchInput('') }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                    Clear
                  </button>
                )}
              </form>
            </div>
            {projectPricingRuns.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteAllPricingRunsOpen(true)}
                disabled={pricingInProgress}
                title={pricingInProgress ? 'Project is locked during pricing' : undefined}
                className="flex-shrink-0 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50"
              >
                Delete all
              </button>
            )}
          </div>
          <div className="p-6">
            {pricingRunsLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : projectPricingRuns.length === 0 ? (
              <EmptyState
                title="No pricing runs yet"
                description={
                  isAdmin
                    ? 'Request pricing using the button above. Each run will be recorded here so you can see what the AI agent did.'
                    : 'An organization admin can run pricing from the project header. Completed runs will appear here.'
                }
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            ) : filteredPricingRuns.length === 0 ? (
              <EmptyState
                title="No matching runs"
                description="Try a different search term."
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredPricingRuns.map((run) => (
                  <PricingRunCard
                    key={run.id}
                    run={run}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    onDelete={(r) => setDeletePricingRunTarget(r)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'labor' && (
        <WeeklyEfficiencyPanel
          projectId={projectId}
          tenantId={tenantId}
          tasks={tasksData?.tasks?.items ?? []}
          teamMembers={teamMembers}
          active={activeTab === 'labor'}
          weekContainingDate={laborWeekDate}
          onWeekContainingDateChange={setLaborWeekDate}
          weekStartMode={laborWeekMode}
          onWeekStartModeChange={setLaborWeekMode}
          assigneeFilter={laborAssigneeFilter}
          onAssigneeFilterChange={setLaborAssigneeFilter}
          taskFilter={laborTaskFilter}
          onTaskFilterChange={setLaborTaskFilter}
        />
      )}

      {activeTab === 'emails' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col gap-4 px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                Messages <span className="text-gray-400 font-normal text-sm ml-1">({filteredEmails.length}{emailSearch ? ` of ${projectEmails.length}` : ''})</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!canMessageProjectTeam) return
                  setMutationError(null)
                  setEmailModal({
                    type: 'project',
                    recipients: projectRecipients,
                    modalKey: Date.now(),
                    defaultSubject: `Project: ${project?.name ?? 'Estimate'}`,
                    defaultBody: `Hi,\n\nRegarding project "${project?.name ?? ''}":\n\n`,
                  })
                }}
                disabled={!canMessageProjectTeam}
                title={
                  !canMessageProjectTeam
                    ? 'No reachable assignees: add people on tasks or offers, with email and/or phone on their profile'
                    : `${projectRecipients.length} assignee(s) on tasks/offers (${projectWithEmail} with email, ${projectWithPhone} with text) — choose recipients in the modal`
                }
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Message project team
              </button>
            </div>
            <p className="text-sm text-gray-500 -mt-1">
              Recipients are everyone assigned on any task or offer on this project (with email and/or phone on their profile).
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmailSearch(emailSearchInput) }}
              className="flex flex-wrap gap-2 w-full max-w-xl"
            >
              <input
                value={emailSearchInput}
                onChange={(e) => setEmailSearchInput(e.target.value)}
                placeholder="Search subject, recipients, body…"
                className="flex-1 min-w-[12rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
              <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                Search
              </button>
              {emailSearch && (
                <button type="button" onClick={() => { setEmailSearch(''); setEmailSearchInput('') }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Clear
                </button>
              )}
            </form>
          </div>
          <div className="p-6">
            {projectEmails.length === 0 ? (
              <EmptyState
                title="No messages sent yet"
                description="Use the Message project team button above when people are assigned on tasks or offers (with email and/or phone on their profile). Sent email and text appear below."
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            ) : filteredEmails.length === 0 ? (
              <EmptyState
                title="No matching messages"
                description="Try a different search term."
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredEmails.map((e) => (
                  <ProjectMessageHistoryItem key={e.id} email={e} formatDate={formatDate} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pdfs' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Project PDFs</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                PDFs uploaded for this project appear below as they are processed. Download or delete a file anytime—deleting an upload does not remove tasks or offers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={pdfImportInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfImportChange}
              />
              {canExportForClient && (
                <button
                  type="button"
                  onClick={() => setExportPdfConfirmOpen(true)}
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 px-3 py-2 rounded-xl disabled:opacity-50"
                >
                  {exportingPdf ? <Spinner size="sm" /> : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Export for Client
                </button>
              )}
              <button
                type="button"
                onClick={() => pdfImportInputRef.current?.click()}
                disabled={pdfImportBusy || !tenantId}
                title="Add tasks and offers from an estimate PDF into this project"
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl disabled:opacity-50"
              >
                {pdfImportBusy ? <Spinner size="sm" /> : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                )}
                Build Project from PDF
              </button>
            </div>
          </div>
          <div className="p-6">
            {projectPdfsError && (
              <div className="mb-4">
                <Alert message={projectPdfsError} onDismiss={() => setProjectPdfsError(null)} />
              </div>
            )}
            {projectPdfsLoading && projectPdfs.length === 0 ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : projectPdfs.length === 0 ? (
              <EmptyState
                title="No PDFs for this project yet"
                description="Use Build Project from PDF above to import an estimate into this project. Uploads appear here when processing completes—you can download or delete each file."
                icon={
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Uploaded</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Size</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projectPdfs.map((upload) => {
                      const statusInfo = PDF_STATUS_LABELS[upload.status] ?? { label: upload.status ?? 'Unknown', color: 'bg-gray-100 text-gray-700' }
                      const isSource = sourcePdfUploadId && upload.id === sourcePdfUploadId
                      return (
                        <tr key={upload.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 truncate max-w-[220px]" title={upload.fileName}>
                              {upload.fileName || 'Unknown file'}
                            </div>
                            {isSource && (
                              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                Source PDF
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusInfo.color}`}>
                              {upload.status === 'PROCESSING' && <Spinner size="sm" className="mr-1" />}
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                            {formatDateTime(upload.uploadedAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                            {formatBytes(upload.fileSizeBytes)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleDownloadProjectPdfRow(upload)}
                                disabled={downloadingPdfId === upload.id}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                              >
                                {downloadingPdfId === upload.id ? <Spinner size="sm" /> : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                )}
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteProjectPdfTarget(upload)}
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
            )}
          </div>
        </div>
      )}

      {isAdmin && activeTab === 'training' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Custom Training Data <span className="text-gray-400 font-normal text-sm ml-1">({trainingTotal})</span>
            </h2>
            <button
              onClick={() => { setMutationError(null); setTrainingModal({ mode: 'create' }) }}
              disabled={pricingInProgress}
              title={pricingInProgress ? 'Project is locked during pricing' : undefined}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add data
            </button>
          </div>

          {trainingLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : trainings.length === 0 ? (
            <EmptyState
              title="No project-specific data"
              description="This project uses your global training data from AI Training. Add project data here to override specific values (e.g. higher wood cost for this project only)."
              action={
                !pricingInProgress && (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => { setMutationError(null); setTrainingModal({ mode: 'create' }) }}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      + Add project data
                    </button>
                    {!hasTenantTraining && (
                      <Link
                        to="/app/training"
                        className="text-xs text-gray-500 hover:text-indigo-600"
                      >
                        Set up global data first →
                      </Link>
                    )}
                  </div>
                )
              }
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              }
            />
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {trainings.map((entry) => (
                  <div key={entry.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {entry.description && (
                          <p className="text-sm font-medium text-gray-800 mb-1">{entry.description}</p>
                        )}
                        {entry.entries?.length ? (
                          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 space-y-1.5">
                            {entry.entries.slice(0, 3).map((e, i) => (
                              <div key={i} className="line-clamp-2 break-words">
                                <span className="text-gray-800">{e.key}</span>
                                <span className="text-gray-400 mx-1">·</span>
                                <span className="font-mono text-gray-600 tabular-nums">{e.value}</span>
                              </div>
                            ))}
                            {entry.entries.length > 3 && <div className="text-gray-300">+{entry.entries.length - 3} more</div>}
                          </div>
                        ) : null}
                        <p className="text-xs text-gray-300 mt-1.5">
                          Added {entry.createdAt ? formatDate(entry.createdAt) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setMutationError(null); setTrainingModal({ mode: 'edit', entry }) }}
                          disabled={pricingInProgress}
                          title={pricingInProgress ? 'Project is locked during pricing' : undefined}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'training', item: entry })}
                          disabled={pricingInProgress}
                          title={pricingInProgress ? 'Project is locked during pricing' : undefined}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination offset={trainingOffset} limit={PAGE_SIZE} total={trainingTotal} onPageChange={setTrainingOffset} />
            </>
          )}
        </div>
      )}

      {/* Project edit modal */}
      <Modal open={projectModal} onClose={() => setProjectModal(false)} title="Edit project">
        {projectModal && project && (
          <ProjectForm
            key={project.id}
            initial={{ ...project, status: displayStatus }}
            suggestedStatuses={suggestedStatuses}
            teamMembers={teamMembers}
            isAdmin={user?.role === 'ADMIN'}
            onSubmit={(input) => updateProject({ variables: { id: project.id, tenantId, input } })}
            loading={updatingProject}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Task modals */}
      <Modal
        open={!!taskModal}
        onClose={() => setTaskModal(null)}
        title={taskModal?.mode === 'create' ? 'New task' : 'Edit task'}
        maxWidth="max-w-xl"
      >
        {taskModal && (
          <TaskForm
            initial={taskModal.task}
            teamMembers={teamMembers}
            offers={taskModalOffers}
            onSubmit={
              taskModal.mode === 'create'
                ? (input) => createTask({ variables: { input: { ...input, projectId, tenantId } } })
                : (input) => updateTask({ variables: { id: taskModal.task.id, projectId, tenantId, input } })
            }
            loading={creatingTask || updatingTask}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Training modal */}
      <Modal
        open={!!trainingModal && isAdmin}
        onClose={() => setTrainingModal(null)}
        title={trainingModal?.mode === 'create' ? 'Add training data' : 'Edit training data'}
        maxWidth="max-w-2xl"
      >
        {trainingModal && (
          <TrainingDataForm
            key={trainingModal.mode === 'edit' ? trainingModal.entry.id : 'create'}
            initial={trainingModal.entry}
            scopeLabel="project training data"
            onSubmit={
              trainingModal.mode === 'create'
                ? (input) =>
                    createTraining({
                      variables: {
                        input: {
                          tenantId,
                          projectId,
                          entries: input.entries ?? [],
                          pricingFacts: input.pricingFacts ?? [],
                          description: input.description,
                        },
                      },
                    })
                : (input) =>
                    updateTraining({
                      variables: {
                        id: trainingModal.entry.id,
                        tenantId,
                        input: {
                          entries: input.entries ?? [],
                          pricingFacts: input.pricingFacts ?? [],
                          description: input.description,
                        },
                      },
                    })
            }
            loading={creatingTraining || updatingTraining}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Email compose modal */}
      <EmailComposeModal
        key={emailModal?.modalKey ?? 'closed'}
        open={!!emailModal}
        onClose={() => { setEmailModal(null); setMutationError(null) }}
        recipients={emailModal?.recipients ?? []}
        defaultSubject={emailModal?.defaultSubject ?? ''}
        defaultBody={emailModal?.defaultBody ?? ''}
        sending={sendingEmail}
        error={mutationError}
        onSend={({ subject, body, sendEmail, sendSms, toEmails, toPhoneNumbers }) => {
          setMutationError(null)
          sendProjectEmail({
            variables: {
              input: {
                tenantId,
                projectId,
                taskId: emailModal?.taskId ?? null,
                senderId: user?.id,
                toEmails: sendEmail ? toEmails : [],
                toPhoneNumbers: sendSms ? toPhoneNumbers : [],
                sendEmail,
                sendSms,
                subject: sendEmail ? subject : null,
                body,
              },
            },
          })
        }}
      />

      {/* Delete pricing run confirm */}
      <ConfirmDialog
        open={!!deletePricingRunTarget && isAdmin}
        onClose={() => setDeletePricingRunTarget(null)}
        loading={deletingPricingRun}
        title="Delete pricing run?"
        message="This will permanently remove this run report. The project offers will not be affected."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletePricingRunTarget) {
            deletePricingRun({ variables: { id: deletePricingRunTarget.id, projectId, tenantId } })
          }
        }}
      />

      <ConfirmDialog
        open={deleteAllPricingRunsOpen && isAdmin}
        onClose={() => setDeleteAllPricingRunsOpen(false)}
        loading={deletingAllPricingRuns}
        title="Delete all pricing runs?"
        message={`This will permanently remove all ${projectPricingRuns.length} pricing run record${projectPricingRuns.length !== 1 ? 's' : ''} for this project. Your offers and prices will not be changed.`}
        confirmLabel="Delete all"
        onConfirm={() => {
          deleteAllPricingRuns({ variables: { projectId, tenantId } })
        }}
      />

      {/* Pricing confirm */}
      <ConfirmDialog
        open={pricingConfirmOpen && isAdmin}
        onClose={() => setPricingConfirmOpen(false)}
        loading={pricingLoading}
        title="Request pricing?"
        message="The AI agent will analyze your project and update offers with pricing. This may take a few minutes and will modify the project. Proceed?"
        confirmLabel="Request pricing"
        variant="neutral"
        onConfirm={async () => {
          await handleRequestPricing()
          setPricingConfirmOpen(false)
        }}
      />

      <ConfirmDialog
        open={exportPdfConfirmOpen && canExportForClient}
        onClose={() => setExportPdfConfirmOpen(false)}
        loading={exportingPdf}
        title="Export for client?"
        message="A client-ready PDF of this project will be generated and downloaded to your device. Continue?"
        confirmLabel="Download PDF"
        variant="neutral"
        onConfirm={async () => {
          await handleExportProjectPdf()
          setExportPdfConfirmOpen(false)
        }}
      />

      <ConfirmDialog
        open={!!deleteProjectPdfTarget}
        onClose={() => setDeleteProjectPdfTarget(null)}
        loading={deletingProjectPdf}
        title="Delete PDF upload?"
        message={
          deleteProjectPdfTarget
            ? `Remove "${deleteProjectPdfTarget.fileName || 'this upload'}" from this project? The stored file and upload record will be deleted. Tasks and offers are not removed.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDeleteProjectPdf}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deletingProject || deletingTask || deletingTraining}
        title={`Delete ${deleteTarget?.type}`}
        message={`Are you sure you want to delete "${deleteTarget?.item?.name || deleteTarget?.item?.description || 'this entry'}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteTarget.type === 'project') deleteProject({ variables: { id: deleteTarget.item.id, tenantId } })
          else if (deleteTarget.type === 'task') deleteTask({ variables: { id: deleteTarget.item.id, projectId, tenantId } })
          else if (deleteTarget.type === 'training') deleteTraining({ variables: { id: deleteTarget.item.id, tenantId } })
        }}
      />

      {/* Pricing result modal */}
      <Modal
        open={pricingModal}
        onClose={() => setPricingModal(false)}
        title="Pricing complete"
        maxWidth="max-w-3xl"
      >
        {pricingResult && (
          <div className="space-y-4">
            {pricingResult.agent_report && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 max-h-96 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Agent report</p>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">{pricingResult.agent_report}</pre>
              </div>
            )}
            {pricingResult.tool_calls_made != null && (
              <p className="text-xs text-gray-500">
                {pricingResult.tool_calls_made} tool call{pricingResult.tool_calls_made !== 1 ? 's' : ''} executed
              </p>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPricingModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
