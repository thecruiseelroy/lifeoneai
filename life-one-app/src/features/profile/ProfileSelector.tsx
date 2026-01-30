import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'
import { useProfile } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'

export function ProfileSelector() {
  const { profileName } = useProfile()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="profile-selector-wrap">
      <button
        type="button"
        className="profile-selector-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={profileName ? `Profile: ${profileName}` : 'Profile'}
      >
        <User size={20} />
        <span className="profile-selector-label">
          {profileName || 'Profile'}
        </span>
      </button>
      {open && (
        <>
          <div
            className="profile-selector-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="profile-selector-dropdown" role="dialog" aria-label="Profile">
            <h3 className="profile-selector-title">Profile</h3>
            {profileName && (
              <p className="profile-selector-hint" style={{ marginBottom: '8px' }}>
                {profileName}
              </p>
            )}
            <div className="profile-selector-edit">
              <Link
                to="/profile"
                className="profile-selector-edit-link"
                onClick={() => setOpen(false)}
              >
                Edit profile
              </Link>
            </div>
            <button
              type="button"
              className="profile-selector-item"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
