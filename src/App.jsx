import { useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { client } from './api/client'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AppLayout from './components/AppLayout'
import DevLabel from './components/DevLabel'

import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TaskDetail from './pages/TaskDetail'
import OfferDetail from './pages/OfferDetail'
import Team from './pages/Team'
import UserDetail from './pages/UserDetail'
import Training from './pages/Training'
import Settings from './pages/Settings'
import Tenants from './pages/admin/Tenants'
import EstimatorAgentGuide from './pages/admin/EstimatorAgentGuide'
import CalendarsWeeklyEfficiencyGuide from './pages/learning/CalendarsWeeklyEfficiencyGuide'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function MarketingLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/app/dashboard" replace />
  return children
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <BrowserRouter>
          <DevLabel />
          <Routes>
            {/* ── Marketing ── */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* ── Auth ── */}
            <Route
              path="/login"
              element={<GuestRoute><Login /></GuestRoute>}
            />
            <Route
              path="/register"
              element={<GuestRoute><Register /></GuestRoute>}
            />

            {/* ── App (authenticated) ── */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="estimate" element={<Navigate to="/app/projects" replace />} />
              <Route path="pdf-uploads" element={<Navigate to="/app/projects" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
              <Route path="projects/:projectId/tasks/:taskId/offers/:offerId" element={<OfferDetail />} />
              <Route path="team" element={<Team />} />
              <Route path="team/:userId" element={<UserDetail />} />
              <Route
                path="training"
                element={<AdminRoute><Training /></AdminRoute>}
              />
              <Route path="settings" element={<Settings />} />
              <Route
                path="admin/tenants"
                element={<AdminRoute><Tenants /></AdminRoute>}
              />
              <Route path="admin/train-estimator" element={<Navigate to="/app/learning/train-estimator" replace />} />
              <Route path="learning" element={<Navigate to="/app/learning/train-estimator" replace />} />
              <Route
                path="learning/train-estimator"
                element={<AdminRoute><EstimatorAgentGuide /></AdminRoute>}
              />
              <Route
                path="learning/calendars-weekly-efficiency"
                element={<AdminRoute><CalendarsWeeklyEfficiencyGuide /></AdminRoute>}
              />
            </Route>

            {/* ── Catch-all ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  )
}
