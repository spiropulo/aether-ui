import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_PROJECT,
  GET_TASK,
  UPDATE_TASK,
  GET_ITEMS,
  CREATE_ITEM,
  UPDATE_ITEM,
  DELETE_ITEM,
  GET_LABORS,
  CREATE_LABOR,
  UPDATE_LABOR,
  DELETE_LABOR,
} from '../api/projects'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

// ─── Item form ────────────────────────────────────────────────────────────────
function ItemForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    quantity: initial?.quantity ?? '',
    cost: initial?.cost ?? '',
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const qty = form.quantity !== '' ? parseInt(form.quantity, 10) : null
  const unitCost = form.cost !== '' ? parseFloat(form.cost) : null
  const previewTotal = qty != null && unitCost != null ? qty * unitCost : null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      quantity: form.quantity !== '' ? parseInt(form.quantity, 10) : null,
      cost: form.cost !== '' ? parseFloat(form.cost) : null,
    })
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input name="name" required value={form.name} onChange={handleChange} placeholder="Item name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Brief description…" className={`${inputClass} resize-none`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
          <input name="quantity" type="number" step="1" min="0" value={form.quantity} onChange={handleChange} placeholder="1" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit cost ($)</label>
          <input name="cost" type="number" step="0.01" min="0" value={form.cost} onChange={handleChange} placeholder="0.00" className={inputClass} />
        </div>
      </div>
      {previewTotal != null && (
        <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-2.5 text-sm">
          <span className="text-indigo-600 font-medium">Line total</span>
          <span className="font-bold text-indigo-700">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(previewTotal)}
          </span>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Add item'}
        </button>
      </div>
    </form>
  )
}

// ─── Labor form ───────────────────────────────────────────────────────────────
function LaborForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    time: initial?.time ?? '',
    cost: initial?.cost ?? '',
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      time: form.time !== '' ? parseFloat(form.time) : null,
      cost: form.cost !== '' ? parseFloat(form.cost) : null,
    })
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input name="name" required value={form.name} onChange={handleChange} placeholder="Labor entry name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Brief description…" className={`${inputClass} resize-none`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Time (hrs)</label>
          <input name="time" type="number" step="0.25" min="0" value={form.time} onChange={handleChange} placeholder="0.00" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost ($)</label>
          <input name="cost" type="number" step="0.01" min="0" value={form.cost} onChange={handleChange} placeholder="0.00" className={inputClass} />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Add labor'}
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
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Brief description…" className={`${inputClass} resize-none`} />
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
  const [itemModal, setItemModal] = useState(null)
  const [laborModal, setLaborModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutationError, setMutationError] = useState(null)

  const { data: projectData } = useQuery(GET_PROJECT, { variables: { id: projectId, tenantId }, skip: !tenantId })
  const { data: taskData, loading: taskLoading, refetch: refetchTask } = useQuery(GET_TASK, {
    variables: { id: taskId, projectId, tenantId },
    skip: !tenantId,
  })
  const { data: itemsData, loading: itemsLoading, refetch: refetchItems } = useQuery(GET_ITEMS, {
    variables: { projectId, taskId, tenantId, page: { limit: 100, offset: 0 } },
    skip: !tenantId,
  })
  const { data: laborsData, loading: laborsLoading, refetch: refetchLabors } = useQuery(GET_LABORS, {
    variables: { projectId, taskId, tenantId, page: { limit: 100, offset: 0 } },
    skip: !tenantId,
  })

  const [updateTask, { loading: updatingTask }] = useMutation(UPDATE_TASK, {
    onCompleted: () => { setTaskModal(false); refetchTask() },
    onError: (e) => setMutationError(e.message),
  })

  const [createItem, { loading: creatingItem }] = useMutation(CREATE_ITEM, {
    onCompleted: () => { setItemModal(null); refetchItems() },
    onError: (e) => setMutationError(e.message),
  })
  const [updateItem, { loading: updatingItem }] = useMutation(UPDATE_ITEM, {
    onCompleted: () => { setItemModal(null); refetchItems() },
    onError: (e) => setMutationError(e.message),
  })
  const [deleteItem, { loading: deletingItem }] = useMutation(DELETE_ITEM, {
    onCompleted: () => { setDeleteTarget(null); refetchItems() },
    onError: (e) => setMutationError(e.message),
  })

  const [createLabor, { loading: creatingLabor }] = useMutation(CREATE_LABOR, {
    onCompleted: () => { setLaborModal(null); refetchLabors() },
    onError: (e) => setMutationError(e.message),
  })
  const [updateLabor, { loading: updatingLabor }] = useMutation(UPDATE_LABOR, {
    onCompleted: () => { setLaborModal(null); refetchLabors() },
    onError: (e) => setMutationError(e.message),
  })
  const [deleteLabor, { loading: deletingLabor }] = useMutation(DELETE_LABOR, {
    onCompleted: () => { setDeleteTarget(null); refetchLabors() },
    onError: (e) => setMutationError(e.message),
  })

  const project = projectData?.project
  const task = taskData?.task
  const items = itemsData?.items?.items ?? []
  const labors = laborsData?.labors?.items ?? []

  // Use server-computed total (quantity × unit cost) if available, fall back to cost
  const totalItemCost = items.reduce((s, i) => s + (i.total ?? i.cost ?? 0), 0)
  const totalLaborCost = labors.reduce((s, l) => s + (l.cost ?? 0), 0)
  const totalLaborTime = labors.reduce((s, l) => s + (l.time ?? 0), 0)
  const grandTotal = totalItemCost + totalLaborCost

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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Items <span className="text-gray-400 font-normal text-sm ml-1">({items.length})</span>
              </h2>
              <button
                onClick={() => { setMutationError(null); setItemModal({ mode: 'create' }) }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add item
              </button>
            </div>
            {itemsLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <SectionTable
                headers={['Name', 'Description', 'Qty', 'Unit Cost', 'Total']}
                rows={items.map((item) => ({
                  id: item.id,
                  original: item,
                  cells: [
                    <span className="font-medium text-gray-900">{item.name}</span>,
                    <span className="text-gray-500 text-xs">{item.description || '—'}</span>,
                    <span className="text-gray-700">{item.quantity ?? '—'}</span>,
                    <span className="text-gray-500 text-xs">{formatCurrency(item.cost)}</span>,
                    <span className="font-medium text-gray-700">{formatCurrency(item.total)}</span>,
                  ],
                }))}
                onEdit={(item) => { setMutationError(null); setItemModal({ mode: 'edit', item }) }}
                onDelete={(item) => setDeleteTarget({ type: 'item', item })}
                emptyTitle="No items yet"
                emptyDesc="Add materials, tools, or any other cost items for this task."
                onAdd={() => { setMutationError(null); setItemModal({ mode: 'create' }) }}
              />
            )}
            {items.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                <span className="text-sm font-semibold text-gray-700">
                  Items total: {formatCurrency(totalItemCost)}
                </span>
              </div>
            )}
          </div>

          {/* Labor */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Labor <span className="text-gray-400 font-normal text-sm ml-1">({labors.length})</span>
              </h2>
              <button
                onClick={() => { setMutationError(null); setLaborModal({ mode: 'create' }) }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add labor
              </button>
            </div>
            {laborsLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <SectionTable
                headers={['Name', 'Description', 'Time (hrs)', 'Cost']}
                rows={labors.map((labor) => ({
                  id: labor.id,
                  original: labor,
                  cells: [
                    <span className="font-medium text-gray-900">{labor.name}</span>,
                    <span className="text-gray-500 text-xs">{labor.description || '—'}</span>,
                    <span className="text-gray-700">{labor.time != null ? `${labor.time}h` : '—'}</span>,
                    <span className="font-medium text-gray-700">{formatCurrency(labor.cost)}</span>,
                  ],
                }))}
                onEdit={(labor) => { setMutationError(null); setLaborModal({ mode: 'edit', labor }) }}
                onDelete={(labor) => setDeleteTarget({ type: 'labor', item: labor })}
                emptyTitle="No labor entries yet"
                emptyDesc="Track time and labor costs associated with this task."
                onAdd={() => { setMutationError(null); setLaborModal({ mode: 'create' }) }}
              />
            )}
            {labors.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-6">
                <span className="text-sm text-gray-500">Total time: {totalLaborTime.toFixed(2)}h</span>
                <span className="text-sm font-semibold text-gray-700">Labor total: {formatCurrency(totalLaborCost)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Cost Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-medium text-gray-800">{formatCurrency(totalItemCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Labor</span>
                <span className="font-medium text-gray-800">{formatCurrency(totalLaborCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total time</span>
                <span className="font-medium text-gray-800">{totalLaborTime.toFixed(2)}h</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-gray-900">Grand total</span>
                <span className="text-sm font-bold text-indigo-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

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

      {/* Item modals */}
      <Modal open={!!itemModal} onClose={() => setItemModal(null)} title={itemModal?.mode === 'create' ? 'Add item' : 'Edit item'}>
        {itemModal && (
          <ItemForm
            initial={itemModal.item}
            onSubmit={
              itemModal.mode === 'create'
                ? (input) => createItem({ variables: { input: { ...input, projectId, taskId, tenantId } } })
                : (input) => updateItem({ variables: { id: itemModal.item.id, projectId, taskId, tenantId, input } })
            }
            loading={creatingItem || updatingItem}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Labor modals */}
      <Modal open={!!laborModal} onClose={() => setLaborModal(null)} title={laborModal?.mode === 'create' ? 'Add labor' : 'Edit labor'}>
        {laborModal && (
          <LaborForm
            initial={laborModal.labor}
            onSubmit={
              laborModal.mode === 'create'
                ? (input) => createLabor({ variables: { input: { ...input, projectId, taskId, tenantId } } })
                : (input) => updateLabor({ variables: { id: laborModal.labor.id, projectId, taskId, tenantId, input } })
            }
            loading={creatingLabor || updatingLabor}
            error={mutationError}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deletingItem || deletingLabor}
        title={`Delete ${deleteTarget?.type}`}
        message={`Are you sure you want to delete "${deleteTarget?.item?.name}"?`}
        onConfirm={() => {
          if (deleteTarget.type === 'item') deleteItem({ variables: { id: deleteTarget.item.id, projectId, taskId, tenantId } })
          else if (deleteTarget.type === 'labor') deleteLabor({ variables: { id: deleteTarget.item.id, projectId, taskId, tenantId } })
        }}
      />
    </div>
  )
}
