import { Link } from 'react-router-dom'

/**
 * Admin-only explainer: tenant vs project training for the Estimator (Tenant-Adaptive) agent.
 * Uses inline CSS for SVG / mascot animations (no external assets).
 */
export default function EstimatorAgentGuide() {
  return (
    <>
      <style>
        {`
          @keyframes eag-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes eag-wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(12deg); }
            75% { transform: rotate(-8deg); }
          }
          @keyframes eag-sparkle {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.15); }
          }
          @keyframes eag-float-doc {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-6px) rotate(2deg); }
          }
          @keyframes eag-dash {
            to { stroke-dashoffset: -24; }
          }
          .eag-bob { animation: eag-bob 2.8s ease-in-out infinite; }
          .eag-wave { animation: eag-wave 2s ease-in-out infinite; transform-origin: 100px 118px; }
          .eag-sparkle-a { animation: eag-sparkle 1.8s ease-in-out infinite; }
          .eag-sparkle-b { animation: eag-sparkle 2.2s ease-in-out 0.4s infinite; }
          .eag-sparkle-c { animation: eag-sparkle 1.5s ease-in-out 0.2s infinite; }
          .eag-float-doc { animation: eag-float-doc 3s ease-in-out infinite; }
          .eag-flow-line { stroke-dasharray: 8 4; animation: eag-dash 1.2s linear infinite; }
        `}
      </style>

      <div className="p-6 md:p-8 max-w-4xl mx-auto pb-16">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link to="/app/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
          <span aria-hidden>→</span>
          <span className="text-gray-600">Learning Center</span>
          <span aria-hidden>→</span>
          <span className="text-gray-900 font-medium">Train your Estimator</span>
        </nav>

        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 via-indigo-50 to-amber-50 border border-indigo-100/80 p-8 md:p-10 mb-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-indigo-200/30 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-amber-200/25 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-8">
            <div className="eag-bob flex-shrink-0 mx-auto md:mx-0" aria-hidden>
              <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg">
                <ellipse cx="100" cy="168" rx="48" ry="10" fill="rgb(99 102 241 / 0.15)" />
                <rect x="52" y="48" width="96" height="100" rx="28" fill="#6366f1" />
                <rect x="60" y="56" width="80" height="72" rx="20" fill="#e0e7ff" />
                <circle cx="78" cy="88" r="10" fill="#1e1b4b" />
                <circle cx="122" cy="88" r="10" fill="#1e1b4b" />
                <circle cx="81" cy="85" r="3" fill="white" />
                <circle cx="125" cy="85" r="3" fill="white" />
                <path d="M82 108 Q100 122 118 108" fill="none" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round" />
                <rect x="88" y="28" width="24" height="22" rx="6" fill="#f59e0b" className="eag-sparkle-a" />
                <g className="eag-wave">
                  <rect x="138" y="96" width="36" height="8" rx="4" fill="#a5b4fc" />
                  <rect x="138" y="108" width="28" height="8" rx="4" fill="#a5b4fc" />
                </g>
                <circle cx="36" cy="64" r="6" fill="#fbbf24" className="eag-sparkle-a" />
                <circle cx="170" cy="52" r="5" fill="#f472b6" className="eag-sparkle-b" />
                <path d="M44 120 L52 128 L44 136" fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">Admin guide</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
                Teach your Estimator agent like a friendly coworker
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Aether&apos;s <strong className="text-gray-800">Tenant-Adaptive agent</strong> reads your training data when it prices projects.
                You can teach it once for the whole company, then fine-tune per job. Here&apos;s how the two layers play together—no jargon required.
              </p>
            </div>
          </div>
        </header>

        {/* Two worlds illustration */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Two layers, one brain</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">
            Think of <strong>general training</strong> as your company handbook, and <strong>project training</strong> as sticky notes on a single folder.
            The agent always looks at both—but the sticky notes win when they disagree.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="eag-float-doc mb-4 flex justify-center" aria-hidden>
                <svg width="140" height="120" viewBox="0 0 140 120">
                  <circle cx="70" cy="100" r="50" fill="rgb(99 102 241 / 0.12)" />
                  <ellipse cx="70" cy="22" rx="36" ry="10" fill="#c7d2fe" />
                  <rect x="34" y="18" width="72" height="72" rx="8" fill="white" stroke="#6366f1" strokeWidth="2.5" />
                  <path d="M46 38h48M46 52h36M46 66h42" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="100" cy="14" r="14" fill="#22c55e" />
                  <path d="M94 14l4 4 8-8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-indigo-900 mb-2">General (organization) level</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Lives under <strong>AI Training</strong> in the sidebar. Every project in your workspace inherits this knowledge by default.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>Default material rates, labor habits, and how you usually describe work</li>
                <li>Structured pricing facts (units, multipliers) extracted from your notes</li>
                <li>Best for: &ldquo;This is how we usually price across all our jobs.&rdquo;</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50/50 to-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="eag-float-doc mb-4 flex justify-center" style={{ animationDelay: '0.5s' }} aria-hidden>
                <svg width="140" height="120" viewBox="0 0 140 120">
                  <rect x="28" y="24" width="84" height="72" rx="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" />
                  <rect x="38" y="36" width="64" height="8" rx="2" fill="#fcd34d" />
                  <rect x="38" y="50" width="48" height="8" rx="2" fill="#fde68a" />
                  <rect x="38" y="64" width="56" height="8" rx="2" fill="#fde68a" />
                  <circle cx="100" cy="30" r="18" fill="#f97316" className="eag-sparkle-c" />
                  <text x="100" y="30" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="bold">P</text>
                  <path d="M20 88 L8 100 L20 112" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-amber-900 mb-2">Project level</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Open any <strong>project</strong>, then the <strong>Custom Training Data</strong> tab (admins only). Only that project sees this extra context.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>Overrides or adds detail when this job is special (premium materials, remote site, rush rates)</li>
                <li>Does not replace global training—it <strong>layers on top</strong> and wins conflicts</li>
                <li>Best for: &ldquo;On <em>this</em> build, lumber is 20% higher&rdquo; or client-specific rules</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Animated merge diagram */}
        <section className="mb-12 rounded-2xl bg-slate-50 border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">What happens when the agent prices a job?</h2>
          <div className="max-w-lg mx-auto" aria-hidden>
            <svg viewBox="0 0 360 200" className="w-full h-auto">
              <defs>
                <linearGradient id="eag-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="eag-g2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <rect x="20" y="40" width="100" height="56" rx="12" fill="url(#eag-g1)" opacity="0.9" className="eag-bob" />
              <text x="70" y="62" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Global</text>
              <text x="70" y="78" textAnchor="middle" fill="#e0e7ff" fontSize="9">AI Training</text>

              <rect x="240" y="40" width="100" height="56" rx="12" fill="url(#eag-g2)" opacity="0.95" className="eag-bob" style={{ animationDelay: '0.4s' }} />
              <text x="290" y="62" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Project</text>
              <text x="290" y="78" textAnchor="middle" fill="#fffbeb" fontSize="9">Custom tab</text>

              <path d="M120 68 C 160 68, 160 100, 180 100" fill="none" stroke="#94a3b8" strokeWidth="2" className="eag-flow-line" />
              <path d="M240 68 C 200 68, 200 100, 180 100" fill="none" stroke="#94a3b8" strokeWidth="2" className="eag-flow-line" style={{ animationDelay: '0.3s' }} />

              <circle cx="180" cy="100" r="36" fill="#1e293b" className="eag-bob" style={{ animationDelay: '0.2s' }} />
              <circle cx="180" cy="100" r="42" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.5" className="eag-bob" style={{ animationDuration: '2s' }} />
              <text x="180" y="96" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Merged</text>
              <text x="180" y="110" textAnchor="middle" fill="#94a3b8" fontSize="8">context</text>

              <path d="M180 136 L180 168" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 3" className="eag-flow-line" />
              <rect x="130" y="168" width="100" height="28" rx="8" fill="#10b981" />
              <text x="180" y="186" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Request pricing</text>
            </svg>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4 max-w-md mx-auto">
            Before each run, the system blends <strong>global</strong> and <strong>project</strong> training with your tasks, calendar, and offer assignees.
            Project-specific facts override overlapping global ones so the agent stays accurate for that bid.
          </p>
        </section>

        {/* Comparison */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Topic</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-800">General (AI Training)</th>
                  <th className="text-left px-4 py-3 font-semibold text-amber-900">Project (Custom Training)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Who sees it?</td>
                  <td className="px-4 py-3 text-gray-600">All projects in your org</td>
                  <td className="px-4 py-3 text-gray-600">That one project only</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">When to edit?</td>
                  <td className="px-4 py-3 text-gray-600">Your standards changed company-wide</td>
                  <td className="px-4 py-3 text-gray-600">This job breaks the usual rules</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Conflicts</td>
                  <td className="px-4 py-3 text-gray-600">Baseline defaults</td>
                  <td className="px-4 py-3 text-gray-600">Wins over global for the same topic</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">Pricing run</td>
                  <td className="px-4 py-3 text-gray-600">Always included if configured</td>
                  <td className="px-4 py-3 text-gray-600">Included only when you open that project</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Tips with mini cartoons */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Friendly tips from the mascot</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-lime-100 flex items-center justify-center eag-bob" aria-hidden>
                <span className="text-2xl" role="img" aria-label="">🌱</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Start broad, then specialize</p>
                <p className="text-sm text-gray-600">Put durable defaults in <strong>AI Training</strong> first. Add project notes only where reality diverges—you&apos;ll maintain less over time.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center eag-float-doc" aria-hidden>
                <span className="text-2xl" role="img" aria-label="">📅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">The agent looks at your calendar too</p>
                <p className="text-sm text-gray-600">Task dates and offer assignees help with labor-style lines. Training text explains <em>rates and rules</em>; the schedule explains <em>how much time</em> to allow.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center eag-sparkle-a" aria-hidden>
                <span className="text-2xl" role="img" aria-label="">✨</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Structured facts + plain language</p>
                <p className="text-sm text-gray-600">Use the form to add entries and pricing facts. Clear units and round numbers help the agent stay consistent when it updates offers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Ready to train?</h2>
          <p className="text-indigo-100 text-sm mb-6 max-w-lg mx-auto">
            Jump into AI Training for organization-wide defaults, or open a project and use the Custom Training Data tab for job-specific tweaks.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/app/training"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
            >
              Open AI Training
            </Link>
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-2 bg-indigo-500/30 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/30 hover:bg-indigo-500/50 transition-colors"
            >
              Go to Projects
            </Link>
            <Link
              to="/app/learning/calendars-weekly-efficiency"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/25 hover:bg-white/20 transition-colors"
            >
              Calendars &amp; weekly efficiency
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
