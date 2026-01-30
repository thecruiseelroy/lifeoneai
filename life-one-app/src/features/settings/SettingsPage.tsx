import { useProfile } from '../../context/ProfileContext'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'
import { useState, useEffect, useCallback } from 'react'
import { getApiBase, getAuthHeaders } from '../../api/client'

const API_BASE = getApiBase()

export function SettingsPage() {
  const { profileName } = useProfile()
  const [openrouterApiKey, setOpenrouterApiKey] = useState('')
  const [openrouterModel, setOpenrouterModel] = useState('openai/gpt-4o')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState<number | ''>(1024)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    if (!profileName) return
    setError(null)
    const url = `${API_BASE}/api/profiles/me/settings/ai`
    // #region agent log
    fetch('http://127.0.0.1:7261/ingest/984f0a71-c4bc-4ea1-9635-399e837fff0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.tsx:loadSettings:beforeFetch',message:'GET settings/ai',data:{url,profileName,API_BASE},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1_H2_H5'})}).catch(()=>{});
    // #endregion
    try {
      const res = await fetch(url, { headers: getAuthHeaders() })
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/984f0a71-c4bc-4ea1-9635-399e837fff0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.tsx:loadSettings:afterFetch',message:'response',data:{status:res.status,ok:res.ok,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1_H2_H3'})}).catch(()=>{});
      // #endregion
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setOpenrouterModel(data.openrouter_model ?? 'openai/gpt-4o')
      setTemperature(Number(data.temperature) ?? 0.7)
      setMaxTokens(data.max_tokens ?? '')
      setHasApiKey(Boolean(data.has_api_key))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load settings'
      const isReach = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/984f0a71-c4bc-4ea1-9635-399e837fff0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.tsx:loadSettings:catch',message:'loadSettings failed',data:{msg,isReach,showingCantReach:isReach},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1_H4_H5'})}).catch(()=>{});
      // #endregion
      setError(
        isReach
          ? `Can't reach the API at ${API_BASE}. Start the backend: run start.bat in life-one-api (port 8765).`
          : msg
      )
    }
  }, [profileName])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileName) {
      setError('Select a profile first')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const body: Record<string, unknown> = {
        openrouter_model: openrouterModel,
        temperature: Number(temperature),
        max_tokens: maxTokens === '' ? null : Number(maxTokens),
      }
      if (openrouterApiKey.trim()) body.openrouter_api_key = openrouterApiKey.trim()
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/984f0a71-c4bc-4ea1-9635-399e837fff0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.tsx:handleSave',message:'PUT ai settings',data:{profileName,bodyHasApiKey:'openrouter_api_key' in body,bodyKeys:Object.keys(body)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      const res = await fetch(
        `${API_BASE}/api/profiles/me/settings/ai`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(body) }
      )
      if (!res.ok) throw new Error(await res.text())
      setOpenrouterApiKey('')
      setMessage(profileName ? `Saved. Settings apply to profile “${profileName}”.` : 'Saved.')
      setHasApiKey(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save'
      setError(
        msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')
          ? `Can't reach the API at ${API_BASE}. Start the backend: run start.bat in life-one-api (port 8765).`
          : msg
      )
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbs = getBreadcrumbItems('/settings', {})

  if (!profileName) {
    return (
      <PageLayout title="Settings" breadcrumbs={breadcrumbs} backLink={{ to: '/', label: 'Dashboard' }}>
        <div className="settings-page-main">
          <p className="settings-page-hint">Select a profile first to configure AI settings.</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Settings"
      breadcrumbs={breadcrumbs}
      backLink={{ to: '/', label: 'Dashboard' }}
      actions={
        <span className="page-header-active-profile" title="Active profile">
          Active: {profileName}
        </span>
      }
    >
      <div className="settings-page-main">
        <section className="settings-section">
          <h2 className="settings-section-title">AI / OpenRouter</h2>
          <p className="settings-section-desc">
            Configure your OpenRouter API key and model for the health coach chat.
          </p>
          {error && <p className="settings-error" role="alert">{error}</p>}
          {message && <p className="settings-message">{message}</p>}
          <form onSubmit={handleSave} className="settings-form">
            <label className="settings-label">
              OpenRouter API key
              <input
                type="password"
                className="settings-input"
                value={openrouterApiKey}
                onChange={(e) => setOpenrouterApiKey(e.target.value)}
                placeholder={hasApiKey ? '•••••••• (leave blank to keep current)' : 'sk-or-...'}
                autoComplete="off"
              />
            </label>
            <label className="settings-label">
              Model
              <input
                type="text"
                className="settings-input"
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                placeholder="openai/gpt-4o"
              />
            </label>
            <label className="settings-label">
              Temperature (0–2)
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                className="settings-input"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </label>
            <label className="settings-label">
              Max tokens (optional)
              <input
                type="number"
                min={1}
                className="settings-input"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1024"
              />
            </label>
            <button type="submit" className="settings-save-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </section>
      </div>
    </PageLayout>
  )
}
