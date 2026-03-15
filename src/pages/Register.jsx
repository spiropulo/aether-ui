import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { REGISTER } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,28 2,28" fill="currentColor" opacity="0.3" />
              <polygon points="16,2 30,28 2,28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="16" cy="19" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="text-white font-bold text-2xl">Aether</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create an account</h1>
          <p className="text-sm text-gray-500 mb-6">Join your organization on Aether</p>

          <Alert message={error} onDismiss={() => setError(null)} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name *</label>
              <input name="organizationName" type="text" required value={form.organizationName} onChange={handleChange} placeholder="Acme Corp" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                <input name="firstName" type="text" value={form.firstName} onChange={handleChange} placeholder="Jane" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                <input name="lastName" type="text" value={form.lastName} onChange={handleChange} placeholder="Smith" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username *</label>
              <input name="username" type="text" required value={form.username} onChange={handleChange} placeholder="janesmith" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="jane@company.com" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
              <input name="displayName" type="text" value={form.displayName} onChange={handleChange} placeholder="Jane Smith" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading && <Spinner size="sm" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
