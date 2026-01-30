import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

type ProfileContextValue = {
  profileName: string | null
  setProfileName: (name: string | null) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const profileName = user?.name ?? null
  const setProfileName = () => {
    // No-op when using auth; profile is the logged-in user. Kept for API compatibility.
  }

  return (
    <ProfileContext.Provider value={{ profileName, setProfileName }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
