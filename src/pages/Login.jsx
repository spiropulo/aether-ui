import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { LOGIN } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import AuthMarketingAside from '../components/marketing/AuthMarketingAside'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

export default function Login() {
  const [form, setForm] = useState({ organizationName: '', username: '', password: '' })
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginMutation, { loading }] = useMutation(LOGIN, {
    onCompleted: ({ login: payload }) => {
      login(payload.token, payload.user)
      navigate('/app/dashboard')
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    loginMutation({
      variables: {
        input: {
          organizationName: form.organizationName.trim(),
          username: form.username.trim(),
          password: form.password,
        },
      },
    })
  }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AuthMarketingAside
        headline="Back to the job at hand."
        sub="Sign in to see every open task, live labor picture, and estimate your team is counting on — whether you’re on the truck or at the desk."
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

        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/60">
            <h1 className="mb-1 text-xl font-bold text-gray-900">Welcome back</h1>
            <p className="mb-6 text-sm text-gray-500">Sign in to your organization</p>

            <Alert message={error} onDismiss={() => setError(null)} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="organizationName">
                  Organization name
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={form.organizationName}
                  onChange={handleChange}
                  placeholder="e.g. Northside Electric"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Your login"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
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
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
              >
                {loading && <Spinner size="sm" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create one
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
