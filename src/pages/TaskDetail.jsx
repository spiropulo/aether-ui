import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_PROJECT,
  GET_TASK,
  UPDATE_TASK,
  GET_OFFERS,
  CREATE_OFFER,
  UPDATE_OFFER,
  DELETE_OFFER,
} from '../api/projects'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

const UOM_OPTIONS = ['Each', 'kg', 'Hour', 'Day', 'Week', 'Month', 'Lot', 'LF', 'SF', 'CY']

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

// ─── Offer form ───────────────────────────────────────────────────────────────
function OfferForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    uom: initial?.uom ?? '',
    quantity: initial?.quantity ?? '',
    unitCost: initial?.unitCost ?? '',
    duration: initial?.duration ?? '',
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
function TaskForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({ name: initial?.name ?? '', description: initial?.description ?? '' })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ name: form.name.trim(), description: form.description.trim() || null })
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
function SectionTable({ headers, rows, onEdit, onDelete, emptyTitle, emptyDesc, onAdd }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDesc}
        action={
          <button onClick={onAdd} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            + Add
          </button>
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
                <button onClick={() => onEdit(row.original)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(row.original)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
  const [descriptionEditTarget, setDescriptionEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutationError, setMutationError] = useState(null)

  const { data: projectData } = useQuery(GET_PROJECT, { variables: { id: projectId, tenantId }, skip: !tenantId })
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

  const [createOffer, { loading: creatingOffer }] = useMutation(CREATE_OFFER, {
    onCompleted: () => { setOfferModal(null); refetchOffers() },
    onError: (e) => setMutationError(e.message),
  })
  const [updateOffer, { loading: updatingOffer }] = useMutation(UPDATE_OFFER, {
    onCompleted: () => { setOfferModal(null); setDescriptionEditTarget(null); refetchOffers() },
    onError: (e) => setMutationError(e.message),
  })
  const [deleteOffer, { loading: deletingOffer }] = useMutation(DELETE_OFFER, {
    onCompleted: () => { setDeleteTarget(null); refetchOffers() },
    onError: (e) => setMutationError(e.message),
  })

  const project = projectData?.project
  const task = taskData?.task
  const offers = offersData?.offers?.items ?? []

  const grandTotal = offers.reduce((s, o) => s + (o.total ?? 0), 0)

  if (taskLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
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
          <div>
            <h1 className="text-xl font-bold text-gray-900">{task?.name}</h1>
            {task?.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
          </div>
          <button
            onClick={() => { setMutationError(null); setTaskModal(true) }}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit task
          </button>
        </div>
      </div>

      {/* Cost Summary — compact at top */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Cost Summary</h3>
        <span className="text-lg font-bold text-indigo-600">{formatCurrency(grandTotal)}</span>
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
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
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
                headers={['Name', 'Description', 'UoM', 'Qty', 'Unit Cost', 'Duration', 'Total']}
                rows={offers.map((offer) => ({
                  id: offer.id,
                  original: offer,
                  cells: [
                    <span className="font-medium text-gray-900">{offer.name}</span>,
                    <button
                      type="button"
                      onClick={() => { setMutationError(null); setDescriptionEditTarget(offer) }}
                      className="text-left w-full text-gray-500 text-sm max-w-56 truncate block hover:text-indigo-600 hover:bg-indigo-50/70 -m-2 p-2 rounded-lg transition-colors"
                      title={offer.description ? `${offer.description} — Click to view and edit` : 'Click to add description'}
                    >
                      {offer.description || '—'}
                    </button>,
                    <span className="text-gray-700">{offer.uom || '—'}</span>,
                    <span className="text-gray-700">{offer.quantity ?? '—'}</span>,
                    <span className="text-gray-500 text-xs">{formatCurrency(offer.unitCost)}</span>,
                    <span className="text-gray-500 text-xs">{offer.duration || '—'}</span>,
                    <span className="font-medium text-gray-700">{formatCurrency(offer.total)}</span>,
                  ],
                }))}
                onEdit={(offer) => { setMutationError(null); setOfferModal({ mode: 'edit', offer }) }}
                onDelete={(offer) => setDeleteTarget({ type: 'offer', item: offer })}
                emptyTitle="No offers yet"
                emptyDesc="Add materials, labor, or services for this task."
                onAdd={() => { setMutationError(null); setOfferModal({ mode: 'create' }) }}
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
          />
        )}
      </Modal>

      {/* Offer modals */}
      <Modal open={!!offerModal} onClose={() => setOfferModal(null)} title={offerModal?.mode === 'create' ? 'Add offer' : 'Edit offer'}>
        {offerModal && (
          <OfferForm
            initial={offerModal.offer}
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
