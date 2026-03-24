import { Link } from 'react-router-dom'

/**
 * Admin guide: task calendars, exclusions, and Weekly efficiency labor math.
 * Visual style aligned with EstimatorAgentGuide.
 */
export default function CalendarsWeeklyEfficiencyGuide() {
  return (
    <>
      <style>
        {`
          @keyframes cweg-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.65; }
          }
          @keyframes cweg-bar {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.92); }
          }
          .cweg-pulse { animation: cweg-pulse 2s ease-in-out infinite; }
          .cweg-bar-planned { animation: cweg-bar 2.4s ease-in-out infinite; transform-origin: bottom center; }
          .cweg-bar-actual { animation: cweg-bar 2.4s ease-in-out 0.4s infinite; transform-origin: bottom center; }
        `}
      </style>

      <div className="p-6 md:p-8 max-w-4xl mx-auto pb-16">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link to="/app/dashboard" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <span aria-hidden>→</span>
          <span className="text-gray-600">Learning Center</span>
          <span aria-hidden>→</span>
          <span className="text-gray-900 font-medium">Calendars &amp; weekly efficiency</span>
        </nav>

        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-indigo-50 to-emerald-50 border border-indigo-100/80 p-8 md:p-10 mb-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-sky-200/30 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-emerald-200/25 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-shrink-0 mx-auto md:mx-0 cweg-pulse" aria-hidden>
              <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg">
                <ellipse cx="100" cy="178" rx="56" ry="12" fill="rgb(14 165 233 / 0.12)" />
                <rect x="36" y="40" width="128" height="112" rx="16" fill="white" stroke="#6366f1" strokeWidth="2.5" />
                <text x="100" y="68" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="700">
                  FEB
                </text>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <text key={i} x={52 + i * 16} y="92" textAnchor="middle" fill="#94a3b8" fontSize="8">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </text>
                ))}
                <rect x="48" y="100" width="20" height="16" rx="3" fill="#e0e7ff" stroke="#a5b4fc" />
                <rect x="72" y="100" width="20" height="16" rx="3" fill="#e0e7ff" stroke="#a5b4fc" />
                <rect x="96" y="100" width="20" height="16" rx="3" fill="#d1fae5" stroke="#34d399" />
                <rect x="120" y="100" width="20" height="16" rx="3" fill="#e5e7eb" stroke="#9ca3af" strokeDasharray="3 2" />
                <rect x="48" y="120" width="20" height="16" rx="3" fill="#e0e7ff" stroke="#a5b4fc" />
                <path d="M58 108 L62 112 L70 102" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                <circle cx="154" cy="56" r="22" fill="#f59e0b" opacity="0.95" />
                <text x="154" y="60" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                  8h
                </text>
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">Guide</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
                How calendars drive weekly labor efficiency
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                On each <strong className="text-gray-800">task</strong>, the date range and the little monthly grid are not just for display—they
                tell Aether how many <strong className="text-gray-800">planned</strong> and <strong className="text-gray-800">actual</strong> hours
                belong in the <strong className="text-gray-800">Weekly efficiency</strong> panel on the project.
              </p>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Where you see it</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            Open any <strong>project</strong>, then the <strong>Weekly efficiency</strong> tab. That panel loads a report for the week you pick: totals
            at the top, a bar chart of the last several weeks, and a table of completed offer lines with planned vs actual hours and an efficiency
            percentage.
          </p>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              The intro text on the panel itself summarizes the rules. In short: <strong>planned hours</strong> use each task&apos;s start and end
              dates, counting <strong>every calendar day</strong> in that range that falls in the reporting week, multiplied by your{' '}
              <strong>hours per scheduled workday</strong> (tenant defaults in Settings, optional project overrides), then subtracting any days you
              marked <strong>Remove day</strong> on the task calendar. <strong>Actual hours</strong> use the same kind of day counting from the task
              start through when work was completed, still respecting those exclusions.
            </p>
            <p className="text-sm text-gray-600">
              Week boundaries and the label on the report use your configured <strong>IANA timezone</strong> (and fallbacks with a warning if labor
              settings are incomplete).
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">The task calendar: dates, color, and &ldquo;Remove day&rdquo;</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            On <strong>Task detail</strong>, set <strong>start</strong> and <strong>end</strong> dates to define the window you intend for that task.
            The calendar grid shows the whole month; days inside your range can be toggled off the timeline without changing the formal start/end
            dates.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">Remove day / Include day</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                For dates inside the task range, <strong>Remove day</strong> excludes that date from the visual timeline and from{' '}
                <strong>both</strong> planned and actual labor math for weekly efficiency. <strong>Include day</strong> puts it back.
              </p>
              <p className="text-sm text-gray-700">
                Struck-through day numbers in the grid mean that day is excluded—useful for holidays, weather days, or partial-week crews without
                editing the end date.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-emerald-900 mb-2">Calendar color</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                The swatch only affects how the task appears on the <strong>project calendar</strong> (chips and stacking). It does not change hour
                calculations.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12 rounded-2xl bg-slate-50 border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Worked example: one task, one week</h2>
          <p className="text-sm text-gray-600 text-center max-w-xl mx-auto mb-8">
            Suppose Settings say <strong>8 hours</strong> per scheduled workday (and you have not narrowed the window with project overrides). A task
            runs <strong>Monday Feb 3 → Friday Feb 7</strong> with <strong>no</strong> removed days. Every day in that span is a calendar day in range,
            so that&apos;s <strong>5 days × 8 h = 40 h</strong> of <strong>planned</strong> labor for spans that fall in the same reporting week.
          </p>
          <div className="max-w-md mx-auto flex items-end justify-center gap-4 h-32" aria-hidden>
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 rounded-t bg-indigo-300 cweg-bar-planned"
                style={{ height: '85%' }}
                title="Planned"
              />
              <span className="text-xs text-gray-500">Planned</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 rounded-t bg-emerald-600 cweg-bar-actual"
                style={{ height: '68%' }}
                title="Actual"
              />
              <span className="text-xs text-gray-500">Actual</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-6 max-w-lg mx-auto">
            If the crew finished faster, <strong>actual</strong> hours might be lower than planned—the bar chart&apos;s green column shorter than the
            purple one—and <strong>efficiency</strong> (planned ÷ actual × 100) would be <strong>above 100%</strong>. If work ran long, actual exceeds
            planned and efficiency drops below 100%.
          </p>
          <p className="text-center text-sm text-gray-600 mt-3 max-w-lg mx-auto">
            Now remove <strong>Wednesday</strong> with <strong>Remove day</strong>: only <strong>4</strong> days count →{' '}
            <strong>32 h</strong> planned instead of 40 h for that window.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">What the filters change</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            None of these filters edit your tasks—they only change <strong>which slice</strong> of the report you are viewing.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Control</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">What it does</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Jump to week</td>
                  <td className="px-4 py-3 text-gray-600">
                    Pick any date in the week you care about, or click a bar in the scrollable chart. The report uses your labor timezone for week boundaries.
                  </td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">Week starts on</td>
                  <td className="px-4 py-3 text-gray-600">Monday (ISO) vs Sunday (US) changes how week buckets align on the chart and totals.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Filter by assignee</td>
                  <td className="px-4 py-3 text-gray-600">Limits rows to offers that include that team member.</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">Filter by task</td>
                  <td className="px-4 py-3 text-gray-600">Shows only offer lines tied to the chosen task.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reading the table</h2>
          <p className="text-gray-600 mb-4 max-w-2xl">
            Rows appear when an offer line is marked <strong>complete</strong> and the completion time falls in the selected week (again, in the
            report timezone). <strong>Planned</strong> and <strong>actual</strong> are computed from calendars and workday settings—not from typing
            hours manually on the line.
          </p>
          <div className="space-y-3">
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl" aria-hidden>
                📊
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Summary cards</p>
                <p className="text-sm text-gray-600">
                  The top row shows aggregate <strong>planned</strong>, <strong>actual</strong>, and <strong>efficiency</strong> for the filtered set
                  in that week, plus how many lines completed.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-xl" aria-hidden>
                📅
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Scrollable week chart</p>
                <p className="text-sm text-gray-600">
                  Purple bars are planned hours per week; green are actual. Scroll sideways, click a week to load details, or jump to a date.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Put it into practice</h2>
          <p className="text-indigo-100 text-sm mb-6 max-w-lg mx-auto">
            Set labor timezone and workday length in Settings, keep task dates accurate, use Remove day for real non-work days, then review Weekly
            efficiency on the project.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/app/settings"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
            >
              Open Settings
            </Link>
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-2 bg-indigo-500/30 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/30 hover:bg-indigo-500/50 transition-colors"
            >
              Go to Projects
            </Link>
            <Link
              to="/app/learning/train-estimator"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/25 hover:bg-white/20 transition-colors"
            >
              Train Estimator guide
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
