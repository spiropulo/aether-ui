import { useMemo, useRef, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { WEEKLY_LABOR_EFFICIENCY } from '../api/projects'
import Spinner from './ui/Spinner'
import Alert from './ui/Alert'
import EmptyState from './ui/EmptyState'

function toDateInputValue(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function memberLabel(id, teamMembers) {
  const m = teamMembers.find((t) => t.id === id)
  if (!m) return id
  return m.displayName || [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.username || m.email || id
}

function formatPct(v) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${v.toFixed(1)}%`
}

function formatHours(v) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${Number(v).toFixed(2)}h`
}

function formatCompletedAt(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function barTooltip(w) {
  const pct = w.laborEfficiencyPercent != null ? ` · ${formatPct(w.laborEfficiencyPercent)} efficiency` : ''
  return `${w.weekLabel}\nPlanned ${formatHours(w.plannedHours)} · Actual ${formatHours(w.actualHours)}${pct}\nClick to show this week below`
}

/** Turns each literal "Settings" in API copy into a link to workspace labor fields. */
function laborConfigWarningWithSettingsLinks(text) {
  const parts = text.split(/(\bSettings\b)/)
  return parts.map((part, i) =>
    part === 'Settings' ? (
      <Link
        key={i}
        to="/app/settings"
        className="font-semibold text-amber-950 underline decoration-amber-700/60 underline-offset-2 hover:decoration-amber-950"
      >
        Settings
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

/**
 * @param {object} props
 * @param {string} props.projectId
 * @param {string} props.tenantId
 * @param {Array<{id: string, name: string}>} props.tasks
 * @param {Array<object>} props.teamMembers
 * @param {boolean} props.active
 * @param {string} props.weekContainingDate YYYY-MM-DD
 * @param {(v: string) => void} props.onWeekContainingDateChange
 * @param {'ISO_MONDAY' | 'US_SUNDAY'} props.weekStartMode
 * @param {(v: string) => void} props.onWeekStartModeChange
 * @param {string} props.assigneeFilter
 * @param {(v: string) => void} props.onAssigneeFilterChange
 * @param {string} props.taskFilter
 * @param {(v: string) => void} props.onTaskFilterChange
 */
export default function WeeklyEfficiencyPanel({
  projectId,
  tenantId,
  tasks = [],
  teamMembers = [],
  active,
  weekContainingDate,
  onWeekContainingDateChange,
  weekStartMode,
  onWeekStartModeChange,
  assigneeFilter,
  onAssigneeFilterChange,
  taskFilter,
  onTaskFilterChange,
}) {
  const { data, loading, error } = useQuery(WEEKLY_LABOR_EFFICIENCY, {
    variables: {
      projectId,
      tenantId,
      weekContainingDate,
      weekStartMode,
      assigneeId: assigneeFilter || null,
      taskId: taskFilter || null,
    },
    skip: !active || !tenantId || !projectId,
    fetchPolicy: 'network-only',
  })

  const report = data?.weeklyLaborEfficiency
  const selectedBarRef = useRef(null)
  const prevWeekForScrollRef = useRef(null)

  const chartMax = useMemo(() => {
    if (!report?.chartWeeks?.length) return 1
    let m = 0.01
    for (const w of report.chartWeeks) {
      m = Math.max(m, w.plannedHours ?? 0, w.actualHours ?? 0)
    }
    return m
  }, [report])

  useEffect(() => {
    if (loading || !selectedBarRef.current) return
    const shouldScroll =
      prevWeekForScrollRef.current === null || prevWeekForScrollRef.current !== weekContainingDate
    prevWeekForScrollRef.current = weekContainingDate
    if (!shouldScroll) return
    const el = selectedBarRef.current
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    })
  }, [loading, weekContainingDate, report?.weekStart])

  if (!active) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Weekly efficiency</h2>
          <p className="text-sm text-gray-500 mt-1">
            Planned hours come from each task&apos;s start/end dates: every calendar day that overlaps the selected week × hours per scheduled day (from Settings, with optional project overrides), minus any days removed on the task calendar. Actual hours count the same kind of days from the task start through each line&apos;s completion date, with the same exclusions (per task, the largest such value when multiple lines finish in the same week). Week boundaries use{' '}
            <span className="font-medium text-gray-700">{report?.timezone ?? 'America/Los_Angeles'}</span>. Efficiency = planned ÷ actual × 100 when both
            are positive; over 100% means less time than planned.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 items-start lg:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Week starts on</label>
            <select
              value={weekStartMode}
              onChange={(e) => onWeekStartModeChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none min-w-[10rem]"
            >
              <option value="ISO_MONDAY">Monday (ISO)</option>
              <option value="US_SUNDAY">Sunday (US)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jump to week</label>
            <input
              type="date"
              value={weekContainingDate}
              onChange={(e) => onWeekContainingDateChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
              title="Any date in the week you want to inspect"
            />
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter by assignee</label>
            <select
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            >
              <option value="">All assignees</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {memberLabel(m.id, teamMembers)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter by task</label>
            <select
              value={taskFilter}
              onChange={(e) => onTaskFilterChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            >
              <option value="">All tasks</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => onWeekContainingDateChange(toDateInputValue(new Date()))}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-2"
          >
            This week
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && <Alert message={error.message} />}
        {loading && !report && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}
        {report && (
          <>
            {report.laborConfigWarning ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
                {laborConfigWarningWithSettingsLinks(report.laborConfigWarning)}
              </div>
            ) : null}

            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Planned vs actual by week</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Scroll sideways to browse history. Click a week to load totals and the table below. The highlighted week matches your date or last
                    click.
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{report.chartWeeks?.length ?? 0} weeks shown</p>
              </div>
              <div className="relative rounded-xl border border-gray-100 bg-gray-50/50">
                <div
                  className="overflow-x-auto overscroll-x-contain px-3 py-4 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin]"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex items-end gap-2 sm:gap-3 min-h-[156px] w-max pr-2">
                    {report.chartWeeks.map((w) => {
                      const isSelected = w.weekStart === report.weekStart
                      const plannedPct = Math.max(2, ((w.plannedHours ?? 0) / chartMax) * 100)
                      const actualPct = Math.max(2, ((w.actualHours ?? 0) / chartMax) * 100)
                      return (
                        <button
                          key={w.weekStart}
                          ref={isSelected ? selectedBarRef : undefined}
                          type="button"
                          onClick={() => onWeekContainingDateChange(w.weekStart)}
                          title={barTooltip(w)}
                          aria-pressed={isSelected}
                          aria-label={`Week ${w.weekLabel}. ${formatHours(w.plannedHours)} planned, ${formatHours(w.actualHours)} actual. Select this week.`}
                          className={`flex flex-col items-center gap-2 w-[4.5rem] sm:w-[5rem] shrink-0 snap-center rounded-xl px-1 pt-2 pb-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                            isSelected
                              ? 'bg-indigo-50 ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-50'
                              : 'bg-transparent hover:bg-white/80'
                          }`}
                        >
                          <div className="flex gap-1 sm:gap-1.5 items-end justify-center h-[112px] w-full">
                            <div
                              className="w-3 sm:w-3.5 rounded-t bg-indigo-300 min-h-[2px] transition-all"
                              style={{ height: `${plannedPct}%` }}
                            />
                            <div
                              className="w-3 sm:w-3.5 rounded-t bg-emerald-600 min-h-[2px] transition-all"
                              style={{ height: `${actualPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-600 text-center leading-tight px-0.5 line-clamp-2 w-full">
                            {w.weekLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-indigo-300" /> Planned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-600" /> Actual
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected week</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{report.weekLabel}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Planned hours</p>
                <p className="text-lg font-bold text-indigo-700 mt-1">{formatHours(report.plannedHours)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actual hours</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">{formatHours(report.actualHours)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Efficiency</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatPct(report.laborEfficiencyPercent)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{report.completedOfferLines} line(s)</p>
              </div>
            </div>

            {report.detailRows.length === 0 ? (
              <EmptyState
                title="No completed lines this week"
                description="Admins mark offer lines complete; the completion timestamp must fall in the selected week (reporting timezone). Planned and actual hours are computed from task calendar dates and workday settings—not from manual hour entry on each line."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Task</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Offer</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignees</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Planned</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actual</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Efficiency</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.detailRows.map((row) => (
                      <tr key={row.offerId} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 text-gray-900 font-medium">{row.taskName}</td>
                        <td className="px-4 py-3 text-gray-700">{row.offerName}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {row.assigneeIds?.length
                            ? row.assigneeIds.map((id) => memberLabel(id, teamMembers)).join(', ')
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatHours(row.plannedHours)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatHours(row.actualHours)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{formatPct(row.laborEfficiencyPercent)}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatCompletedAt(row.workCompletedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { toDateInputValue }
