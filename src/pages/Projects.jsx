import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import {
  GET_PROJECTS,
  GET_SUGGESTED_PROJECT_STATUSES,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  PROJECT_STATUS_OPTIONS,
} from '../api/projects'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import Alert from '../components/ui/Alert'

const PAGE_SIZE = 20

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function ProjectForm({ initial, suggestedStatuses = [], onSubmit, loading, error }) {
  const statusOptions =
    suggestedStatuses.length > 0 ? suggestedStatuses : PROJECT_STATUS_OPTIONS
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    status:
      initial !== undefined && initial !== null
        ? (initial.status ?? '')
        : 'Not Started',
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
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Brief description of this project…"
          className={`${inputClass} resize-none`}
        />
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
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  )
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

export default function Projects() {
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const isAdmin = user?.role === 'ADMIN'

  const [offset, setOffset] = useState(0)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutationError, setMutationError] = useState(null)

  const { data, loading, refetch } = useQuery(GET_PROJECTS, {
    variables: { tenantId, page: { limit: PAGE_SIZE, offset } },
    skip: !tenantId,
  })

  const { data: statusData } = useQuery(GET_SUGGESTED_PROJECT_STATUSES)
  const suggestedStatuses = statusData?.suggestedProjectStatuses ?? []

  const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT, {
    onCompleted: () => { setModal(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const [updateProject, { loading: updating }] = useMutation(UPDATE_PROJECT, {
    onCompleted: () => { setModal(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT, {
    onCompleted: () => { setDeleteTarget(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const projects = data?.projects?.items ?? []
  const total = data?.projects?.total ?? 0

  const openCreate = () => { setMutationError(null); setModal({ mode: 'create' }) }
  const openEdit = (project) => { setMutationError(null); setModal({ mode: 'edit', project }) }

  const handleCreate = (input) => createProject({ variables: { input: { ...input, tenantId } } })
  const handleUpdate = (input) => updateProject({ variables: { id: modal.project.id, tenantId, input } })
  const handleDelete = () => deleteProject({ variables: { id: deleteTarget.id, tenantId } })

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client project engagements</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New project
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking client work and tasks."
            action={
              <button
                onClick={openCreate}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                + New project
              </button>
            }
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            }
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                  {isAdmin && (
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Total cost</th>
                  )}
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Start</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">End</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/app/projects/${project.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-0.5 max-w-sm truncate">{project.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {project.status ? (
                        <span className="inline-block max-w-[200px] px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 break-words whitespace-normal">
                          {project.status}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right hidden lg:table-cell text-sm font-medium text-gray-700 tabular-nums">
                        {formatCurrency(project.total)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell text-xs">
                      {formatDate(project.startDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell text-xs">
                      {formatDate(project.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(project)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(project)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
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
            <Pagination offset={offset} limit={PAGE_SIZE} total={total} onPageChange={setOffset} />
          </>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'New project' : 'Edit project'}
      >
        {modal && (
          <ProjectForm
            key={modal.mode === 'edit' ? modal.project.id : 'create'}
            initial={modal.project}
            suggestedStatuses={suggestedStatuses}
            onSubmit={modal.mode === 'create' ? handleCreate : handleUpdate}
            loading={creating || updating}
            error={mutationError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks, items, and labor entries will be permanently removed.`}
      />
    </div>
  )
}
