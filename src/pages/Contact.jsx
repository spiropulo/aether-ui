import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 pt-16 py-24 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-3xl marketing-float"
        />
        <div className="relative mx-auto max-w-2xl px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">Let&apos;s talk shop</h1>
          <p className="mt-6 text-lg leading-relaxed text-indigo-100/75">
            Questions about Aether, a bigger crew rollout, or whether we fit your trade? Drop a note — we read
            every message.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-16 lg:px-8">
        {submitted ? (
          <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-lg shadow-emerald-100/30">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl shadow-lg">
              ✓
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">You&apos;re on the list</h2>
            <p className="mt-2 text-slate-600">
              Thanks for reaching out. We&apos;ll get back as soon as we can — usually within a business day.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false)
                setForm({ name: '', email: '', message: '' })
              }}
              className="mt-8 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-10"
          >
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Jamie Smith"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="jamie@yourcompany.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700">
                What&apos;s on your mind?
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your trade, team size, or what you wish your software did today…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-500 hover:to-violet-500"
            >
              Send message
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
