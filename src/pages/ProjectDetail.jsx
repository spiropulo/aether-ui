import { useState, useEffect } from 'react'
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
  GET_OFFERS_BY_PROJECT,
  GET_PROJECT_EMAILS,
  SEND_PROJECT_EMAIL,
} from '../api/projects'
import { GET_USER_PROFILES } from '../api/users'
import AssigneeSelector from '../components/ui/AssigneeSelector'
import { downloadPdf, requestProjectPricing, exportProjectPdf } from '../api/estimate'
import EmailComposeModal from '../components/EmailComposeModal'
import {
  GET_TENANT_TRAINING,
  GET_PROJECT_TRAINING,
  CREATE_PROJECT_TRAINING,
  UPDATE_TRAINING,
  DELETE_TRAINING,
} from '../api/training'
import { GET_TENANT_SELECTED_PRETRAIN } from '../api/pretrain'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import Alert from '../components/ui/Alert'

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

function offerAmount(offer) {
  if (offer.total != null && !Number.isNaN(offer.total)) return offer.total
  const q = offer.quantity ?? 0
  const c = offer.unitCost ?? 0
  return q * c
}

const CALENDAR_COLORS = [
  { value: '#6366F1', label: 'Indigo' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Emerald' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Teal' },
]

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  return { startPad: first.getDay(), days: last.getDate() }
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
          Assign start and end dates to tasks in the Tasks tab to see them here.
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
function ProjectForm({ initial, suggestedStatuses = [], onSubmit, loading, error }) {
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
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
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
    })
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
        <input
          name="status"
          type="text"
          value={form.status}
          onChange={handleChange}
          placeholder="e.g. Active, On Hold"
          list={suggestedStatuses.length ? 'project-status-suggestions-detail' : undefined}
          className={inputClass}
        />
        {suggestedStatuses.length > 0 && (
          <datalist id="project-status-suggestions-detail">
            {suggestedStatuses.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
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
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          Save changes
        </button>
      </div>
    </form>
  )
}

// ─── Task form ────────────────────────────────────────────────────────────────
function TaskForm({ initial, onSubmit, loading, error, teamMembers }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    assigneeIds: initial?.assigneeIds ?? [],
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
      assigneeIds: form.assigneeIds?.length ? form.assigneeIds : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      calendarColor: form.calendarColor || null,
    })
  }
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
          <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Calendar color</label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {CALENDAR_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, calendarColor: c.value }))}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                form.calendarColor === c.value ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-300'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
              aria-label={c.label}
            />
          ))}
        </div>
      </div>
      {teamMembers && (
        <AssigneeSelector
          teamMembers={teamMembers}
          value={form.assigneeIds}
          onChange={(ids) => setForm((p) => ({ ...p, assigneeIds: ids }))}
        />
      )}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  )
}

// ─── Training data form ───────────────────────────────────────────────────────
function TrainingForm({ initial, onSubmit, loading, error }) {
  const initialEntries = initial?.entries?.length ? initial.entries : [{ key: '', value: '' }]
  const [form, setForm] = useState({
    description: initial?.description ?? '',
    entries: initialEntries.map((e) => ({ key: e.key ?? '', value: e.value ?? '' })),
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleEntryChange = (idx, field, val) => {
    setForm((p) => ({
      ...p,
      entries: p.entries.map((e, i) => (i === idx ? { ...e, [field]: val } : e)),
    }))
  }
  const addEntry = () => setForm((p) => ({ ...p, entries: [...p.entries, { key: '', value: '' }] }))
  const removeEntry = (idx) =>
    setForm((p) => ({ ...p, entries: p.entries.filter((_, i) => i !== idx).length ? p.entries.filter((_, i) => i !== idx) : [{ key: '', value: '' }] }))
  const handleSubmit = (e) => {
    e.preventDefault()
    const entries = form.entries.filter((x) => (x.key ?? '').trim()).map((x) => ({ key: x.key.trim(), value: (x.value ?? '').trim() }))
    if (!entries.length) return
    onSubmit({ description: form.description.trim() || null, entries })
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Label / description</label>
        <input name="description" value={form.description} onChange={handleChange} placeholder="What is this training data about?" className={inputClass} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">Key-value pairs *</label>
          <button type="button" onClick={addEntry} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
            + Add pair
          </button>
        </div>
        <div className="space-y-2">
          {form.entries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input value={entry.key} onChange={(e) => handleEntryChange(idx, 'key', e.target.value)} placeholder="Key" className={`${inputClass} flex-1`} />
              <input value={entry.value} onChange={(e) => handleEntryChange(idx, 'value', e.target.value)} placeholder="Value" className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => removeEntry(idx)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Remove">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Add training data'}
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
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingResult, setPricingResult] = useState(null)
  const [pricingModal, setPricingModal] = useState(false)
  const [sourcePdfBannerHidden, setSourcePdfBannerHidden] = useState(false)
  const [emailModal, setEmailModal] = useState(null) // { type: 'project'|'task', taskId?, taskName?, toEmails }
  const [emailSearch, setEmailSearch] = useState('')
  const [emailSearchInput, setEmailSearchInput] = useState('')

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
    if (!projectId || typeof window === 'undefined') return
    setSourcePdfBannerHidden(localStorage.getItem(`aether_hide_source_pdf_${projectId}`) === 'true')
  }, [projectId])

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
  })

  // Check if training data is configured (required for Request Pricing)
  const { data: tenantTrainingCheck } = useQuery(GET_TENANT_TRAINING, {
    variables: { tenantId, page: { limit: 1, offset: 0 } },
    skip: !tenantId,
  })
  const { data: tenantPretrainCheck } = useQuery(GET_TENANT_SELECTED_PRETRAIN, {
    variables: { tenantId },
    skip: !tenantId,
  })
  const { data: projectTrainingCheck } = useQuery(GET_PROJECT_TRAINING, {
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
  const teamMembers = teamData?.userProfiles?.items ?? []
  const projectEmails = emailsData?.projectEmails ?? []
  const emailSearchLower = emailSearch.trim().toLowerCase()
  const filteredEmails = emailSearchLower
    ? projectEmails.filter((e) => {
        const subject = (e.subject ?? '').toLowerCase()
        const body = (e.body ?? '').toLowerCase()
        const toStr = (e.toEmails ?? []).join(' ').toLowerCase()
        return subject.includes(emailSearchLower) || body.includes(emailSearchLower) || toStr.includes(emailSearchLower)
      })
    : projectEmails

  const hasTenantTraining = (tenantTrainingCheck?.tenantTrainingData?.total ?? 0) > 0
  const hasTenantCatalog = (tenantPretrainCheck?.tenantSelectedPretrainData?.length ?? 0) > 0
  const hasProjectTraining = (projectTrainingCheck?.projectTrainingData?.total ?? 0) > 0
  const hasTrainingData = hasTenantTraining || hasTenantCatalog || hasProjectTraining

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
    onCompleted: () => { setDeleteTarget(null); refetchTasks() },
    onError: (e) => setMutationError(e.message),
  })

  const [createTraining, { loading: creatingTraining }] = useMutation(CREATE_PROJECT_TRAINING, {
    onCompleted: () => { setTrainingModal(null); refetchTraining() },
    onError: (e) => setMutationError(e.message),
  })

  const [updateTraining, { loading: updatingTraining }] = useMutation(UPDATE_TRAINING, {
    onCompleted: () => { setTrainingModal(null); refetchTraining() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteTraining, { loading: deletingTraining }] = useMutation(DELETE_TRAINING, {
    onCompleted: () => { setDeleteTarget(null); refetchTraining() },
    onError: (e) => setMutationError(e.message),
  })

  const [sendProjectEmail, { loading: sendingEmail }] = useMutation(SEND_PROJECT_EMAIL, {
    onCompleted: () => { setEmailModal(null); refetchEmails() },
    onError: (e) => setMutationError(e.message),
  })

  const project = projectData?.project
  const displayStatus = statusPollData?.project?.status ?? project?.status
  const sourcePdfUploadId = statusPollData?.project?.sourcePdfUploadId ?? project?.sourcePdfUploadId
  const hasAddress = (project?.addressLine1?.trim?.()?.length > 0) ||
    (project?.city?.trim?.()?.length > 0 && project?.country?.trim?.()?.length > 0)
  const pricingInProgress = displayStatus === 'PRICING' || pricingLoading

  const handleRequestPricing = async () => {
    if (!tenantId || !projectId) return
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
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('address')) {
        setMutationError(
          'Set the project address before requesting pricing. Edit the project and add at least street address or city + country.'
        )
      } else if (msg.toLowerCase().includes('training data')) {
        setMutationError(
          'Configure tenant or project training data first. Add custom data or AI Catalog selections in AI Training, or add project-specific training in the Custom Training Data tab below.'
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

  const handleDownloadSourcePdf = async () => {
    if (!sourcePdfUploadId || !tenantId) return
    setDownloadingPdf(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const blob = await downloadPdf(sourcePdfUploadId, tenantId, { token })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${project?.name || 'estimate'}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_')
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setMutationError(err.message)
    } finally {
      setDownloadingPdf(false)
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
          <span className="text-amber-700 text-sm">Task by task, offer by offer. The project is locked until pricing completes. This may take a few minutes.</span>
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
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {(() => {
                const allTasks = calendarTasksData?.tasks?.items ?? tasksData?.tasks?.items ?? []
                const assigneeIds = [...new Set(allTasks.flatMap((t) => t.assigneeIds ?? []))]
                const projectAssigneeEmails = assigneeIds
                  .map((id) => teamMembers.find((m) => m.id === id)?.email)
                  .filter(Boolean)
                return (
                  <button
                    onClick={() => {
                      if (projectAssigneeEmails.length === 0) return
                      setEmailModal({
                        type: 'project',
                        toEmails: projectAssigneeEmails,
                        defaultSubject: `Project: ${project?.name ?? 'Estimate'}`,
                        defaultBody: `Hi,\n\nRegarding project "${project?.name ?? ''}":\n\n`,
                      })
                    }}
                    disabled={projectAssigneeEmails.length === 0}
                    title={projectAssigneeEmails.length === 0 ? 'No assignees on project tasks' : `Email ${projectAssigneeEmails.length} assignee(s)`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email project assignees
                  </button>
                )
              })()}
              <button
                onClick={handleExportProjectPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 disabled:opacity-50"
              >
                {exportingPdf ? (
                  <Spinner size="sm" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Export project PDF
              </button>
              {sourcePdfUploadId && sourcePdfBannerHidden && (
                <button
                  type="button"
                  onClick={() => {
                    setSourcePdfBannerHidden(false)
                    localStorage.removeItem(`aether_hide_source_pdf_${projectId}`)
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Source PDF
                </button>
              )}
            </div>
            {sourcePdfUploadId && !sourcePdfBannerHidden && (
                <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSourcePdfBannerHidden(true)
                      localStorage.setItem(`aether_hide_source_pdf_${projectId}`, 'true')
                    }}
                    className="absolute top-2 right-2 p-1 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100/80 transition-colors"
                    title="Hide"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="text-sm font-medium text-indigo-900 pr-8">Source PDF</p>
                  <p className="text-xs text-indigo-700 mt-0.5">This project was created from an uploaded PDF estimate.</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <button
                      onClick={handleDownloadSourcePdf}
                      disabled={downloadingPdf}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 disabled:opacity-50"
                    >
                      {downloadingPdf ? (
                        <Spinner size="sm" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      Download source PDF
                    </button>
                    <Link
                      to="/app/pdf-uploads"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-800"
                    >
                      View training & agent activity
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <div className="flex flex-col items-end gap-1">
              {(!hasTrainingData || !hasAddress) && !pricingInProgress && (
                <p className="text-xs text-amber-700">
                  {!hasTrainingData && (
                    <>Add <Link to="/app/training" className="hover:underline font-medium">tenant training</Link>
                    {' or '}
                    <button type="button" onClick={() => setActiveTab('training')} className="hover:underline font-medium">
                      project training
                    </button>
                    {' to enable pricing'}
                    {!hasAddress && ' • '}
                    </>)}
                  {!hasAddress && (
                    <>Set project <button type="button" onClick={() => { setMutationError(null); setProjectModal(true) }} className="hover:underline font-medium">address</button> before pricing</>
                  )}
                </p>
              )}
              <button
                onClick={handleRequestPricing}
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
      <div className="mb-6 p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Project total</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(projectTotal)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'tasks', label: 'Tasks' },
          { key: 'calendar', label: 'Calendar' },
          { key: 'training', label: 'Custom Training Data' },
          { key: 'emails', label: 'Emails' },
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
                    <th className="text-right px-6 py-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Task total</span>
                    </th>
                    <th className="text-left px-6 py-3 hidden md:table-cell">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignees</span>
                    </th>
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
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(taskTotals[task.id])}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 hidden md:table-cell max-w-32 truncate">
                        {task.assigneeIds?.length
                          ? task.assigneeIds
                              .map((id) => teamMembers.find((m) => m.id === id)?.displayName || teamMembers.find((m) => m.id === id)?.username || id)
                              .join(', ') || '—'
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                        {task.createdAt ? formatDate(task.createdAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {(task.assigneeIds?.length ?? 0) > 0 && (
                            <button
                              onClick={() => {
                                const toEmails = (task.assigneeIds ?? [])
                                  .map((id) => teamMembers.find((m) => m.id === id)?.email)
                                  .filter(Boolean)
                                if (toEmails.length > 0) {
                                  setEmailModal({
                                    type: 'task',
                                    taskId: task.id,
                                    taskName: task.name,
                                    toEmails,
                                    defaultSubject: `Task: ${task.name}`,
                                    defaultBody: `Hi,\n\nRegarding task "${task.name}" in project "${project?.name ?? ''}":\n\n`,
                                  })
                                }
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Email task assignees"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
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
      {activeTab === 'emails' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                Email history <span className="text-gray-400 font-normal text-sm ml-1">({filteredEmails.length}{emailSearch ? ` of ${projectEmails.length}` : ''})</span>
              </h2>
              <form
                onSubmit={(e) => { e.preventDefault(); setEmailSearch(emailSearchInput) }}
                className="flex gap-2 flex-1 max-w-sm"
              >
                <input
                  value={emailSearchInput}
                  onChange={(e) => setEmailSearchInput(e.target.value)}
                  placeholder="Search subject, recipients, body…"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
          </div>
          <div className="p-6">
            {projectEmails.length === 0 ? (
              <EmptyState
                title="No emails sent yet"
                description="Use the &quot;Email project assignees&quot; button above to send an email. All emails sent for this project will appear here."
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            ) : filteredEmails.length === 0 ? (
              <EmptyState
                title="No matching emails"
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
                  <div key={e.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{e.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          To: {e.toEmails?.join(', ')}
                          {e.taskId && (
                            <span className="ml-2 text-indigo-600">(task assignees)</span>
                          )}
                        </p>
                        {e.body && (
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap line-clamp-3">{e.body}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {e.sentAt ? formatDate(e.sentAt) : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'training' && (
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
              title="No training data"
              description="Add project-specific training data to improve AI estimates for this project."
              action={
                !pricingInProgress && (
                  <button
                    onClick={() => { setMutationError(null); setTrainingModal({ mode: 'create' }) }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    + Add training data
                  </button>
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
                          <div className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg p-2 space-y-1">
                            {entry.entries.slice(0, 3).map((e, i) => (
                              <div key={i} className="line-clamp-1">{e.key}: {e.value}</div>
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
        <ProjectForm
          initial={{ ...project, status: displayStatus }}
          suggestedStatuses={suggestedStatuses}
          onSubmit={(input) => updateProject({ variables: { id: project.id, tenantId, input } })}
          loading={updatingProject}
          error={mutationError}
        />
      </Modal>

      {/* Task modals */}
      <Modal
        open={!!taskModal}
        onClose={() => setTaskModal(null)}
        title={taskModal?.mode === 'create' ? 'New task' : 'Edit task'}
      >
        {taskModal && (
          <TaskForm
            initial={taskModal.task}
            teamMembers={teamMembers}
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
        open={!!trainingModal}
        onClose={() => setTrainingModal(null)}
        title={trainingModal?.mode === 'create' ? 'Add training data' : 'Edit training data'}
        maxWidth="max-w-2xl"
      >
        {trainingModal && (
          <TrainingForm
            initial={trainingModal.entry}
            onSubmit={
              trainingModal.mode === 'create'
                ? (input) => createTraining({ variables: { input: { tenantId, projectId, entries: input.entries, description: input.description } } })
                : (input) => updateTraining({ variables: { id: trainingModal.entry.id, tenantId, input: { entries: input.entries, description: input.description } } })
            }
            loading={creatingTraining || updatingTraining}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Email compose modal */}
      <EmailComposeModal
        open={!!emailModal}
        onClose={() => { setEmailModal(null); setMutationError(null) }}
        toEmails={emailModal?.toEmails ?? []}
        defaultSubject={emailModal?.defaultSubject ?? ''}
        defaultBody={emailModal?.defaultBody ?? ''}
        sending={sendingEmail}
        error={mutationError}
        onSend={({ subject, body }) => {
          setMutationError(null)
          sendProjectEmail({
            variables: {
              input: {
                tenantId,
                projectId,
                taskId: emailModal?.taskId ?? null,
                senderId: user?.id,
                toEmails: emailModal?.toEmails ?? [],
                subject,
                body,
              },
            },
          })
        }}
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
