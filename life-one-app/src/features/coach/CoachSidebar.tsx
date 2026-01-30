import { Link } from 'react-router-dom'
import { useProfile } from '../../context/ProfileContext'
import { CoachChatContent } from './CoachChatContent'
import { useCoachDisplayName } from './useCoachDisplayName'
import { Settings } from 'lucide-react'

export function CoachSidebar() {
  const { profileName } = useProfile()
  const coachDisplayName = useCoachDisplayName()

  if (!profileName) {
    return (
      <aside className="coach-sidebar">
        <h2 className="coach-sidebar-title">Coach</h2>
        <p className="coach-sidebar-hint">Select a profile to chat with your health coach.</p>
      </aside>
    )
  }

  return (
    <aside className="coach-sidebar">
      <h2 className="coach-sidebar-title">{coachDisplayName}</h2>
      <span className="coach-sidebar-profile" title="Active profile">{profileName}</span>
      <Link
        to="/profile#coach"
        className="coach-popout-trigger"
        aria-label="Configure coach on Profile page"
      >
        <Settings size={16} />
        Configure coach
      </Link>
      <CoachChatContent />
    </aside>
  )
}
