import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../../context/AuthContext'
import {
  GET_TENANTS,
  CREATE_TENANT,
  UPDATE_TENANT,
  DELETE_TENANT,
} from '../../api/tenants'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function TenantForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    tenantId: initial?.tenantId ?? '',
    organizationName: initial?.organizationName ?? '',
    email: initial?.email ?? '',
    displayName: initial?.displayName ?? '',
    subscriptionPlan: initial?.subscriptionPlan ?? '',
    status: initial?.status ?? 'ACTIVE',
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (initial) {
      onSubmit({
        organizationName: form.organizationName.trim() || null,
        displayName: form.displayName.trim() || null,
        subscriptionPlan: form.subscriptionPlan.trim() || null,
        status: form.status,
      })
    } else {
      onSubmit({
        tenantId: form.tenantId.trim(),
        organizationName: form.organizationName.trim(),
        email: form.email.trim(),
        displayName: form.displayName.trim() || null,
        subscriptionPlan: form.subscriptionPlan.trim() || null,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      {!initial && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name *</label>
            <input name="organizationName" required value={form.organizationName} onChange={handleChange} placeholder="Acme Corp" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tenant ID *</label>
            <input name="tenantId" required value={form.tenantId} onChange={handleChange} placeholder="acme-corp" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">Unique identifier — cannot be changed after creation.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="admin@acme.com" className={inputClass} />
          </div>
        </>
      )}
      {initial && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
          <input name="organizationName" value={form.organizationName} onChange={handleChange} placeholder="Acme Corp" className={inputClass} />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
        <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Optional display name" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subscription plan</label>
        <input name="subscriptionPlan" value={form.subscriptionPlan} onChange={handleChange} placeholder="e.g. Pro, Enterprise" className={inputClass} />
      </div>
      {initial && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save changes' : 'Create tenant'}
        </button>
      </div>
    </form>
  )
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Tenants() {
  const { user } = useAuth()
  const tenantId = user?.tenantId

  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutationError, setMutationError] = useState(null)

  const { data, loading, refetch } = useQuery(GET_TENANTS, {
    variables: { tenantId },
    skip: !tenantId,
  })

  const [createTenant, { loading: creating }] = useMutation(CREATE_TENANT, {
    onCompleted: () => { setModal(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const [updateTenant, { loading: updating }] = useMutation(UPDATE_TENANT, {
    onCompleted: () => { setModal(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteTenant, { loading: deleting }] = useMutation(DELETE_TENANT, {
    onCompleted: () => { setDeleteTarget(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const tenants = data?.tenants ?? []

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all organizations on the platform</p>
        </div>
        <button
          onClick={() => { setMutationError(null); setModal({ mode: 'create' }) }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New tenant
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : tenants.length === 0 ? (
          <EmptyState
            title="No tenants found"
            description="Create the first tenant organization to get started."
            action={
              <button
                onClick={() => { setMutationError(null); setModal({ mode: 'create' }) }}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                + New tenant
              </button>
            }
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tenant ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{t.organizationName || t.displayName || t.tenantId}</p>
                    <p className="text-xs text-gray-400">{t.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-mono hidden md:table-cell">{t.tenantId}</td>
                  <td className="px-6 py-4">
                    <Badge variant={t.status} label={t.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                    {t.subscriptionPlan || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setMutationError(null); setModal({ mode: 'edit', tenant: t }) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
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
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'New tenant' : 'Edit tenant'}
      >
        {modal && (
          <TenantForm
            initial={modal.tenant}
            onSubmit={
              modal.mode === 'create'
                ? (input) => createTenant({ variables: { input: { ...input, tenantId } } })
                : (input) => updateTenant({ variables: { id: modal.tenant.id, tenantId, input } })
            }
            loading={creating || updating}
            error={mutationError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTenant({ variables: { id: deleteTarget.id, tenantId } })}
        loading={deleting}
        title="Delete tenant"
        message={`Permanently delete "${deleteTarget?.organizationName || deleteTarget?.displayName || deleteTarget?.tenantId}"? All data associated with this tenant will be lost.`}
      />
    </div>
  )
}
