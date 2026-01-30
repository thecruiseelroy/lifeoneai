import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { ArrowLeft, Settings } from 'lucide-react'
import { useProfile } from '../../context/ProfileContext'
import { getApiBase, getAuthHeaders, checkAuthResponse } from '../../api/client'

const API_BASE = getApiBase()

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export function CoachPage() {
  const { profileName } = useProfile()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [coachDisplayName, setCoachDisplayName] = useState('Coach')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const loadCoachDisplayName = useCallback(async () => {
    if (!profileName) return
    try {
      const headers = getAuthHeaders()
      const [settingsRes, personasRes] = await Promise.all([
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/settings`, { headers }),
        fetch(`${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/coach/personas`, { headers }),
      ])
      checkAuthResponse(settingsRes)
      checkAuthResponse(personasRes)
      if (settingsRes.ok && personasRes.ok) {
        const [settingsData, personasData] = await Promise.all([settingsRes.json(), personasRes.json()])
        const personaId = settingsData.coach_persona_id ?? null
        const personas = personasData.personas ?? []
        const name = personaId
          ? (personas.find((p: { id: string }) => p.id === personaId)?.name ?? 'Coach')
          : 'Coach'
        setCoachDisplayName(name)
      }
    } catch {
      // ignore
    }
  }, [profileName])

  useEffect(() => {
    loadCoachDisplayName()
  }, [loadCoachDisplayName])

  const loadHistory = useCallback(async () => {
    if (!profileName) return
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/chat`,
        { headers: getAuthHeaders() }
      )
      checkAuthResponse(res)
      if (!res.ok) {
        const text = await res.text()
        let msg = text
        try {
          const j = JSON.parse(text)
          msg = j.detail ?? text
        } catch {
          // use text
        }
        if (res.status === 404) setError('Profile not found. Create or select one in the header.')
        else setError(msg)
        setHistoryLoaded(true)
        return
      }
      const data = await res.json()
      setMessages((data.messages ?? []).map((m: { role: string; content: string; id?: string; created_at?: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        id: m.id,
        created_at: m.created_at,
      })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history')
    } finally {
      setHistoryLoaded(true)
    }
  }, [profileName])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || !profileName) return
    setInput('')
    setError(null)
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ message: text }),
        }
      )
      checkAuthResponse(res)
      if (!res.ok) {
        const textRes = await res.text()
        let msg = textRes
        try {
          const j = JSON.parse(textRes)
          msg = j.detail ?? textRes
        } catch {
          // use text
        }
        if (res.status === 404 && msg.toLowerCase().includes('profile')) {
          setError('Profile not found. Create or select a profile in the header.')
        } else if (typeof msg === 'string' && msg.includes('OpenRouter')) {
          setError(msg)
        } else {
          setError(msg)
        }
        setMessages((prev) => prev.slice(0, -1))
        return
      }
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message ?? '' }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  if (!profileName) {
    return (
      <div className="coach-page">
        <header className="coach-page-header">
          <Link to="/" className="exercise-page-back">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="coach-page-title">Health Coach</h1>
        </header>
        <p className="coach-page-hint">Select a profile first to chat with your health coach.</p>
      </div>
    )
  }

  return (
    <div className="coach-page">
      <header className="coach-page-header">
        <Link to="/" className="exercise-page-back">
          <ArrowLeft size={20} /> Back
        </Link>
        <h1 className="coach-page-title">{coachDisplayName}</h1>
        <span className="coach-page-active-profile" title="Active profile">Active: {profileName}</span>
        <Link
          to="/profile#coach"
          className="coach-page-popout-trigger"
          aria-label="Configure coach on Profile page"
        >
          <Settings size={18} />
          Configure coach
        </Link>
      </header>

      <main className="coach-page-main">
        {error && <p className="coach-error" role="alert">{error}</p>}
        <div className="coach-messages">
          {!historyLoaded ? (
            <p className="coach-loading">Loading…</p>
          ) : messages.length === 0 ? (
            <p className="coach-empty">{`Ask ${coachDisplayName} anything. They have access to your programs and exercise history.`}</p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`coach-message coach-message-${m.role}`}>
                <span className="coach-message-role">{m.role === 'user' ? 'You' : coachDisplayName}</span>
                <div className="coach-message-content">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              </div>
            ))
          )}
          {loading && (
            <div className="coach-message coach-message-assistant">
              <span className="coach-message-role">{coachDisplayName}</span>
              <div className="coach-message-content">…</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="coach-form">
          <input
            type="text"
            className="coach-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={coachDisplayName ? `Ask ${coachDisplayName}…` : 'Ask your health coach…'}
            disabled={loading}
          />
          <button type="submit" className="coach-send-btn" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </main>
    </div>
  )
}
