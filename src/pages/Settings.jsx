import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import { GET_USER_PROFILE, UPDATE_PROFILE } from '../api/users'
import { CHANGE_PASSWORD } from '../api/auth'
import { GET_TENANT, UPDATE_TENANT } from '../api/tenants'
import { getSubscriptionStatus, subscribeToPlan, cancelSubscription } from '../api/subscription'
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
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState(null)

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

  const fetchSubscription = () => {
    if (!tenantId) return
    setSubscriptionLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
    getSubscriptionStatus(tenantId, { token })
      .then(setSubscriptionStatus)
      .catch((e) => setSubscriptionError(e.message))
      .finally(() => setSubscriptionLoading(false))
  }

  useEffect(() => {
    fetchSubscription()
  }, [tenantId])

  const handleSubscribe = async (plan) => {
    if (!tenantId) return
    setSubscriptionError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      await subscribeToPlan(tenantId, plan, { token })
      fetchSubscription()
    } catch (e) {
      setSubscriptionError(e.message)
    }
  }

  const handleCancel = async () => {
    if (!tenantId) return
    setSubscriptionError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      await cancelSubscription(tenantId, { token })
      fetchSubscription()
    } catch (e) {
      setSubscriptionError(e.message)
    }
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    updateProfile({
      variables: {
        id: user.id,
        tenantId,
        callerId: user.id,
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

      {/* AI Pricing Subscription */}
      <Section title="AI Pricing Subscription" description="Credit-based plans for AI-assisted pricing. Free: 3/month. Pro: 20/month ($50). Business: 50/month ($100). Unlimited: $200.">
        <Alert message={subscriptionError} onDismiss={() => setSubscriptionError(null)} />
        {subscriptionLoading && !subscriptionStatus ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : subscriptionStatus ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Current plan: {subscriptionStatus.plan}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {subscriptionStatus.limit < 0
                    ? `${subscriptionStatus.used} used this period (unlimited)`
                    : `${subscriptionStatus.used} / ${subscriptionStatus.limit} AI pricings used this billing period`}
                </p>
                {subscriptionStatus.cycleEnd && (
                  <p className="text-xs text-gray-400 mt-1">
                    Cycle ends: {new Date(subscriptionStatus.cycleEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {subscriptionStatus.plan !== 'PRO' && (
                <button
                  onClick={() => handleSubscribe('PRO')}
                  disabled={subscriptionLoading}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60"
                >
                  Upgrade to Pro ($50/mo)
                </button>
              )}
              {subscriptionStatus.plan !== 'BUSINESS' && (
                <button
                  onClick={() => handleSubscribe('BUSINESS')}
                  disabled={subscriptionLoading}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60"
                >
                  Upgrade to Business ($100/mo)
                </button>
              )}
              {subscriptionStatus.plan !== 'UNLIMITED' && (
                <button
                  onClick={() => handleSubscribe('UNLIMITED')}
                  disabled={subscriptionLoading}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60"
                >
                  Upgrade to Unlimited ($200/mo)
                </button>
              )}
              {subscriptionStatus.plan !== 'FREE' && (
                <button
                  onClick={handleCancel}
                  disabled={subscriptionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-200 rounded-xl disabled:opacity-60"
                >
                  Cancel (keeps access until cycle end)
                </button>
              )}
            </div>
          </div>
        ) : null}
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
