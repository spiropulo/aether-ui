import { useState } from 'react'
import AssigneeSelector from './ui/AssigneeSelector'
import Alert from './ui/Alert'
import Spinner from './ui/Spinner'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

export default function OfferForm({ initial, onSubmit, loading, error, teamMembers, isAdmin = false }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    unitCost: initial?.unitCost != null && !Number.isNaN(initial.unitCost) ? String(initial.unitCost) : '',
    assigneeIds: initial?.assigneeIds ?? [],
    workCompleted: !!initial?.workCompleted,
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const costNum = form.unitCost !== '' ? parseFloat(form.unitCost) : null
  const previewTotal = isAdmin && costNum != null && !Number.isNaN(costNum) ? costNum : null

  const handleSubmit = (e) => {
    e.preventDefault()
    let uc
    let quantity
    if (isAdmin) {
      uc = form.unitCost !== '' ? parseFloat(form.unitCost) : null
      quantity = uc != null && !Number.isNaN(uc) ? 1 : null
    } else if (initial) {
      uc = initial.unitCost != null && !Number.isNaN(initial.unitCost) ? initial.unitCost : null
      quantity = initial.quantity != null ? initial.quantity : null
    } else {
      uc = null
      quantity = null
    }
    const input = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      uom: null,
      quantity,
      unitCost: uc != null && !Number.isNaN(uc) ? uc : null,
      duration: null,
      assigneeIds: form.assigneeIds ?? [],
    }
    if (isAdmin) input.workCompleted = form.workCompleted
    onSubmit(input)
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
      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost</label>
          <input name="unitCost" type="number" step="0.01" min="0" value={form.unitCost} onChange={handleChange} placeholder="0.00" className={inputClass} />
        </div>
      )}
      {teamMembers && (
        <AssigneeSelector
          teamMembers={teamMembers}
          value={form.assigneeIds}
          onChange={(ids) => setForm((p) => ({ ...p, assigneeIds: ids }))}
        />
      )}
      {isAdmin && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.workCompleted}
            onChange={(e) => setForm((p) => ({ ...p, workCompleted: e.target.checked }))}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">Work complete</span>
        </label>
      )}
      {previewTotal != null && (
        <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-2.5 text-sm">
          <span className="text-indigo-600 font-medium">Total</span>
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
