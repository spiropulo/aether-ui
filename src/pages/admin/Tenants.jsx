import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../../context/AuthContext'
import { GET_TENANTS, UPDATE_TENANT } from '../../api/tenants'
import { getSubscriptionStatus } from '../../api/subscription'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

/** Edit-only: one workspace tenant per organization; phone + address required (server-validated). */
function EditTenantForm({ tenant, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    organizationName: tenant.organizationName ?? '',
    displayName: tenant.displayName ?? '',
    email: tenant.email ?? '',
    status: tenant.status ?? 'ACTIVE',
    phoneNumber: tenant.phoneNumber ?? '',
    addressLine1: tenant.addressLine1 ?? '',
    addressLine2: tenant.addressLine2 ?? '',
    city: tenant.city ?? '',
    state: tenant.state ?? '',
    postalCode: tenant.postalCode ?? '',
    country: tenant.country ?? '',
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#workspace-company-contact') return
    const id = window.setTimeout(() => {
      document.getElementById('workspace-company-contact')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 150)
    return () => window.clearTimeout(id)
  }, [tenant.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      organizationName: form.organizationName.trim() || null,
      displayName: form.displayName.trim() || null,
      email: form.email.trim(),
      status: form.status,
      phoneNumber: form.phoneNumber.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <p className="text-xs text-gray-500">
        Each organization has exactly one workspace tenant. It is created at signup; you can only update its details here.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tenant ID</label>
        <input value={tenant.tenantId} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization name</label>
        <input name="organizationName" required value={form.organizationName} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Workspace display name</label>
        <input name="displayName" value={form.displayName} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tenant account email *</label>
        <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} />
        <p className="text-xs text-gray-400 mt-1">Billing and workspace contact; does not change user login emails.</p>
      </div>

      <div id="workspace-company-contact" className="pt-2 border-t border-gray-100 scroll-mt-4">
        <h4 className="text-sm font-medium text-gray-800 mb-3">Company phone &amp; address (required)</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company phone *</label>
            <input name="phoneNumber" type="tel" required value={form.phoneNumber} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Street address *</label>
            <input name="addressLine1" required value={form.addressLine1} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address line 2</label>
            <input name="addressLine2" value={form.addressLine2} onChange={handleChange} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
              <input name="city" required value={form.city} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State / region</label>
              <input name="state" value={form.state} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal code</label>
              <input name="postalCode" value={form.postalCode} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label>
              <input name="country" required value={form.country} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
        <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          Save workspace
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
  const location = useLocation()

  const [editTenant, setEditTenant] = useState(null)
  const [mutationError, setMutationError] = useState(null)
  const [aiPricingPlan, setAiPricingPlan] = useState(null)
  const [aiPricingPlanLoading, setAiPricingPlanLoading] = useState(false)

  const { data, loading } = useQuery(GET_TENANTS, {
    variables: { tenantId },
    skip: !tenantId,
  })

  const [updateTenant, { loading: updating }] = useMutation(UPDATE_TENANT, {
    refetchQueries: tenantId ? [{ query: GET_TENANTS, variables: { tenantId } }] : [],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setMutationError(null)
      setEditTenant(null)
    },
    onError: (e) => {
      const errs = e.graphQLErrors
      const gqlMsg = Array.isArray(errs) ? errs.map((err) => err.message).filter(Boolean).join(' ') : ''
      setMutationError(gqlMsg || e.message || 'Save failed.')
    },
  })

  const tenants = data?.tenants ?? []
  const soleTenantId = tenants.length === 1 ? tenants[0].id : null
  const openedCompanySectionFromHashRef = useRef(false)

  useEffect(() => {
    openedCompanySectionFromHashRef.current = false
  }, [location.key])

  useEffect(() => {
    if (loading || !soleTenantId) return
    if (location.hash !== '#workspace-company-contact') return
    if (openedCompanySectionFromHashRef.current) return
    openedCompanySectionFromHashRef.current = true
    setMutationError(null)
    const row = tenants.find((t) => t.id === soleTenantId)
    if (row) setEditTenant(row)
  }, [loading, location.hash, location.key, soleTenantId, tenants])

  useEffect(() => {
    if (!tenantId) return
    setAiPricingPlanLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
    getSubscriptionStatus(tenantId, { token })
      .then((s) => setAiPricingPlan(s?.plan ?? null))
      .catch(() => setAiPricingPlan(null))
      .finally(() => setAiPricingPlanLoading(false))
  }, [tenantId, editTenant?.id])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your workspace has one tenant record. Update its name, status, company phone, and address.
        </p>
      </div>

      {tenants.length > 1 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
          Multiple tenant documents were found for this workspace. Only one is expected. Edit the correct row or contact support to merge data.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : tenants.length === 0 ? (
          <EmptyState
            title="No workspace tenant found"
            description="The tenant record for this organization is missing. Contact support."
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
                    {aiPricingPlanLoading ? '…' : (aiPricingPlan ?? t.subscriptionPlan ?? '—')}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => { setMutationError(null); setEditTenant(t) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit workspace"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
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
        open={!!editTenant}
        onClose={() => { setEditTenant(null); setMutationError(null) }}
        title="Edit workspace tenant"
      >
        {editTenant && (
          <EditTenantForm
            key={editTenant.id}
            tenant={editTenant}
            onSubmit={(input) => {
              if (!editTenant?.id || !tenantId) {
                setMutationError('Missing tenant id. Sign out and back in, then try again.')
                return
              }
              updateTenant({
                variables: {
                  id: editTenant.id,
                  tenantId: editTenant.tenantId ?? tenantId,
                  input,
                },
              })
            }}
            loading={updating}
            error={mutationError}
          />
        )}
      </Modal>
    </div>
  )
}
