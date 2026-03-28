const values = [
  {
    title: 'Respect for the work',
    description:
      'We build for people who measure success in finished jobs, happy clients, and fair pay — not vanity metrics.',
  },
  {
    title: 'Clarity over clutter',
    description:
      'You shouldn’t need a certification to run your own company. Aether stays understandable on a phone between site visits.',
  },
  {
    title: 'Honest numbers',
    description:
      'Labor, materials, and scope should line up. We help you see where margin lives — and where it leaks.',
  },
  {
    title: 'AI as a teammate',
    description:
      'Estimation and training features learn from how you already work — they don’t replace your judgment.',
  },
]

export default function About() {
  return (
    <main className="overflow-x-hidden">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 pt-16 py-28 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.25),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-3xl px-6">
          <p className="marketing-fade-up text-sm font-semibold uppercase tracking-widest text-indigo-300/90">
            About Aether
          </p>
          <h1 className="marketing-fade-up marketing-delay-1 mt-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Software that speaks
            <span className="mt-2 block bg-gradient-to-r from-amber-200 via-white to-emerald-200 bg-clip-text text-transparent">
              contractor, crew & classroom.
            </span>
          </h1>
          <p className="marketing-fade-up marketing-delay-2 mt-8 text-lg leading-relaxed text-indigo-100/75">
            We started Aether because service and trade businesses deserve tools as serious as they are — not
            watered-down enterprise suites or toy apps. Whether you pour concrete, trim hedges, wire panels, or
            tutor the next generation, your projects deserve one steady place to live.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Our mission</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Give every skilled team — from two vans to two dozen crews — the same clarity big shops get from
              expensive systems: projects, tasks, time, costs, and smarter estimates, without the enterprise
              headache.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              We’re obsessed with the handoff from “we think this job is about…” to “here’s the plan, the hours,
              and the number.” That’s where trust is won.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map(({ title, description }, i) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50/80 to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <h3 className="text-sm font-bold text-indigo-900">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Who we’re building with</h2>
          <p className="mt-4 text-slate-600">
            General contractors, landscapers, plumbers, electricians, cleaners, tutors, handymen, property
            managers — anyone who sells skilled time and stands behind the outcome. If that’s you, we’re
            listening.
          </p>
        </div>
      </section>
    </main>
  )
}
