import { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import { CHANGE_PASSWORD } from '../api/auth'
import { getSubscriptionStatus, subscribeToPlan, cancelSubscription, resumeSubscription, createCheckoutSession, confirmCheckout, setBillingReminder, createBillingPortalSession } from '../api/subscription'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

/** One settings surface: optional header (title and/or description), else body-only like other app cards. */
function SettingsCard({ title, description, children, className = '' }) {
  const showHeader = Boolean(title) || Boolean(description)
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 ${className}`.trim()}>
      {showHeader ? (
        <div className="px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/40">
          {title ? <h2 className="text-base font-semibold text-gray-900">{title}</h2> : null}
          {description ? (
            typeof description === 'string'
              ? <p className="text-sm text-gray-500 mt-1">{description}</p>
              : <div className="mt-1">{description}</div>
          ) : null}
        </div>
      ) : null}
      <div className="p-6 sm:p-7">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const isAdmin = user?.role === 'ADMIN'

  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState(null)
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })

  const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      setPasswordSuccess('Password updated successfully.')
      setPasswordError(null)
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' })
    },
    onError: (e) => { setPasswordError(e.message); setPasswordSuccess(null) },
  })

  const fetchSubscription = () => {
    if (!tenantId) return Promise.resolve()
    setSubscriptionLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
    return getSubscriptionStatus(tenantId, { token })
      .then(setSubscriptionStatus)
      .catch((e) => setSubscriptionError(e.message))
      .finally(() => setSubscriptionLoading(false))
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchSubscription()
  }, [tenantId, isAdmin])

  // Handle return from Stripe Checkout (admins only — same as AI Pricing visibility)
  useEffect(() => {
    if (!isAdmin) return
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const sessionId = params.get('session_id')
    if (sessionId && tenantId) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      confirmCheckout(tenantId, sessionId, { token })
        .then(() => {
          fetchSubscription()
          window.history.replaceState({}, '', '/app/settings')
        })
        .catch((e) => setSubscriptionError(e.message))
    }
  }, [tenantId, isAdmin])

  const handleSubscribe = async (plan) => {
    if (!tenantId) return
    setSubscriptionError(null)
    const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const successUrl = `${base}/app/settings`
    const cancelUrl = `${base}/app/settings`
    try {
      const data = await createCheckoutSession(tenantId, plan, successUrl, cancelUrl, { token })
      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch (e) {
      if (e.message?.includes('not configured') || e.message?.includes('Contact support')) {
        try {
          await subscribeToPlan(tenantId, plan, { token })
          fetchSubscription()
        } catch (e2) {
          setSubscriptionError(e2.message)
        }
      } else {
        setSubscriptionError(e.message)
      }
    }
  }

  const handleCancel = async () => {
    if (!tenantId) return
    setSubscriptionError(null)
    setSubscriptionLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      await cancelSubscription(tenantId, { token })
      setShowDowngradeConfirm(false)
      await fetchSubscription()
    } catch (e) {
      setSubscriptionError(e.message)
      setSubscriptionLoading(false)
    }
  }

  const handleDowngradeConfirm = async () => {
    await handleCancel()
  }

  const handleResume = async () => {
    if (!tenantId) return
    setSubscriptionError(null)
    setSubscriptionLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      await resumeSubscription(tenantId, { token })
      await fetchSubscription()
    } catch (e) {
      setSubscriptionError(e.message)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleUpdatePaymentMethod = async () => {
    if (!tenantId) return
    setSubscriptionError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      const data = await createBillingPortalSession(tenantId, `${base}/app/settings`, { token })
      if (data.url) window.location.href = data.url
    } catch (e) {
      setSubscriptionError(e.message)
    }
  }

  const handleBillingReminderChange = async (optOut) => {
    if (!tenantId) return
    setSubscriptionError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aether_token') : null
      await setBillingReminder(tenantId, optOut, { token })
      fetchSubscription()
    } catch (e) {
      setSubscriptionError(e.message)
    }
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

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-lg leading-relaxed">
          {isAdmin ? 'Password and AI pricing subscription.' : 'Change your account password.'}
        </p>
      </div>

      <SettingsCard title="Password" description="Change your account password">
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
      </SettingsCard>

      {isAdmin && (
      <SettingsCard title="AI Pricing Subscription" description="Plans, usage, and billing for AI-assisted project pricing.">
        <div className="text-sm text-gray-600 space-y-2 mb-6 pb-6 border-b border-gray-100">
          <p className="leading-relaxed">
            Each plan includes a monthly allowance of AI-assisted pricings. Upgrade anytime as your team grows.
          </p>
          <p className="text-xs text-gray-500">
            Paid plans need a payment method. You can cancel anytime and keep access through the end of the billing period.
          </p>
        </div>
        <Alert message={subscriptionError} onDismiss={() => setSubscriptionError(null)} />
        {subscriptionLoading && !subscriptionStatus ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : subscriptionStatus ? (
          <div className="space-y-6">
            {/* Cancelled / downgrade in progress banner */}
            {subscriptionStatus.cancelledAt && subscriptionStatus.plan !== 'FREE' && (
              <div className="p-5 rounded-xl bg-amber-50 border-2 border-amber-200">
                <h3 className="text-sm font-semibold text-amber-800 mb-3">Subscription cancelled</h3>
                <div className="space-y-2 text-sm text-amber-900">
                  <p className="font-medium">Right now</p>
                  <p>You&apos;re still on <strong>{subscriptionStatus.plan}</strong> with full access until {subscriptionStatus.cycleEnd ? new Date(subscriptionStatus.cycleEnd).toLocaleDateString() : 'the end of your billing period'}. <strong>Your next payment will not be charged.</strong></p>
                  <p className="font-medium mt-4">What happens next</p>
                  <p>On {subscriptionStatus.cycleEnd ? new Date(subscriptionStatus.cycleEnd).toLocaleDateString() : 'that date'}, you&apos;ll switch to <strong>Free</strong> with 3 AI pricings per month.</p>
                  <p className="font-medium mt-4">Change your mind?</p>
                  <p>You can resume your current plan or switch to a different plan below. Your next payment will be charged when the cycle renews.</p>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={handleResume}
                    disabled={subscriptionLoading}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60 transition-colors"
                  >
                    Resume subscription (keep {subscriptionStatus.plan})
                  </button>
                </div>
              </div>
            )}

            {/* Current plan card */}
            <div className={`p-5 rounded-xl border ${subscriptionStatus.cancelledAt && subscriptionStatus.plan !== 'FREE' ? 'bg-gray-50 border-amber-200' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Current plan</span>
                    <Badge>{subscriptionStatus.plan}</Badge>
                    {subscriptionStatus.cancelledAt && subscriptionStatus.plan !== 'FREE' && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Cancelled</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {subscriptionStatus.limit < 0
                      ? `${subscriptionStatus.used} AI pricings used this period (unlimited)`
                      : `${subscriptionStatus.used} of ${subscriptionStatus.limit} AI pricings used this billing period`}
                  </p>
                  {subscriptionStatus.cancelledAt && subscriptionStatus.plan !== 'FREE' && (
                    <p className="text-sm font-medium text-amber-800 mt-2">
                      No further charges. Your next payment will not be charged. Access until {subscriptionStatus.cycleEnd ? new Date(subscriptionStatus.cycleEnd).toLocaleDateString() : 'cycle end'}, then Free (3/mo).
                    </p>
                  )}
                  {subscriptionStatus.cycleEnd && !(subscriptionStatus.cancelledAt && subscriptionStatus.plan !== 'FREE') && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cycle ends {new Date(subscriptionStatus.cycleEnd).toLocaleDateString()}
                      {subscriptionStatus.plan !== 'FREE' && subscriptionStatus.priceUsd > 0 && (
                        <> · Next billing: ${subscriptionStatus.priceUsd}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Plan comparison */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Plans</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'Free', apiName: 'FREE', limit: 3, price: 0, desc: 'Try AI pricing' },
                  { name: 'Pro', apiName: 'PRO', limit: 20, price: 50, desc: 'For growing teams' },
                  { name: 'Business', apiName: 'BUSINESS', limit: 50, price: 100, desc: 'For busy estimators' },
                  { name: 'Unlimited', apiName: 'UNLIMITED', limit: '∞', price: 200, desc: 'No limits' },
                ].map((p) => {
                  const isCurrent = subscriptionStatus.plan === p.apiName
                  const isDowngradingTo = p.apiName === 'FREE' && subscriptionStatus.cancelledAt && subscriptionStatus.plan !== 'FREE'
                  const canUpgrade = subscriptionStatus.plan !== p.apiName && p.apiName !== 'FREE'
                  const canDowngrade = p.apiName === 'FREE' && subscriptionStatus.plan !== 'FREE' && !subscriptionStatus.cancelledAt
                  return (
                    <div
                      key={p.name}
                      className={`relative p-4 rounded-xl border transition-colors ${
                        isCurrent
                          ? 'border-indigo-200 bg-indigo-50/50'
                          : isDowngradingTo
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute top-2 right-2 text-[10px] font-medium text-indigo-600 uppercase tracking-wide">Current</span>
                      )}
                      {isDowngradingTo && (
                        <span className="absolute top-2 right-2 text-[10px] font-medium text-amber-700 uppercase tracking-wide">Downgrading to</span>
                      )}
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                      <p className="text-sm font-medium text-gray-700 mt-2">
                        {p.limit} pricings/mo
                        {p.price > 0 && <span className="text-gray-500 font-normal"> · ${p.price}/mo</span>}
                      </p>
                      {canUpgrade && (
                        <button
                          onClick={() => handleSubscribe(p.apiName)}
                          disabled={subscriptionLoading}
                          className="mt-3 w-full py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60 transition-colors"
                        >
                          {subscriptionStatus.cancelledAt ? `Switch to ${p.name}` : 'Upgrade'}
                        </button>
                      )}
                      {canDowngrade && (
                        <button
                          onClick={() => setShowDowngradeConfirm(true)}
                          disabled={subscriptionLoading}
                          className="mt-3 w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
                        >
                          Downgrade to Free
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
              {subscriptionStatus.plan !== 'FREE' && subscriptionStatus.priceUsd > 0 && subscriptionStatus.stripeConfigured && (
                <button
                  type="button"
                  onClick={handleUpdatePaymentMethod}
                  disabled={subscriptionLoading}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-50 disabled:opacity-60 transition-colors"
                >
                  Update payment method
                </button>
              )}
              {subscriptionStatus.plan !== 'FREE' && !subscriptionStatus.cancelledAt && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!subscriptionStatus.billingReminderOptOut}
                    onChange={(e) => handleBillingReminderChange(!e.target.checked)}
                    disabled={subscriptionLoading}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Email me 5 days before each billing</span>
                </label>
              )}
              {subscriptionStatus.plan !== 'FREE' && !subscriptionStatus.cancelledAt && (
                <button
                  onClick={() => setShowDowngradeConfirm(true)}
                  disabled={subscriptionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-60"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        ) : null}
      </SettingsCard>
      )}

      {isAdmin && (
      <ConfirmDialog
        open={showDowngradeConfirm}
        onClose={() => setShowDowngradeConfirm(false)}
        onConfirm={handleDowngradeConfirm}
        title="Downgrade to Free?"
        message={
          subscriptionStatus?.cycleEnd
            ? `You'll keep access to your current plan until ${new Date(subscriptionStatus.cycleEnd).toLocaleDateString()}. After that, you'll have 3 AI pricings per month.`
            : "You'll have 3 AI pricings per month. Your current plan access will end at the close of this billing cycle."
        }
        confirmLabel="Downgrade to Free"
        loadingLabel="Downgrading…"
        loading={subscriptionLoading}
        variant="neutral"
      />
      )}
    </div>
  )
}
