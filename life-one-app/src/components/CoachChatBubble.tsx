import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { useCoachDisplayName } from '../features/coach/useCoachDisplayName'
import { CoachChatContent } from '../features/coach/CoachChatContent'

export function CoachChatBubble() {
  const [open, setOpen] = useState(false)
  const { profileName } = useProfile()
  const coachDisplayName = useCoachDisplayName()

  if (!profileName) return null

  return (
    <>
      <button
        type="button"
        className="coach-chat-fab"
        onClick={() => setOpen(true)}
        aria-label={`Chat with ${coachDisplayName}`}
        aria-expanded={open}
      >
        <MessageCircle size={24} strokeWidth={2} />
      </button>

      <div
        className={`coach-chat-sheet-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        role="presentation"
      >
        <div
          className="coach-chat-sheet"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`Chat with ${coachDisplayName}`}
        >
          <div className="coach-chat-sheet-header">
            <h2 className="coach-chat-sheet-title">{coachDisplayName}</h2>
            <div className="coach-chat-sheet-header-actions">
              <Link
                to="/profile#coach"
                className="coach-chat-sheet-settings"
                onClick={() => setOpen(false)}
              >
                Settings
              </Link>
              <button
                type="button"
                className="coach-chat-sheet-close"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="coach-chat-sheet-body">
            <CoachChatContent />
          </div>
        </div>
      </div>
    </>
  )
}
