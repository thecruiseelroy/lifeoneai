import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '../../context/ProfileContext'
import { getApiBase, getAuthHeaders } from '../../api/client'

const API_BASE = getApiBase()

export function useCoachDisplayName(): string {
  const { profileName } = useProfile()
  const [name, setName] = useState('Coach')

  const load = useCallback(async () => {
    if (!profileName) return
    try {
      const headers = getAuthHeaders()
      const [settingsRes, personasRes] = await Promise.all([
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/settings`, { headers }),
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/personas`, { headers }),
      ])
      if (settingsRes.ok && personasRes.ok) {
        const [settingsData, personasData] = await Promise.all([settingsRes.json(), personasRes.json()])
        const personaId = settingsData.coach_persona_id ?? null
        const personas = personasData.personas ?? []
        setName(
          personaId
            ? (personas.find((p: { id: string }) => p.id === personaId)?.name ?? 'Coach')
            : 'Coach'
        )
      }
    } catch {
      // ignore
    }
  }, [profileName])

  useEffect(() => {
    load()
  }, [load])

  return name
}
