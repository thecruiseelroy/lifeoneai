import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { NAV_CONFIG, isNavLinkActive } from '../config/navConfig'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <button
        type="button"
        className="mobile-nav-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu size={24} />
      </button>

      <div
        className={`mobile-nav-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        role="presentation"
      >
        <nav
          className="mobile-nav-drawer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Main navigation"
        >
          <div className="mobile-nav-header">
            <h2 className="mobile-nav-title">Menu</h2>
            <button
              type="button"
              className="mobile-nav-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mobile-nav-links">
            {NAV_CONFIG.map((entry) => {
              if (entry.type === 'link') {
                const active = isNavLinkActive(entry.to, location.pathname)
                return (
                  <Link
                    key={entry.to}
                    to={entry.to}
                    className={`mobile-nav-link ${active ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {entry.label}
                  </Link>
                )
              }
              return (
                <div key={entry.id} className="mobile-nav-section">
                  <div className="mobile-nav-section-title">{entry.label}</div>
                  {entry.items.map((item) => {
                    const active = isNavLinkActive(item.to, location.pathname)
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`mobile-nav-link mobile-nav-link-in-group ${active ? 'active' : ''}`}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
