import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useProfile } from '../../context/ProfileContext'
import { getApiBase } from '../../api/client'
import { useCoachDisplayName } from './useCoachDisplayName'

const API_BASE = getApiBase()

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export function CoachChatContent() {
  const { profileName } = useProfile()
  const coachDisplayName = useCoachDisplayName()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const loadHistory = useCallback(async () => {
    if (!profileName) return
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE}/api/profiles/${encodeURIComponent(profileName)}/chat`
      )
      if (!res.ok) {
        const text = await res.text()
        let msg = text
        try {
          const j = JSON.parse(text)
          msg = j.detail ?? text
        } catch {
          // use text
        }
        if (res.status === 404) setError('Profile not found.')
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        }
      )
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
          setError('Profile not found.')
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
      <div className="coach-sidebar-main">
        <p className="coach-sidebar-hint">Select a profile to chat with your health coach.</p>
      </div>
    )
  }

  return (
    <div className="coach-sidebar-main">
      {error && <p className="coach-error" role="alert">{error}</p>}
      <div ref={messagesContainerRef} className="coach-messages">
        {!historyLoaded ? (
          <p className="coach-loading">Loading…</p>
        ) : messages.length === 0 && !loading ? (
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
          <p className="coach-thinking" aria-live="polite">Thinking…</p>
        )}
      </div>
      <form onSubmit={sendMessage} className="coach-form">
        <input
          type="text"
          className="coach-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={coachDisplayName ? `Ask ${coachDisplayName}…` : 'Ask your coach…'}
          disabled={loading}
        />
        <button type="submit" className="coach-send-btn" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
