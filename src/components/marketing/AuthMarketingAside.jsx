import { useState } from 'react'
import { Link } from 'react-router-dom'

const highlights = [
  {
    id: 'trades',
    icon: '🏠',
    text: 'Construction, trades & outdoor crews',
    detail:
      'Run crews and job sites with clear roles, time on the clock, and estimates that reflect how you actually price work. Keep scope, materials, and labor aligned so everyone sees the same picture from bid to punch list.',
  },
  {
    id: 'services',
    icon: '🎓',
    text: 'Tutors, coaches & pro services',
    detail:
      'Book sessions, track packages, and stay organized across clients without spreadsheets. Aether helps you capture what you offer, how you bill, and what each engagement needs so scheduling and follow-up stay in one place.',
  },
  {
    id: 'tasks',
    icon: '⚡',
    text: 'Tasks, labor & AI-aware estimates',
    detail:
      'Break work into tasks, assign labor, and lean on AI where it helps—without losing your rules. Turn rough inputs into structured estimates your team can trust, then refine them as the job evolves.',
  },
]

export default function AuthMarketingAside({ headline, sub, expandable = false }) {
  const [openId, setOpenId] = useState(null)

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-10 text-white lg:flex lg:w-[46%] xl:p-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.4),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl marketing-float"
      />
      <div className="relative z-10">
        <Link
          to="/"
          className="flex w-fit items-center gap-2 rounded-xl font-bold text-xl text-white outline-offset-4 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,28 2,28" fill="currentColor" className="text-indigo-300" opacity="0.35" />
              <polygon
                points="16,2 30,28 2,28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
                className="text-white"
              />
              <circle cx="16" cy="19" r="2.5" fill="currentColor" className="text-white" />
            </svg>
          </span>
          Aether
        </Link>

        <h2 className="mt-14 text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">{headline}</h2>
        <p className="mt-4 text-base leading-relaxed text-indigo-100/75">{sub}</p>

        <ul className="mt-10 space-y-4">
          {highlights.map((h, i) => {
            const isOpen = expandable && openId === h.id
            const delayMs = 80 * i

            if (!expandable) {
              return (
                <li
                  key={h.id}
                  style={{ animationDelay: `${delayMs}ms` }}
                  className="marketing-aside-item-enter flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium backdrop-blur-sm transition hover:border-white/20"
                >
                  <span className="text-xl" aria-hidden>
                    {h.icon}
                  </span>
                  {h.text}
                </li>
              )
            }

            return (
              <li
                key={h.id}
                style={{ animationDelay: `${delayMs}ms` }}
                className="marketing-aside-item-enter rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors hover:border-white/25"
              >
                <button
                  type="button"
                  onClick={() => toggle(h.id)}
                  aria-expanded={isOpen}
                  aria-controls={`aside-detail-${h.id}`}
                  id={`aside-trigger-${h.id}`}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-white/[0.06] active:scale-[0.99]"
                >
                  <span className="text-xl shrink-0" aria-hidden>
                    {h.icon}
                  </span>
                  <span className="min-w-0 flex-1">{h.text}</span>
                  <span
                    className={`shrink-0 text-indigo-200/80 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`aside-detail-${h.id}`}
                  role="region"
                  aria-labelledby={`aside-trigger-${h.id}`}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p
                      className={`border-t border-white/10 px-4 pb-4 pt-3 text-sm leading-relaxed text-indigo-100/85 ${isOpen ? 'marketing-detail-reveal' : ''}`}
                    >
                      {h.detail}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="relative z-10 text-xs leading-relaxed text-indigo-200/50">
        Secure workspaces for your organization. Your jobs, hours, and pricing knowledge stay yours.
      </p>
    </div>
  )
}
