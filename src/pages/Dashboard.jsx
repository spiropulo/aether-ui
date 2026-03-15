import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { useAuth } from '../context/AuthContext'
import { GET_PROJECTS } from '../api/projects'
import { GET_USER_PROFILES } from '../api/users'
import { GET_TENANT_TRAINING } from '../api/training'
import Spinner from '../components/ui/Spinner'

function StatCard({ label, value, sub, to, icon, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
  }
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Link>
  )
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const tenantId = user?.tenantId

  const { data: projectData, loading: projectsLoading } = useQuery(GET_PROJECTS, {
    variables: { tenantId, page: { limit: 6, offset: 0 } },
    skip: !tenantId,
  })

  const { data: usersData } = useQuery(GET_USER_PROFILES, {
    variables: { tenantId, page: { limit: 1, offset: 0 } },
    skip: !tenantId,
  })

  const { data: trainingData } = useQuery(GET_TENANT_TRAINING, {
    variables: { tenantId, page: { limit: 1, offset: 0 } },
    skip: !tenantId,
  })

  const projects = projectData?.projects?.items ?? []
  const projectTotal = projectData?.projects?.total ?? null
  const teamTotal = usersData?.userProfiles?.total ?? null
  const trainingTotal = trainingData?.tenantTrainingData?.total ?? null

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user?.firstName || user?.displayName || user?.username}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s an overview of your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Total Projects"
          value={projectsLoading ? '…' : projectTotal}
          to="/app/projects"
          color="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
        />
        <StatCard
          label="Team Members"
          value={teamTotal}
          to="/app/team"
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="AI Training Sets"
          value={trainingTotal}
          to="/app/training"
          color="violet"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          }
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
          <Link to="/app/projects" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            View all →
          </Link>
        </div>

        {projectsLoading ? (
          <div className="flex justify-center py-14">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-gray-400 mb-3">No projects yet.</p>
            <Link to="/app/projects" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              Create your first project →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/app/projects/${project.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                    {project.status && (
                      <span className="inline-block max-w-xs px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 break-words whitespace-normal">
                        {project.status}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{project.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                  {project.endDate && (
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs text-gray-400">Due</span>
                      <span className="text-xs font-medium text-gray-600">{formatDate(project.endDate)}</span>
                    </div>
                  )}
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
