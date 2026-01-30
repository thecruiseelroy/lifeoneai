import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
  NAV_CONFIG,
  isNavLinkActive,
  isNavGroupActive,
  type NavGroupId,
} from '../config/navConfig'

export function DesktopNav() {
  const location = useLocation()
  const [openGroup, setOpenGroup] = useState<NavGroupId | null>(null)

  return (
    <nav className="app-bar-nav" aria-label="Main navigation">
      {NAV_CONFIG.map((entry) => {
        if (entry.type === 'link') {
          const active = isNavLinkActive(entry.to, location.pathname)
          return (
            <Link
              key={entry.to}
              to={entry.to}
              className={`app-bar-link ${active ? 'active' : ''}`}
            >
              {entry.label}
            </Link>
          )
        }
        const groupActive = isNavGroupActive(entry.id, location.pathname)
        const isOpen = openGroup === entry.id
        return (
          <div key={entry.id} className="app-bar-dropdown-wrap">
            <button
              type="button"
              className={`app-bar-dropdown-trigger ${groupActive ? 'active' : ''} ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenGroup((g) => (g === entry.id ? null : entry.id))}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls={`app-bar-dropdown-${entry.id}`}
              id={`app-bar-dropdown-trigger-${entry.id}`}
            >
              {entry.label}
              <ChevronDown size={16} className="app-bar-dropdown-chevron" aria-hidden />
            </button>
            {isOpen && (
              <>
                <div
                  className="app-bar-dropdown-backdrop"
                  onClick={() => setOpenGroup(null)}
                  aria-hidden
                />
                <div
                  id={`app-bar-dropdown-${entry.id}`}
                  className="app-bar-dropdown-panel"
                  role="menu"
                  aria-labelledby={`app-bar-dropdown-trigger-${entry.id}`}
                >
                  {entry.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`app-bar-dropdown-link ${isNavLinkActive(item.to, location.pathname) ? 'active' : ''}`}
                      role="menuitem"
                      onClick={() => setOpenGroup(null)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}
