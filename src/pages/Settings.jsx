import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import { GET_USER_PROFILE, UPDATE_PROFILE } from '../api/users'
import { CHANGE_PASSWORD } from '../api/auth'
import { GET_TENANT, UPDATE_TENANT } from '../api/tenants'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

function Section({ title, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser } = useAuth()
  const tenantId = user?.tenantId
  const isAdmin = user?.role === 'ADMIN'

  const [profileSuccess, setProfileSuccess] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const [tenantSuccess, setTenantSuccess] = useState(null)
  const [tenantError, setTenantError] = useState(null)

  const [profileForm, setProfileForm] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [tenantForm, setTenantForm] = useState(null)

  const { data: profileData, loading: profileLoading, refetch: refetchProfile } = useQuery(GET_USER_PROFILE, {
    variables: { id: user?.id, tenantId },
    skip: !user?.id || !tenantId,
    onCompleted: ({ userProfile }) => {
      if (!profileForm) {
        setProfileForm({
          firstName: userProfile.firstName ?? '',
          lastName: userProfile.lastName ?? '',
          displayName: userProfile.displayName ?? '',
          email: userProfile.email ?? '',
          phoneNumber: userProfile.phoneNumber ?? '',
        })
      }
    },
  })

  const { data: tenantData, loading: tenantLoading, refetch: refetchTenant } = useQuery(GET_TENANT, {
    variables: { id: tenantId, tenantId },
    skip: !tenantId || !isAdmin,
    onCompleted: ({ tenant }) => {
      if (!tenantForm) {
        setTenantForm({
          organizationName: tenant.organizationName ?? '',
          displayName: tenant.displayName ?? '',
          subscriptionPlan: tenant.subscriptionPlan ?? '',
        })
      }
    },
  })

  const [updateProfile, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE, {
    onCompleted: ({ updateProfile: updated }) => {
      setProfileSuccess('Profile updated successfully.')
      setProfileError(null)
      updateUser(updated)
      refetchProfile()
    },
    onError: (e) => { setProfileError(e.message); setProfileSuccess(null) },
  })

  const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      setPasswordSuccess('Password updated successfully.')
      setPasswordError(null)
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' })
    },
    onError: (e) => { setPasswordError(e.message); setPasswordSuccess(null) },
  })

  const [updateTenant, { loading: updatingTenant }] = useMutation(UPDATE_TENANT, {
    onCompleted: () => { setTenantSuccess('Organization settings updated.'); setTenantError(null); refetchTenant() },
    onError: (e) => { setTenantError(e.message); setTenantSuccess(null) },
  })

  const profile = profileData?.userProfile
  const tenant = tenantData?.tenant

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    updateProfile({
      variables: {
        id: user.id,
        tenantId,
        input: {
          firstName: profileForm.firstName.trim() || null,
          lastName: profileForm.lastName.trim() || null,
          displayName: profileForm.displayName.trim() || null,
          email: profileForm.email.trim(),
          phoneNumber: profileForm.phoneNumber.trim() || null,
        },
      },
    })
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    setPasswordError(null)
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.')
      return
    }
    changePassword({
      variables: {
        id: user.id,
        tenantId,
        input: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
      },
    })
  }

  const handleTenantSubmit = (e) => {
    e.preventDefault()
    updateTenant({
      variables: {
        id: tenant.id,
        tenantId,
        input: {
          organizationName: tenantForm.organizationName.trim() || null,
          displayName: tenantForm.displayName.trim() || null,
          subscriptionPlan: tenantForm.subscriptionPlan.trim() || null,
        },
      },
    })
  }

  if (profileLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and organization settings</p>
      </div>

      {/* Profile */}
      <Section title="Profile" description="Update your personal information">
        <Alert type="success" message={profileSuccess} onDismiss={() => setProfileSuccess(null)} />
        <Alert message={profileError} onDismiss={() => setProfileError(null)} />
        {profile && profileForm && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
                {(profile.firstName?.[0] || profile.username?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">@{profile.username}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={profile.role} label={profile.role} />
                  <Badge variant={profile.status} label={profile.status} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                <input value={profileForm.firstName} onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Jane" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                <input value={profileForm.lastName} onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Smith" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
              <input value={profileForm.displayName} onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Jane Smith" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" required value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
              <input value={profileForm.phoneNumber} onChange={(e) => setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }))} placeholder="+1 555 000 0000" className={inputClass} />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={updatingProfile} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                {updatingProfile && <Spinner size="sm" />}
                Save profile
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* Password */}
      <Section title="Password" description="Change your account password">
        <Alert type="success" message={passwordSuccess} onDismiss={() => setPasswordSuccess(null)} />
        <Alert message={passwordError} onDismiss={() => setPasswordError(null)} />
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
            <input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input type="password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input type="password" required value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" className={inputClass} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={changingPassword} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {changingPassword && <Spinner size="sm" />}
              Update password
            </button>
          </div>
        </form>
      </Section>

      {/* Organization (admin only) */}
      {isAdmin && (
        <Section title="Organization" description="Manage your organization&apos;s details">
          <Alert type="success" message={tenantSuccess} onDismiss={() => setTenantSuccess(null)} />
          <Alert message={tenantError} onDismiss={() => setTenantError(null)} />
          {tenantLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : tenant && tenantForm ? (
            <form onSubmit={handleTenantSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tenant ID</label>
                <input value={tenant.tenantId} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                <p className="text-xs text-gray-400 mt-1">Tenant ID cannot be changed.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                <input value={tenantForm.organizationName} onChange={(e) => setTenantForm((p) => ({ ...p, organizationName: e.target.value }))} placeholder="Acme Corp" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                <input value={tenantForm.displayName} onChange={(e) => setTenantForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Optional display name" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input value={tenant.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subscription plan</label>
                <input value={tenantForm.subscriptionPlan} onChange={(e) => setTenantForm((p) => ({ ...p, subscriptionPlan: e.target.value }))} placeholder="e.g. Pro, Enterprise" className={inputClass} />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={updatingTenant} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                  {updatingTenant && <Spinner size="sm" />}
                  Save organization
                </button>
              </div>
            </form>
          ) : null}
        </Section>
      )}
    </div>
  )
}
