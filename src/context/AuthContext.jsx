import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { client } from '../api/client'
import { GET_SESSION_STATUS } from '../api/users'
import { LOGOUT } from '../api/auth'

const AuthContext = createContext(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    )
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function loadStoredSession() {
  try {
    const token = localStorage.getItem('aether_token')
    const stored = localStorage.getItem('aether_user')
    if (!token || !stored) return null
    if (isTokenExpired(token)) {
      localStorage.removeItem('aether_token')
      localStorage.removeItem('aether_user')
      return null
    }
    return JSON.parse(stored)
  } catch {
    return null
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredSession())

  const login = useCallback((token, userProfile) => {
    localStorage.setItem('aether_token', token)
    localStorage.setItem('aether_user', JSON.stringify(userProfile))
    setUser(userProfile)
  }, [])

  const logout = useCallback(async (opts = {}) => {
    const { skipServer = false } = opts
    if (!skipServer && user?.id && user?.tenantId) {
      try {
        await client.mutate({
          mutation: LOGOUT,
          variables: { id: user.id, tenantId: user.tenantId },
        })
      } catch { /* ignore logout mutation errors */ }
    }
    localStorage.removeItem('aether_token')
    localStorage.removeItem('aether_user')
    await client.clearStore()
    setUser(null)
  }, [user])

  const updateUser = useCallback((updatedUser) => {
    const merged = { ...user, ...updatedUser }
    localStorage.setItem('aether_user', JSON.stringify(merged))
    setUser(merged)
  }, [user])

  // ── Session status polling ──────────────────────────────────────────────────
  // Poll the server every 60 s to check whether the backend has invalidated the
  // session (loggedIn: false). Also re-checks whenever the browser tab regains
  // focus so stale sessions are caught the moment the user returns to the tab.
  const { refetch: refetchSession } = useQuery(GET_SESSION_STATUS, {
    variables: { id: user?.id, tenantId: user?.tenantId },
    skip: !user,
    pollInterval: 60_000,
    fetchPolicy: 'network-only',
    onCompleted(data) {
      const profile = data?.userProfile
      if (profile && !profile.loggedIn) {
        logout({ skipServer: true })
      }
    },
  })

  useEffect(() => {
    const handleFocus = () => {
      if (user) refetchSession()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, refetchSession])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
