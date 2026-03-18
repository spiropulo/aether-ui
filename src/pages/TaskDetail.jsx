import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_PROJECT,
  GET_TASK,
  UPDATE_TASK,
  GET_OFFERS,
  GET_OFFERS_BY_PROJECT,
  CREATE_OFFER,
  UPDATE_OFFER,
  DELETE_OFFER,
  SEND_PROJECT_EMAIL,
} from '../api/projects'
import { GET_USER_PROFILES } from '../api/users'
import AssigneeSelector from '../components/ui/AssigneeSelector'
import EmailComposeModal from '../components/EmailComposeModal'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

const UOM_OPTIONS = ['Each', 'kg', 'Hour', 'Day', 'Week', 'Month', 'Lot', 'LF', 'SF', 'CY']

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

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  return { startPad: first.getDay(), days: last.getDate() }
}

/** Parse YYYY-MM-DD (or YYYY-MM-DDTHH:mm:ss) as local date to avoid timezone shifts */
function parseDateOnly(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).split('T')[0]
  const parts = s.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

// ─── Task calendar (single task) ───────────────────────────────────────────────
function TaskCalendar({ task, onUpdate, updating }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    if (task?.startDate) {
      const start = parseDateOnly(task.startDate)
      if (start) return { year: start.getFullYear(), month: start.getMonth() }
    }
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const hasDates = task?.startDate || task?.endDate
  const { startPad, days } = getDaysInMonth(viewDate.year, viewDate.month)
  const monthName = new Date(viewDate.year, viewDate.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const color = task?.calendarColor || '#6366F1'

  const isTaskOnDay = (d) => {
    if (!hasDates) return false
    const cell = new Date(viewDate.year, viewDate.month, d)
    cell.setHours(0, 0, 0, 0)
    const start = parseDateOnly(task.startDate)
    const end = task.endDate ? parseDateOnly(task.endDate) : null
    const endDay = end ? new Date(end) : null
    if (endDay) endDay.setHours(23, 59, 59, 999)
    if (start && cell < start) return false
    if (endDay && cell > endDay) return false
    return true
  }

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleDateChange = (field, value) => {
    if (!onUpdate) return
    if (field === 'startDate') {
      onUpdate({ startDate: value || null, endDate: task?.endDate || null })
    } else {
      onUpdate({ startDate: task?.startDate || null, endDate: value || null })
    }
  }

  const handleColorChange = (value) => {
    if (!onUpdate) return
    onUpdate({ calendarColor: value })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Task timeline</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">{monthName}</span>
          <button
            onClick={() => setViewDate((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-4">
        {onUpdate && (
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500">Start</label>
              <input
                type="date"
                value={task?.startDate ?? ''}
                onChange={(e) => handleDateChange('startDate', e.target.value || null)}
                disabled={updating}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500">End</label>
              <input
                type="date"
                value={task?.endDate ?? ''}
                onChange={(e) => handleDateChange('endDate', e.target.value || null)}
                disabled={updating}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Color</span>
              <div className="flex gap-1">
                {CALENDAR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleColorChange(c.value)}
                    disabled={updating}
                    className={`w-6 h-6 rounded-md border-2 transition-all disabled:opacity-50 ${
                      (task?.calendarColor || CALENDAR_COLORS[0].value) === c.value ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>
            {updating && <Spinner size="sm" />}
          </div>
        )}
        {hasDates ? (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {task.startDate ? formatDate(task.startDate) : '?'} — {task.endDate ? formatDate(task.endDate) : '?'}
            </p>
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {dayHeaders.map((h) => (
                <div key={h} className="bg-gray-50 px-1 py-1.5 text-center text-xs font-semibold text-gray-500 uppercase">
                  {h}
                </div>
              ))}
              {Array.from({ length: startPad }, (_, i) => (
                <div key={`pad-${i}`} className="bg-gray-50 min-h-[48px] p-1" />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const d = i + 1
                const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const highlighted = isTaskOnDay(d)
                const isToday = dateStr === todayStr
                return (
                  <div
                    key={d}
                    className={`min-h-[48px] p-1 flex items-center justify-center text-sm ${
                      isToday ? 'ring-2 ring-indigo-400 ring-inset rounded' : ''
                    } ${highlighted ? 'font-semibold' : 'text-gray-400'}`}
                    style={highlighted ? { backgroundColor: `${color}25`, color } : { backgroundColor: 'white' }}
                  >
                    {d}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 py-4">
            {onUpdate ? 'Set start and end dates above to display on the calendar.' : 'No dates assigned. Edit the task to add start and end dates for the calendar.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Offer form ───────────────────────────────────────────────────────────────
function OfferForm({ initial, onSubmit, loading, error, teamMembers }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    uom: initial?.uom ?? '',
    quantity: initial?.quantity ?? '',
    unitCost: initial?.unitCost ?? '',
    duration: initial?.duration ?? '',
    assigneeIds: initial?.assigneeIds ?? [],
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const qty = form.quantity !== '' ? parseFloat(form.quantity) : null
  const cost = form.unitCost !== '' ? parseFloat(form.unitCost) : null
  const previewTotal = qty != null && cost != null ? qty * cost : null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      uom: form.uom.trim() || null,
      quantity: form.quantity !== '' ? parseFloat(form.quantity) : null,
      unitCost: form.unitCost !== '' ? parseFloat(form.unitCost) : null,
      duration: form.duration.trim() || null,
      assigneeIds: form.assigneeIds?.length ? form.assigneeIds : null,
    })
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input name="name" required value={form.name} onChange={handleChange} placeholder="e.g. Industrial Drill or Consulting" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Detailed specs or scope of work…" className={`${inputClass} resize-y min-h-[100px]`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit of Measure</label>
        <input name="uom" list="uom-list" value={form.uom} onChange={handleChange} placeholder="e.g. Each, kg, Hour, Day" className={inputClass} />
        <datalist id="uom-list">
          {UOM_OPTIONS.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
          <input name="quantity" type="number" step="0.01" min="0" value={form.quantity} onChange={handleChange} placeholder="1" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit cost ($)</label>
          <input name="unitCost" type="number" step="0.01" min="0" value={form.unitCost} onChange={handleChange} placeholder="0.00" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (optional)</label>
        <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3 Months or 2 Weeks" className={inputClass} />
      </div>
      {teamMembers && (
        <AssigneeSelector
          teamMembers={teamMembers}
          value={form.assigneeIds}
          onChange={(ids) => setForm((p) => ({ ...p, assigneeIds: ids }))}
        />
      )}
      {previewTotal != null && (
        <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-2.5 text-sm">
          <span className="text-indigo-600 font-medium">Line total</span>
          <span className="font-bold text-indigo-700">{formatCurrency(previewTotal)}</span>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Add offer'}
        </button>
      </div>
    </form>
  )
}

// ─── Description edit form (offer) ───────────────────────────────────────────
function DescriptionEditForm({ offer, onSubmit, onClose, loading, error }) {
  const [value, setValue] = useState(offer?.description ?? '')
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(value.trim() || null)
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          placeholder="Detailed specs or scope of work…"
          className={`${inputClass} resize-y min-h-[200px]`}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60"
        >
          {loading && <Spinner size="sm" />}
          Save
        </button>
      </div>
    </form>
  )
}

// ─── Task edit form ───────────────────────────────────────────────────────────
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
          Save changes
        </button>
      </div>
    </form>
  )
}

// ─── Section table ────────────────────────────────────────────────────────────
function SectionTable({ headers, rows, onEdit, onDelete, emptyTitle, emptyDesc, onAdd, disabled }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDesc}
        action={
          !disabled && onAdd ? (
            <button onClick={onAdd} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              + Add
            </button>
          ) : null
        }
      />
    )
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          {headers.map((h) => (
            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-6 last:pr-6">
              {h}
            </th>
          ))}
          <th className="px-4 py-3 last:pr-6" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
            {row.cells.map((cell, i) => (
              <td key={i} className="px-4 py-3.5 first:pl-6 last:pr-6 text-gray-700 text-sm">
                {cell}
              </td>
            ))}
            <td className="px-4 py-3.5 last:pr-6">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => !disabled && onEdit(row.original)} disabled={disabled} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
                <button onClick={() => !disabled && onDelete(row.original)} disabled={disabled} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
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
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TaskDetail() {
  const { projectId, taskId } = useParams()
  const { user } = useAuth()
  const tenantId = user?.tenantId

  const [taskModal, setTaskModal] = useState(false)
  const [offerModal, setOfferModal] = useState(null)
  const [emailModal, setEmailModal] = useState(null) // { toEmails } when open
  const [descriptionEditTarget, setDescriptionEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutationError, setMutationError] = useState(null)
  const [assigneesExpanded, setAssigneesExpanded] = useState(false)

  const { data: projectData } = useQuery(GET_PROJECT, { variables: { id: projectId, tenantId }, skip: !tenantId })
  const { data: teamData } = useQuery(GET_USER_PROFILES, {
    variables: { tenantId, page: { limit: 100, offset: 0 } },
    skip: !tenantId,
  })
  const teamMembers = teamData?.userProfiles?.items ?? []
  const { data: taskData, loading: taskLoading, refetch: refetchTask } = useQuery(GET_TASK, {
    variables: { id: taskId, projectId, tenantId },
    skip: !tenantId,
  })
  const { data: offersData, loading: offersLoading, refetch: refetchOffers } = useQuery(GET_OFFERS, {
    variables: { projectId, taskId, tenantId, page: { limit: 100, offset: 0 } },
    skip: !tenantId,
  })

  const [updateTask, { loading: updatingTask }] = useMutation(UPDATE_TASK, {
    onCompleted: () => { setTaskModal(false); refetchTask() },
    onError: (e) => setMutationError(e.message),
  })

  const offerRefetchQueries = [
    { query: GET_OFFERS_BY_PROJECT, variables: { projectId, tenantId } },
  ]

  const [createOffer, { loading: creatingOffer }] = useMutation(CREATE_OFFER, {
    refetchQueries: offerRefetchQueries,
    awaitRefetchQueries: true,
    onCompleted: () => { setOfferModal(null); refetchOffers() },
    onError: (e) => setMutationError(e.message),
  })
  const [updateOffer, { loading: updatingOffer }] = useMutation(UPDATE_OFFER, {
    refetchQueries: offerRefetchQueries,
    awaitRefetchQueries: true,
    onCompleted: () => { setOfferModal(null); setDescriptionEditTarget(null); refetchOffers() },
    onError: (e) => setMutationError(e.message),
  })
  const [deleteOffer, { loading: deletingOffer }] = useMutation(DELETE_OFFER, {
    refetchQueries: offerRefetchQueries,
    awaitRefetchQueries: true,
    onCompleted: () => { setDeleteTarget(null); refetchOffers() },
    onError: (e) => setMutationError(e.message),
  })

  const [sendProjectEmail, { loading: sendingEmail }] = useMutation(SEND_PROJECT_EMAIL, {
    onCompleted: () => setEmailModal(null),
    onError: (e) => setMutationError(e.message),
  })

  const project = projectData?.project
  const task = taskData?.task
  const offers = offersData?.offers?.items ?? []
  const pricingInProgress = project?.status === 'PRICING'

  const grandTotal = offers.reduce((s, o) => s + (o.total ?? 0), 0)

  if (taskLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {pricingInProgress && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <Spinner size="sm" />
          <span className="font-medium">AI is pricing this project</span>
          <span className="text-amber-700 text-sm">The project is locked. Return to Project Detail to see progress.</span>
        </div>
      )}
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/app/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link to={`/app/projects/${projectId}`} className="hover:text-indigo-600 transition-colors truncate max-w-32">
          {project?.name ?? 'Project'}
        </Link>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{task?.name}</span>
      </nav>

      {/* Task header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{task?.name}</h1>
            {task?.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
            <div className="mt-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAssigneesExpanded((e) => !e)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100/80 transition-colors"
                >
                  <span>
                    Assigned team members
                    <span className="text-gray-400 font-normal ml-1">
                      ({(task?.assigneeIds ?? []).length} assigned)
                    </span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${assigneesExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {assigneesExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <AssigneeSelector
                      teamMembers={teamMembers}
                      value={task?.assigneeIds ?? []}
                      onChange={(assigneeIds) =>
                        updateTask({
                          variables: {
                            id: taskId,
                            projectId,
                            tenantId,
                            input: {
                              name: task?.name,
                              description: task?.description ?? null,
                              assigneeIds: assigneeIds ?? [],
                              startDate: task?.startDate ?? null,
                              endDate: task?.endDate ?? null,
                              calendarColor: task?.calendarColor ?? null,
                            },
                          },
                        })
                      }
                      label={null}
                      disabled={updatingTask}
                    />
                    {updatingTask && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <Spinner size="sm" />
                        <span>Saving…</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                const assigneeIds = task?.assigneeIds ?? []
                const toEmails = assigneeIds
                  .map((id) => teamMembers.find((m) => m.id === id)?.email)
                  .filter(Boolean)
                if (toEmails.length > 0) {
                  setEmailModal({
                    toEmails,
                    defaultSubject: `Task: ${task?.name ?? ''}`,
                    defaultBody: `Hi,\n\nRegarding task "${task?.name ?? ''}" in project "${project?.name ?? ''}":\n\n`,
                  })
                }
              }}
              disabled={!task?.assigneeIds?.length}
              title={task?.assigneeIds?.length ? `Email ${task.assigneeIds.length} assignee(s)` : 'No assignees on this task'}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email assignees
            </button>
            <button
              onClick={() => { setMutationError(null); setTaskModal(true) }}
              disabled={pricingInProgress}
              title={pricingInProgress ? 'Project is locked during pricing' : undefined}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit task
            </button>
          </div>
        </div>
      </div>

      {/* Cost Summary + Task Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Cost Summary</h3>
          <span className="text-lg font-bold text-indigo-600">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="lg:col-span-2">
          <TaskCalendar
            task={task}
            onUpdate={pricingInProgress ? undefined : (updates) =>
              updateTask({
                variables: {
                  id: taskId,
                  projectId,
                  tenantId,
                  input: {
                    name: task?.name,
                    description: task?.description ?? null,
                    assigneeIds: task?.assigneeIds ?? null,
                    startDate: updates.startDate ?? task?.startDate ?? null,
                    endDate: updates.endDate ?? task?.endDate ?? null,
                    calendarColor: updates.calendarColor ?? task?.calendarColor ?? null,
                  },
                },
              })
            }
            updating={updatingTask}
          />
        </div>
      </div>

      {/* Offers — full width, takes rest of page */}
      <div className="flex flex-col min-h-[calc(100vh-18rem)]">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">
              Offers <span className="text-gray-400 font-normal text-sm ml-1">({offers.length})</span>
            </h2>
            <button
              onClick={() => { setMutationError(null); setOfferModal({ mode: 'create' }) }}
              disabled={pricingInProgress}
              title={pricingInProgress ? 'Project is locked during pricing' : undefined}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add offer
            </button>
          </div>
          {offersLoading ? (
            <div className="flex justify-center py-10 flex-1"><Spinner /></div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <SectionTable
                headers={['Name', 'Description', 'UoM', 'Qty', 'Unit Cost', 'Duration', 'Assignees', 'Total']}
                rows={offers.map((offer) => ({
                  id: offer.id,
                  original: offer,
                  cells: [
                    <span className="font-medium text-gray-900">{offer.name}</span>,
                    <button
                      type="button"
                      onClick={() => { if (!pricingInProgress) { setMutationError(null); setDescriptionEditTarget(offer) } }}
                      disabled={pricingInProgress}
                      className="text-left w-full text-gray-500 text-sm max-w-56 truncate block hover:text-indigo-600 hover:bg-indigo-50/70 -m-2 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      title={pricingInProgress ? 'Project is locked during pricing' : (offer.description ? `${offer.description} — Click to view and edit` : 'Click to add description')}
                    >
                      {offer.description || '—'}
                    </button>,
                    <span className="text-gray-700">{offer.uom || '—'}</span>,
                    <span className="text-gray-700">{offer.quantity ?? '—'}</span>,
                    <span className="text-gray-500 text-xs">{formatCurrency(offer.unitCost)}</span>,
                    <span className="text-gray-500 text-xs">{offer.duration || '—'}</span>,
                    <span className="text-gray-500 text-xs">
                      {offer.assigneeIds?.length
                        ? offer.assigneeIds
                            .map((id) => teamMembers.find((m) => m.id === id)?.displayName || teamMembers.find((m) => m.id === id)?.username || id)
                            .join(', ') || '—'
                        : '—'}
                    </span>,
                    <span className="font-medium text-gray-700">{formatCurrency(offer.total)}</span>,
                  ],
                }))}
                onEdit={(offer) => { setMutationError(null); setOfferModal({ mode: 'edit', offer }) }}
                onDelete={(offer) => setDeleteTarget({ type: 'offer', item: offer })}
                emptyTitle="No offers yet"
                emptyDesc="Add materials, labor, or services for this task."
                onAdd={() => { setMutationError(null); setOfferModal({ mode: 'create' }) }}
                disabled={pricingInProgress}
              />
            </div>
          )}
          {offers.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end flex-shrink-0">
              <span className="text-sm font-semibold text-gray-700">
                Total: {formatCurrency(grandTotal)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Task edit modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Edit task">
        {task && (
          <TaskForm
            initial={task}
            onSubmit={(input) => updateTask({ variables: { id: taskId, projectId, tenantId, input } })}
            loading={updatingTask}
            error={mutationError}
            teamMembers={teamMembers}
          />
        )}
      </Modal>

      {/* Offer modals */}
      <Modal open={!!offerModal} onClose={() => setOfferModal(null)} title={offerModal?.mode === 'create' ? 'Add offer' : 'Edit offer'}>
        {offerModal && (
          <OfferForm
            initial={offerModal.offer}
            teamMembers={teamMembers}
            onSubmit={
              offerModal.mode === 'create'
                ? (input) => createOffer({ variables: { input: { ...input, projectId, taskId, tenantId } } })
                : (input) => updateOffer({ variables: { id: offerModal.offer.id, projectId, taskId, tenantId, input } })
            }
            loading={creatingOffer || updatingOffer}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Description edit modal — dedicated surface for viewing/editing offer description */}
      <Modal
        open={!!descriptionEditTarget}
        onClose={() => { setDescriptionEditTarget(null); setMutationError(null) }}
        title={`Edit description — ${descriptionEditTarget?.name ?? 'Offer'}`}
        maxWidth="max-w-2xl"
      >
        {descriptionEditTarget && (
          <DescriptionEditForm
            offer={descriptionEditTarget}
            onSubmit={(description) =>
              updateOffer({
                variables: {
                  id: descriptionEditTarget.id,
                  projectId,
                  taskId,
                  tenantId,
                  input: {
                    name: descriptionEditTarget.name,
                    description,
                    uom: descriptionEditTarget.uom,
                    quantity: descriptionEditTarget.quantity,
                    unitCost: descriptionEditTarget.unitCost,
                    duration: descriptionEditTarget.duration,
                    assigneeIds: descriptionEditTarget.assigneeIds,
                  },
                },
              })
            }
            onClose={() => { setDescriptionEditTarget(null); setMutationError(null) }}
            loading={updatingOffer}
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
                taskId,
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
        loading={deletingOffer}
        title="Delete offer"
        message={`Are you sure you want to delete "${deleteTarget?.item?.name}"?`}
        onConfirm={() => {
          if (deleteTarget?.type === 'offer') deleteOffer({ variables: { id: deleteTarget.item.id, projectId, taskId, tenantId } })
        }}
      />
    </div>
  )
}
