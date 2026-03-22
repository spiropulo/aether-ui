import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import { GET_USER_PROFILES, DELETE_PROFILE } from '../api/users'
import { ADD_MEMBER } from '../api/auth'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import Alert from '../components/ui/Alert'

const PAGE_SIZE = 20

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function InviteForm({ callerId, tenantId, organizationName, isFirstMemberForTenant = false, onDone, onError, error }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    displayName: '',
    hourlyLaborRate: '',
    role: isFirstMemberForTenant ? 'ADMIN' : 'MEMBER',
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const [addMember, { loading }] = useMutation(ADD_MEMBER, {
    onCompleted: onDone,
    onError: (e) => onError?.(e.message),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    addMember({
      variables: {
        callerId,
        tenantId,
        input: {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          displayName: form.displayName.trim() || undefined,
          hourlyLaborRate:
            form.hourlyLaborRate.trim() === ''
              ? undefined
              : (() => {
                  const n = parseFloat(form.hourlyLaborRate)
                  return Number.isNaN(n) || n < 0 ? undefined : n
                })(),
          role: form.role,
        },
        organizationName: organizationName.trim(),
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Jane" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Smith" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username *</label>
        <input name="username" required value={form.username} onChange={handleChange} placeholder="janesmith" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
        <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="jane@company.com" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
        <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Jane Smith" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Temporary password *</label>
        <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly labor rate (USD, optional)</label>
        <input
          name="hourlyLaborRate"
          type="number"
          min={0}
          step={0.01}
          value={form.hourlyLaborRate}
          onChange={handleChange}
          placeholder="e.g. 75"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          disabled={isFirstMemberForTenant}
          className={`${inputClass} ${isFirstMemberForTenant ? 'opacity-80 cursor-not-allowed' : ''}`}
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
          <option value="VIEWER">Viewer</option>
        </select>
        {isFirstMemberForTenant && (
          <p className="mt-1.5 text-xs text-gray-500">
            The first person in your organization is always an admin.
          </p>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          Add member
        </button>
      </div>
    </form>
  )
}

function getInitials(u) {
  if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
  return (u.displayName || u.username || '?')[0].toUpperCase()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Team() {
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const isAdmin = user?.role === 'ADMIN'

  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [inviteModal, setInviteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mutationError, setMutationError] = useState(null)

  const { data, loading, refetch } = useQuery(GET_USER_PROFILES, {
    variables: { tenantId, page: { limit: PAGE_SIZE, offset }, search: search || undefined },
    skip: !tenantId,
  })

  const [deleteProfile, { loading: deleting }] = useMutation(DELETE_PROFILE, {
    onCompleted: () => { setDeleteTarget(null); refetch() },
    onError: (e) => setMutationError(e.message),
  })

  const users = data?.userProfiles?.items ?? []
  const total = data?.userProfiles?.total ?? 0

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setOffset(0)
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your organization&apos;s members</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => { setMutationError(null); setInviteModal(true) }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add member
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, username, or email…"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        <button type="submit" className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setOffset(0) }} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">
            Clear
          </button>
        )}
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No members found"
            description={
              search
                ? 'Try a different search term.'
                : user?.role === 'ADMIN'
                  ? 'Add your first team member to get started.'
                  : 'Ask an organization admin to invite members.'
            }
            action={
              !search && user?.role === 'ADMIN' ? (
                <button
                  onClick={() => { setMutationError(null); setInviteModal(true) }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  + Add member
                </button>
              ) : null
            }
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Username</th>
                  {isAdmin && (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">$/hr</th>
                  )}
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Last login</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(u)}
                        </div>
                        <div>
                          <Link to={`/app/team/${u.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                            {u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username}
                          </Link>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">@{u.username}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-gray-600 text-xs hidden sm:table-cell">
                        {u.hourlyLaborRate != null ? `$${Number(u.hourlyLaborRate).toFixed(0)}` : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <Badge variant={u.role} label={u.role} />
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <Badge variant={u.status} label={u.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                      {formatDate(u.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/app/team/${u.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View profile"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                        {user?.role === 'ADMIN' && u.id !== user?.id && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                            </svg>
                          </button>
                        )}
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

      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Add team member">
        {inviteModal && user?.id && tenantId && (
          <InviteForm
            key={`invite-${total}`}
            callerId={user.id}
            tenantId={tenantId}
            organizationName={user?.organizationName ?? ''}
            isFirstMemberForTenant={total === 0}
            onDone={() => { setInviteModal(false); setMutationError(null); refetch() }}
            onError={setMutationError}
            error={mutationError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteProfile({ variables: { id: deleteTarget.id, tenantId } })}
        loading={deleting}
        title="Remove member"
        message={`Remove "${deleteTarget?.displayName || deleteTarget?.username}" from your organization? This action cannot be undone.`}
      />
    </div>
  )
}
