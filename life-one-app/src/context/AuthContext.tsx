import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getApiBase } from '../api/client'
import * as authStore from '../api/authStore'

export type AuthUser = { profileId: string; name: string }

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (name: string, password: string) => Promise<void>
  register: (name: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_BASE = getApiBase()

async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Invalid or expired token')
  const data = (await res.json()) as { profile_id: string; name: string }
  return { profileId: data.profile_id, name: data.name }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const name = authStore.getProfileName()
    const id = authStore.getProfileId()
    if (name && id) return { profileId: id, name }
    return null
  })
  const [token, setTokenState] = useState<string | null>(() => authStore.getToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = authStore.getToken()
    if (!t) {
      setUser(null)
      setTokenState(null)
      setLoading(false)
      return
    }
    setTokenState(t)
    fetchMe(t)
      .then((u) => {
        setUser(u)
        authStore.setAuth(t, u.profileId, u.name)
      })
      .catch(() => {
        authStore.clearAuth()
        setUser(null)
        setTokenState(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (name: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), password }),
    })
    if (!res.ok) {
      const text = await res.text()
      let detail = text
      try {
        const j = JSON.parse(text)
        detail = j.detail ?? text
      } catch {
        // use text
      }
      throw new Error(detail)
    }
    const data = (await res.json()) as { token: string; profile: { id: string; name: string } }
    const u: AuthUser = { profileId: data.profile.id, name: data.profile.name }
    authStore.setAuth(data.token, u.profileId, u.name)
    setTokenState(data.token)
    setUser(u)
  }, [])

  const register = useCallback(async (name: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), password }),
    })
    if (!res.ok) {
      const text = await res.text()
      let detail = text
      try {
        const j = JSON.parse(text)
        detail = j.detail ?? text
      } catch {
        // use text
      }
      throw new Error(detail)
    }
    const data = (await res.json()) as { token: string; profile: { id: string; name: string } }
    const u: AuthUser = { profileId: data.profile.id, name: data.profile.name }
    authStore.setAuth(data.token, u.profileId, u.name)
    setTokenState(data.token)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    authStore.clearAuth()
    setUser(null)
    setTokenState(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
