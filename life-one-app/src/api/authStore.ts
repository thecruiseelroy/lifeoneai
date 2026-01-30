/**
 * Minimal auth store for API client (token + profile name).
 * Set by AuthContext on login/register; cleared on logout.
 * Allows client.ts to send Bearer token and resolve current profile without importing React.
 */
const TOKEN_KEY = 'life-one-token'
const PROFILE_KEY = 'life-one-auth-profile'

let token: string | null = null
let profileName: string | null = null
let profileId: string | null = null

function loadFromStorage(): void {
  if (typeof window === 'undefined') return
  try {
    token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as { name: string; id: string }
      profileName = p.name ?? null
      profileId = p.id ?? null
    } else {
      profileName = null
      profileId = null
    }
  } catch {
    token = null
    profileName = null
    profileId = null
  }
}

loadFromStorage()

export function setAuth(t: string, id: string, name: string): void {
  token = t
  profileId = id
  profileName = name
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ id, name }))
  }
}

export function clearAuth(): void {
  token = null
  profileId = null
  profileName = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(PROFILE_KEY)
  }
}

export function getToken(): string | null {
  return token
}

export function getProfileName(): string | null {
  return profileName
}

export function getProfileId(): string | null {
  return profileId
}
