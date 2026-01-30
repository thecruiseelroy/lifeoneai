import { useState, useEffect, useCallback } from 'react'
import { getApiBase, getAuthHeaders, checkAuthResponse } from '../../api/client'
import {
  User,
  Target,
  FileText,
  UserPlus,
  FilePlus,
  Trash2,
  ChevronUp,
} from 'lucide-react'

const API_BASE = getApiBase()

interface PersonalityPreset {
  id: string
  name: string
  description: string
  system_instruction: string
}

interface CoachPersona {
  id: string
  name: string
  personality_summary: string
  methods_notes: string
  created_at: string
  updated_at: string
}

interface CoachSettings {
  personality_preset_id: string | null
  coach_persona_id: string | null
  sport: string | null
  sport_options: string[]
}

interface ContextFile {
  id: string
  name: string
  source_type: string
  created_at: string
}

interface CoachSettingsContentProps {
  profileName: string
}

export function CoachSettingsContent({ profileName }: CoachSettingsContentProps) {
  const [presets, setPresets] = useState<PersonalityPreset[]>([])
  const [settings, setSettings] = useState<CoachSettings | null>(null)
  const [personas, setPersonas] = useState<CoachPersona[]>([])
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([])
  const [addPersonaOpen, setAddPersonaOpen] = useState(false)
  const [addFileOpen, setAddFileOpen] = useState(false)
  const [newPersonaName, setNewPersonaName] = useState('')
  const [newPersonaSummary, setNewPersonaSummary] = useState('')
  const [newPersonaMethods, setNewPersonaMethods] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [newFileType, setNewFileType] = useState<'transcript' | 'blog' | 'general'>('general')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultSportOptions = ['general', 'strength', 'running', 'crossfit', 'cycling', 'swimming', 'endurance']

  const loadData = useCallback(async () => {
    if (!profileName) return
    setError(null)
    try {
      const headers = getAuthHeaders()
      const [presetsRes, settingsRes, personasRes, filesRes] = await Promise.all([
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/presets`, { headers }),
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/settings`, { headers }),
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/personas`, { headers }),
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/files`, { headers }),
      ])
      checkAuthResponse(presetsRes)
      checkAuthResponse(settingsRes)
      checkAuthResponse(personasRes)
      checkAuthResponse(filesRes)
      if (presetsRes.ok) {
        const d = await presetsRes.json()
        setPresets(d.presets ?? [])
      }
      if (settingsRes.ok) {
        const d = await settingsRes.json()
        setSettings({
          personality_preset_id: d.personality_preset_id ?? null,
          coach_persona_id: d.coach_persona_id ?? null,
          sport: d.sport ?? null,
          sport_options: d.sport_options ?? defaultSportOptions,
        })
      }
      if (personasRes.ok) {
        const d = await personasRes.json()
        setPersonas(d.personas ?? [])
      }
      if (filesRes.ok) {
        const d = await filesRes.json()
        setContextFiles(d.files ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings')
    }
  }, [profileName])

  useEffect(() => {
    loadData()
  }, [loadData])

  const putSettings = useCallback(
    async (body: {
      personality_preset_id?: string | null
      coach_persona_id?: string | null
      sport?: string | null
    }) => {
      if (!profileName) return
      try {
        const res = await fetch(
          `${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/settings`,
          { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(body) }
        )
        checkAuthResponse(res)
        if (res.ok) {
          const d = await res.json()
          setSettings((prev) => (prev ? { ...prev, ...d } : null))
        }
      } catch {
        // ignore
      }
    },
    [profileName]
  )

  const handleAddPersona = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileName || !newPersonaName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/personas`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: newPersonaName.trim(),
            personality_summary: newPersonaSummary.trim() || undefined,
            methods_notes: newPersonaMethods.trim() || undefined,
          }),
        }
      )
      checkAuthResponse(res)
      if (res.ok) {
        const persona = await res.json()
        setPersonas((prev) => [...prev, persona])
        setNewPersonaName('')
        setNewPersonaSummary('')
        setNewPersonaMethods('')
        setAddPersonaOpen(false)
        await putSettings({ coach_persona_id: persona.id })
      } else {
        const text = await res.text()
        setError(text || 'Failed to add coach')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add coach')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileName || !newFileName.trim() || !newFileContent.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/files`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: newFileName.trim(),
            content: newFileContent.trim(),
            source_type: newFileType,
          }),
        }
      )
      checkAuthResponse(res)
      if (res.ok) {
        const file = await res.json()
        setContextFiles((prev) => [file, ...prev])
        setNewFileName('')
        setNewFileContent('')
        setAddFileOpen(false)
      } else {
        const text = await res.text()
        setError(text || 'Failed to add file')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add file')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!profileName) return
    try {
      const res = await fetch(
        `${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/files/${fileId}`,
        { method: 'DELETE', headers: getAuthHeaders() }
      )
      checkAuthResponse(res)
      if (res.ok) setContextFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch {
      // ignore
    }
  }

  const sportOptions = settings?.sport_options ?? defaultSportOptions

  if (!profileName) {
    return (
      <div className="coach-settings coach-settings-empty">
        <p>Select a profile to configure coach settings.</p>
      </div>
    )
  }

  return (
    <div className="coach-settings">
      {error && (
        <div className="coach-settings-error" role="alert">
          {error}
        </div>
      )}

      {/* Section 1: Coach identity */}
      <section className="coach-settings-section" aria-labelledby="coach-identity-heading">
        <h3 id="coach-identity-heading" className="coach-settings-section-title">
          <User size={16} aria-hidden />
          Coach identity
        </h3>
        <div className="coach-settings-fields">
          <div className="coach-settings-field">
            <label htmlFor="coach-settings-personality">Personality style</label>
            <select
              id="coach-settings-personality"
              value={settings?.personality_preset_id ?? ''}
              onChange={(e) => putSettings({ personality_preset_id: e.target.value || null })}
              className="coach-settings-select"
            >
              <option value="">Default</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="coach-settings-hint">Tone and approach of the AI coach</span>
          </div>

          <div className="coach-settings-field">
            <label htmlFor="coach-settings-persona">Active coach</label>
            <div className="coach-settings-input-row">
              <select
                id="coach-settings-persona"
                value={settings?.coach_persona_id ?? ''}
                onChange={(e) => putSettings({ coach_persona_id: e.target.value || null })}
                className="coach-settings-select"
              >
                <option value="">Generic Coach</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="coach-settings-icon-btn"
                onClick={() => setAddPersonaOpen((v) => !v)}
                title={addPersonaOpen ? 'Cancel' : 'Add custom coach'}
                aria-expanded={addPersonaOpen}
              >
                {addPersonaOpen ? <ChevronUp size={18} /> : <UserPlus size={18} />}
              </button>
            </div>
            <span className="coach-settings-hint">Who the coach “is” — name and style</span>
          </div>

          {addPersonaOpen && (
            <div className="coach-settings-card" role="region" aria-label="Add custom coach">
              <h4 className="coach-settings-card-title">Add custom coach</h4>
              <form onSubmit={handleAddPersona} className="coach-settings-form">
                <div className="coach-settings-field">
                  <label htmlFor="new-persona-name">Name</label>
                  <input
                    id="new-persona-name"
                    type="text"
                    placeholder="e.g. Mike"
                    value={newPersonaName}
                    onChange={(e) => setNewPersonaName(e.target.value)}
                    className="coach-settings-input"
                    required
                    autoFocus
                  />
                </div>
                <div className="coach-settings-field">
                  <label htmlFor="new-persona-summary">Personality (optional)</label>
                  <input
                    id="new-persona-summary"
                    type="text"
                    placeholder="Brief description of tone and style"
                    value={newPersonaSummary}
                    onChange={(e) => setNewPersonaSummary(e.target.value)}
                    className="coach-settings-input"
                  />
                </div>
                <div className="coach-settings-field">
                  <label htmlFor="new-persona-methods">Methods (optional)</label>
                  <input
                    id="new-persona-methods"
                    type="text"
                    placeholder="Coaching methods or philosophy"
                    value={newPersonaMethods}
                    onChange={(e) => setNewPersonaMethods(e.target.value)}
                    className="coach-settings-input"
                  />
                </div>
                <div className="coach-settings-form-actions">
                  <button type="submit" className="coach-settings-btn coach-settings-btn-primary" disabled={saving || !newPersonaName.trim()}>
                    {saving ? 'Saving…' : 'Save coach'}
                  </button>
                  <button
                    type="button"
                    className="coach-settings-btn coach-settings-btn-secondary"
                    onClick={() => {
                      setAddPersonaOpen(false)
                      setNewPersonaName('')
                      setNewPersonaSummary('')
                      setNewPersonaMethods('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Sport & focus */}
      <section className="coach-settings-section" aria-labelledby="coach-focus-heading">
        <h3 id="coach-focus-heading" className="coach-settings-section-title">
          <Target size={16} aria-hidden />
          Sport & focus
        </h3>
        <div className="coach-settings-fields">
          <div className="coach-settings-field">
            <label htmlFor="coach-settings-sport">Primary focus</label>
            <select
              id="coach-settings-sport"
              value={settings?.sport ?? 'general'}
              onChange={(e) => putSettings({ sport: e.target.value === 'general' ? null : e.target.value })}
              className="coach-settings-select"
            >
              {sportOptions.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <span className="coach-settings-hint">Narrows advice to your main activity</span>
          </div>
        </div>
      </section>

      {/* Section 3: Context files */}
      <section className="coach-settings-section" aria-labelledby="coach-context-heading">
        <h3 id="coach-context-heading" className="coach-settings-section-title">
          <FileText size={16} aria-hidden />
          Context files
        </h3>
        <p className="coach-settings-section-desc">Reference docs the coach can use when answering (transcripts, notes, etc.).</p>

        {contextFiles.length > 0 && (
          <ul className="coach-settings-file-list">
            {contextFiles.map((f) => (
              <li key={f.id} className="coach-settings-file-item">
                <span className="coach-settings-file-name" title={f.name}>
                  {f.name}
                </span>
                <span className="coach-settings-file-type">{f.source_type}</span>
                <button
                  type="button"
                  className="coach-settings-icon-btn coach-settings-delete"
                  onClick={() => handleDeleteFile(f.id)}
                  title="Remove file"
                  aria-label={`Remove ${f.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!addFileOpen ? (
          <button
            type="button"
            className="coach-settings-add-file-trigger"
            onClick={() => setAddFileOpen(true)}
          >
            <FilePlus size={16} />
            Add context file
          </button>
        ) : (
          <div className="coach-settings-card" role="region" aria-label="Add context file">
            <h4 className="coach-settings-card-title">Add context file</h4>
            <form onSubmit={handleAddFile} className="coach-settings-form">
              <div className="coach-settings-field">
                <label htmlFor="new-file-name">File name</label>
                <input
                  id="new-file-name"
                  type="text"
                  placeholder="e.g. Session notes"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="coach-settings-input"
                  required
                  autoFocus
                />
              </div>
              <div className="coach-settings-field">
                <label htmlFor="new-file-type">Type</label>
                <select
                  id="new-file-type"
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as 'transcript' | 'blog' | 'general')}
                  className="coach-settings-select"
                >
                  <option value="transcript">Transcript</option>
                  <option value="blog">Blog</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="coach-settings-field">
                <label htmlFor="new-file-content">Content</label>
                <textarea
                  id="new-file-content"
                  placeholder="Paste or type content the coach can reference…"
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="coach-settings-textarea"
                  rows={4}
                  required
                />
              </div>
              <div className="coach-settings-form-actions">
                <button type="submit" className="coach-settings-btn coach-settings-btn-primary" disabled={saving || !newFileName.trim() || !newFileContent.trim()}>
                  {saving ? 'Saving…' : 'Save file'}
                </button>
                <button
                  type="button"
                  className="coach-settings-btn coach-settings-btn-secondary"
                  onClick={() => {
                    setAddFileOpen(false)
                    setNewFileName('')
                    setNewFileContent('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  )
}
