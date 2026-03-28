import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { REGISTER } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import AuthMarketingAside from '../components/marketing/AuthMarketingAside'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

export default function Register() {
  const [form, setForm] = useState({
    organizationName: '',
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    displayName: '',
  })
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const [registerMutation, { loading }] = useMutation(REGISTER, {
    onCompleted: ({ register: payload }) => {
      login(payload.token, payload.user)
      navigate('/app/dashboard')
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    registerMutation({
      variables: {
        input: {
          organizationName: form.organizationName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          displayName: form.displayName.trim() || undefined,
        },
      },
    })
  }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AuthMarketingAside
        expandable
        headline="Your crew deserves one place for every job."
        sub="Create your organization and you’ll be the admin — invite plumbers, landscapers, tutors, or whoever runs the work with you. Same workspace, same truth."
      />

      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-8">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2 rounded-xl py-1 outline-offset-4 transition hover:bg-slate-200/60 focus-visible:ring-2 focus-visible:ring-indigo-400 lg:hidden"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg">
            <svg className="h-5 w-5 text-white" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,28 2,28" fill="currentColor" opacity="0.3" />
              <polygon
                points="16,2 30,28 2,28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="19" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900">Aether</span>
        </Link>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/60">
            <h1 className="mb-1 text-xl font-bold text-gray-900">Create your workspace</h1>
            <p className="mb-6 text-sm text-gray-500">
              One organization name = one team. You can invite members after you&apos;re in.
            </p>

            <Alert message={error} onDismiss={() => setError(null)} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Organization name *</label>
                <input
                  name="organizationName"
                  type="text"
                  required
                  value={form.organizationName}
                  onChange={handleChange}
                  placeholder="e.g. Riverbend Landscaping"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">First name</label>
                  <input
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Jamie"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Last name</label>
                  <input
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Smith"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Username *</label>
                <input
                  name="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={handleChange}
                  placeholder="jamieo"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jamie@yourcompany.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Display name</label>
                <input
                  name="displayName"
                  type="text"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Jamie Smith"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password *</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
              >
                {loading && <Spinner size="sm" />}
                {loading ? 'Creating workspace…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
            <p className="mt-4 text-center">
              <Link to="/" className="text-xs font-medium text-slate-400 hover:text-slate-600">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
