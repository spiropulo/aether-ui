import { Link } from 'react-router-dom'
import TradeMarquee from '../components/marketing/TradeMarquee'

const industries = [
  {
    title: 'Build & remodel',
    subtitle: 'Construction & trades',
    emoji: '🏗️',
    blurb: 'Track phases, crews, and materials without drowning in spreadsheets.',
    accent: 'from-amber-500/20 to-orange-600/10',
  },
  {
    title: 'Outdoor & grounds',
    subtitle: 'Landscaping & property care',
    emoji: '🌿',
    blurb: 'Seasonal routes, recurring jobs, and labor hours in one calm dashboard.',
    accent: 'from-emerald-500/20 to-teal-600/10',
  },
  {
    title: 'Home services',
    subtitle: 'Plumbing, electrical & more',
    emoji: '🔧',
    blurb: 'Dispatch faster, document every visit, and price the next job with confidence.',
    accent: 'from-sky-500/20 to-blue-600/10',
  },
  {
    title: 'People businesses',
    subtitle: 'Tutoring & professional services',
    emoji: '📚',
    blurb: 'Sessions, packages, and team capacity — organized like the pros you are.',
    accent: 'from-violet-500/20 to-purple-600/10',
  },
]

const pillars = [
  {
    title: 'Jobs that actually make sense',
    description:
      'Break work into clear tasks and offers. Everyone sees what’s next — from the field to the office.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Labor & costs you can trust',
    description:
      'Capture hours, rates, and materials per task. Roll up totals so every quote is grounded in reality.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'AI that learns your business',
    description:
      'Train Aether on how you price and scope work. Get smarter estimates and fewer surprises on bid day.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: 'One workspace for your crew',
    description:
      'Roles, permissions, and a shared picture of every client project — without the enterprise price tag.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: 'Documents & estimates in flow',
    description:
      'Connect pricing knowledge and PDF workflows so winning a job doesn’t mean rebuilding the plan from scratch.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: 'Built for real companies',
    description:
      'Separate, secure workspaces per organization — whether you’re a three-person crew or a growing multi-trade shop.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
      </svg>
    ),
  },
]

const quotes = [
  {
    text: 'We finally stopped losing margin on “small” add-ons. Every task has a number.',
    who: 'Ops lead, regional remodeling team',
  },
  {
    text: 'The crew actually uses it. That’s the bar — and Aether clears it.',
    who: 'Owner, landscaping company',
  },
]

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.35),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl marketing-pulse-glow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl marketing-float"
        />

        <div className="relative z-10 mx-auto max-w-5xl px-6 pt-10 pb-8 text-center lg:px-8">
          <p className="marketing-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-indigo-200 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Built for teams who show up on site — not just on Slack
          </p>

          <h1 className="marketing-fade-up marketing-delay-1 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Run projects, labor &amp; estimates
            <span className="mt-2 block marketing-shimmer-text md:mt-3">like the pros you already are.</span>
          </h1>

          <p className="marketing-fade-up marketing-delay-2 mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-indigo-100/75 md:text-xl">
            Aether is the calm command center for construction, trades, outdoor work, tutoring, and every
            service business in between. Track the job, the hours, and the numbers — then let AI help you
            bid the next one with confidence.
          </p>

          <div className="marketing-fade-up marketing-delay-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-4 text-center text-sm font-bold text-white shadow-lg shadow-indigo-900/50 transition hover:from-indigo-400 hover:to-violet-400 hover:shadow-indigo-800/60 sm:w-auto"
            >
              Start free — set up your workspace
            </Link>
            <Link
              to="/login"
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 sm:w-auto"
            >
              Sign in to your org
            </Link>
          </div>

          <p className="marketing-fade-up marketing-delay-4 mt-6 text-sm text-indigo-200/50">
            No credit card to explore · Your team · Your jobs · One place
          </p>
        </div>

        <div className="relative z-10 mt-6">
          <TradeMarquee />
        </div>
      </section>

      {/* Industries */}
      <section className="relative bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              If you sell skilled work, you&apos;re home here.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From dirt under the nails to whiteboard sessions — if there&apos;s a scope, a schedule, and a
              crew, Aether fits.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((card, i) => (
              <div
                key={card.title}
                className={`group relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/50 ${card.accent}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="text-4xl marketing-float" aria-hidden>
                  {card.emoji}
                </span>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{card.subtitle}</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.blurb}</p>
                <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/40 opacity-0 blur-2xl transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="features" className="border-t border-slate-100 bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Everything wired together
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Not another generic PM tool. Aether connects projects, tasks, labor, costs, and AI-assisted
              pricing — the way service businesses actually operate.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map(({ title, description, icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition duration-300 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                  {icon}
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="bg-gradient-to-br from-indigo-950 to-slate-950 py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-indigo-300/80">
            Why teams switch
          </p>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {quotes.map((q) => (
              <blockquote
                key={q.text}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition hover:border-indigo-400/30"
              >
                <p className="text-lg font-medium leading-relaxed text-white md:text-xl">&ldquo;{q.text}&rdquo;</p>
                <footer className="mt-6 text-sm text-indigo-200/70">— {q.who}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-indigo-600 py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 text-center md:grid-cols-4 lg:px-8">
          {[
            ['Faster handoffs', 'From bid to build without retyping the plan'],
            ['Clear labor math', 'Hours and rates that roll up automatically'],
            ['AI that knows you', 'Estimates grounded in your own history'],
            ['Room to grow', 'Multi-user workspaces built for real orgs'],
          ].map(([title, sub]) => (
            <div key={title}>
              <p className="text-lg font-bold text-white">{title}</p>
              <p className="mt-1 text-sm text-indigo-100/80">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-8 py-16 text-center shadow-2xl shadow-indigo-900/30 md:px-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Ready to see your next job in one clear picture?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-indigo-200/75">
            Create your workspace in minutes. Bring your team when you&apos;re ready — same login, same truth.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="w-full rounded-2xl bg-white px-8 py-4 text-sm font-bold text-indigo-950 shadow-lg transition hover:bg-indigo-50 sm:w-auto"
            >
              Create your organization
            </Link>
            <Link
              to="/contact"
              className="w-full rounded-2xl border border-white/25 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5 sm:w-auto"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
