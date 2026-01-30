import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { FileUp } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'
import { useProfile } from '../../context/ProfileContext'
import { apiUploadProfileSheet, apiGetProfileSheet, getApiBase, getAuthHeaders } from '../../api/client'
import { CoachSettingsContent } from '../coach/CoachSettingsContent'

const API_BASE = getApiBase()

export function ProfilePage() {
  const { profileName } = useProfile()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [sheetUploading, setSheetUploading] = useState(false)
  const [sheetUpdatedAt, setSheetUpdatedAt] = useState<string | null>(null)
  const [sheetUploadedFeedback, setSheetUploadedFeedback] = useState<string | null>(null)
  const [aboutYou, setAboutYou] = useState('')
  const [goals, setGoals] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadSheetMeta = useCallback(async () => {
    if (!profileName?.trim()) return
    try {
      const result = await apiGetProfileSheet(profileName.trim())
      setSheetUpdatedAt(result.updated_at ?? null)
    } catch {
      setSheetUpdatedAt(null)
    }
  }, [profileName])

  useEffect(() => {
    if (profileName) {
      setDisplayName(profileName)
      loadSheetMeta()
    } else {
      setDisplayName('')
      setSheetUpdatedAt(null)
    }
  }, [profileName, loadSheetMeta])

  useEffect(() => {
    if (location.hash === '#coach') {
      document.getElementById('coach')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.hash])

  const handleSaveDisplayName = async () => {
    const trimmed = displayName.trim()
    if (!trimmed || trimmed === profileName) return
    setError(null)
    setNameMessage(null)
    setSavingName(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/profiles/${encodeURIComponent(profileName!)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ name: trimmed }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      setNameMessage('Name updated. It will appear after you log in again.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update name'
      const isNetwork =
          msg === 'Failed to fetch' || (e instanceof TypeError && (e as Error).message?.includes('fetch'))
        setError(
          isNetwork
            ? 'Server not reachable. Start the API: run start.bat in life-one-api (port 8765).'
            : msg
        )
    } finally {
      setSavingName(false)
    }
  }

  const handleProfileSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profileName?.trim()) return
    e.target.value = ''
    setSheetUploadedFeedback(null)
    setSheetUploading(true)
    setError(null)
    try {
      const result = await apiUploadProfileSheet(profileName.trim(), file)
      setSheetUpdatedAt(result.updated_at ?? null)
      setSheetUploadedFeedback('Saved. Coach will use this.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSheetUploading(false)
    }
  }

  const breadcrumbs = getBreadcrumbItems('/profile', {})

  return (
    <PageLayout
      title="Profile"
      breadcrumbs={breadcrumbs}
      backLink={{ to: '/', label: 'Dashboard' }}
      actions={
        profileName ? (
          <span className="page-header-active-profile" title="Active profile">
            Active: {profileName}
          </span>
        ) : undefined
      }
    >
      <div className="settings-page-main">
        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}

        <section className="settings-section" aria-labelledby="profile-identity-heading">
          <h2 id="profile-identity-heading" className="settings-section-title">
            Identity
          </h2>
          <p className="settings-section-desc">
            Edit your display name. Account creation is on the login screen.
          </p>
          {profileName && (
            <>
              <label className="settings-label">
                Display name
                <div className="settings-inline-group">
                  <input
                    type="text"
                    className="settings-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Profile name"
                    aria-label="Display name"
                  />
                  <button
                    type="button"
                    className="settings-save-btn"
                    onClick={handleSaveDisplayName}
                    disabled={savingName || !displayName.trim() || displayName.trim() === profileName}
                  >
                    {savingName ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </label>
              {nameMessage && <p className="settings-message">{nameMessage}</p>}
            </>
          )}
        </section>

        {profileName && (
          <section className="settings-section" aria-labelledby="profile-sheet-heading">
            <h2 id="profile-sheet-heading" className="settings-section-title">
              Profile sheet
            </h2>
            <p className="settings-section-desc">
              Upload a markdown or text file for your health coach. It will be used as context when you chat.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              className="settings-file-hidden"
              aria-label="Choose profile sheet file"
              onChange={handleProfileSheetUpload}
            />
            <div className="settings-inline-group">
              <button
                type="button"
                className="settings-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={sheetUploading}
              >
                <FileUp size={16} />
                {sheetUploading ? 'Uploading…' : 'Upload profile sheet'}
              </button>
              {sheetUpdatedAt && (
                <span className="settings-message">Last updated: {sheetUpdatedAt}</span>
              )}
            </div>
            {sheetUploadedFeedback && (
              <p className="settings-message" role="status">{sheetUploadedFeedback}</p>
            )}
          </section>
        )}

        <section id="coach" className="settings-section" aria-labelledby="profile-coach-heading">
          <h2 id="profile-coach-heading" className="settings-section-title">
            Health coach
          </h2>
          <p className="settings-section-desc">
            Personality, active coach, focus, and context files for the health coach chat.
          </p>
          {profileName ? (
            <CoachSettingsContent profileName={profileName} />
          ) : (
            <p className="settings-page-hint">Select a profile to configure your health coach.</p>
          )}
        </section>

        <section className="settings-section" aria-labelledby="profile-about-heading">
          <h2 id="profile-about-heading" className="settings-section-title">
            About you
          </h2>
          <p className="settings-section-desc">
            Add more about yourself here. Saving for these fields is coming soon—for now you can include details in your profile sheet above.
          </p>
          <div className="settings-form settings-about-grid">
            <label className="settings-label" htmlFor="profile-about-bio">
              Bio (optional)
              <textarea
                id="profile-about-bio"
                className="settings-input"
                value={aboutYou}
                onChange={(e) => setAboutYou(e.target.value)}
                placeholder="A few lines about you…"
                rows={3}
              />
            </label>
            <label className="settings-label" htmlFor="profile-about-goals">
              Goals (optional)
              <textarea
                id="profile-about-goals"
                className="settings-input"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Fitness or health goals…"
                rows={3}
              />
            </label>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
