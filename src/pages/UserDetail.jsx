import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import { GET_USER_PROFILE, UPDATE_PROFILE, DELETE_PROFILE } from '../api/users'
import { CHANGE_PASSWORD } from '../api/auth'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function getInitials(u) {
  if (u?.firstName && u?.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
  return (u?.displayName || u?.username || '?')[0].toUpperCase()
}

function ProfileForm({ initial, onSubmit, loading, error, isAdmin }) {
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    displayName: initial?.displayName ?? '',
    email: initial?.email ?? '',
    phoneNumber: initial?.phoneNumber ?? '',
    role: initial?.role ?? 'MEMBER',
    status: initial?.status ?? 'ACTIVE',
  })
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      firstName: form.firstName.trim() || null,
      lastName: form.lastName.trim() || null,
      displayName: form.displayName.trim() || null,
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
      ...(isAdmin ? { role: form.role, status: form.status } : {}),
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
        <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Jane Smith" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
        <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
        <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="+1 555 000 0000" className={inputClass} />
      </div>
      {isAdmin && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
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

function PasswordForm({ userId, tenantId, onDone, error }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [localError, setLocalError] = useState(null)
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: onDone,
    onError: (e) => setLocalError(e.message),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setLocalError(null)
    if (form.newPassword !== form.confirm) {
      setLocalError('New passwords do not match.')
      return
    }
    changePassword({ variables: { id: userId, tenantId, input: { currentPassword: form.currentPassword, newPassword: form.newPassword } } })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert message={error || localError} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
        <input name="currentPassword" type="password" required value={form.currentPassword} onChange={handleChange} placeholder="••••••••" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
        <input name="newPassword" type="password" required value={form.newPassword} onChange={handleChange} placeholder="••••••••" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
        <input name="confirm" type="password" required value={form.confirm} onChange={handleChange} placeholder="••••••••" className={inputClass} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading && <Spinner size="sm" />}
          Update password
        </button>
      </div>
    </form>
  )
}

export default function UserDetail() {
  const { userId } = useParams()
  const { user: currentUser, updateUser } = useAuth()
  const navigate = useNavigate()
  const tenantId = currentUser?.tenantId

  const [editModal, setEditModal] = useState(false)
  const [passwordModal, setPasswordModal] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [mutationError, setMutationError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const { data, loading, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId, tenantId },
    skip: !tenantId,
  })

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE, {
    onCompleted: ({ updateProfile: updated }) => {
      setEditModal(false)
      setSuccessMsg('Profile updated successfully.')
      if (userId === currentUser?.id) updateUser(updated)
      refetch()
    },
    onError: (e) => setMutationError(e.message),
  })

  const [deleteProfile, { loading: deleting }] = useMutation(DELETE_PROFILE, {
    onCompleted: () => navigate('/app/team'),
    onError: (e) => setMutationError(e.message),
  })

  const profile = data?.userProfile
  const isOwn = userId === currentUser?.id
  const isAdmin = currentUser?.role === 'ADMIN'
  // Admin: can edit all fields of any member. Non-admin: can only edit own profile (not role/status).
  const canEditProfile = isAdmin || isOwn
  const canEditAllFields = isAdmin

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  if (!profile) return (
    <div className="p-8 text-center text-sm text-gray-500">
      User not found.{' '}
      <Link to="/app/team" className="text-indigo-600 font-medium">Go back</Link>
    </div>
  )

  const displayName = profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/app/team" className="hover:text-indigo-600 transition-colors">Team</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{displayName}</span>
      </nav>

      {successMsg && <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
            {getInitials(profile)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={profile.role} label={profile.role} />
                <Badge variant={profile.status} label={profile.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {[
            { label: 'Email', value: profile.email },
            { label: 'Phone', value: profile.phoneNumber || '—' },
            { label: 'Last login', value: formatDate(profile.lastLoginAt) },
            { label: 'Member since', value: formatDate(profile.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center px-6 py-3">
              <span className="w-32 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
              <span className="text-sm text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3">
          {canEditProfile && (
            <button
              onClick={() => { setMutationError(null); setEditModal(true) }}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit profile
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => { setMutationError(null); setPasswordModal(true) }}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Change password
            </button>
          )}
          {isAdmin && !isOwn && (
            <button
              onClick={() => setDeleteDialog(true)}
              className="flex items-center gap-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors ml-auto"
            >
              Remove member
            </button>
          )}
        </div>
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit profile">
        <ProfileForm
          initial={profile}
          isAdmin={canEditAllFields}
          onSubmit={(input) => updateProfile({ variables: { id: userId, tenantId, callerId: currentUser?.id, input } })}
          loading={updating}
          error={mutationError}
        />
      </Modal>

      <Modal open={passwordModal} onClose={() => setPasswordModal(false)} title="Change password">
        <PasswordForm
          userId={userId}
          tenantId={tenantId}
          onDone={() => { setPasswordModal(false); setSuccessMsg('Password updated successfully.') }}
          error={mutationError}
        />
      </Modal>

      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={() => deleteProfile({ variables: { id: userId, tenantId } })}
        loading={deleting}
        title="Remove member"
        message={`Are you sure you want to permanently remove "${displayName}"?`}
      />
    </div>
  )
}
