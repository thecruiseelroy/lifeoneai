import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/library', label: 'Library' },
  { to: '/programs', label: 'Programs' },
  { to: '/foods', label: 'Foods' },
  { to: '/diets', label: 'Diets' },
  { to: '/meals', label: 'Meals' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
] as const

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    if (to === '/library') return location.pathname === '/library' || location.pathname.startsWith('/exercise')
    if (to === '/programs') return location.pathname.startsWith('/programs')
    if (to === '/diets') return location.pathname.startsWith('/diets')
    return location.pathname === to
  }

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
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`mobile-nav-link ${isActive(to) ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}
