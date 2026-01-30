import { Outlet, NavLink, Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'

export function MarketingLayout() {
  return (
    <div className="marketing-layout">
      <header className="marketing-header">
        <div className="marketing-header-inner">
          <Link to="/" className="marketing-logo" aria-label="Life ONE Home">
            <Dumbbell size={24} strokeWidth={2} aria-hidden />
            <span>Life ONE</span>
          </Link>
          <nav className="marketing-nav" aria-label="Main">
            <NavLink to="/" end className="marketing-nav-link">
              Home
            </NavLink>
            <NavLink to="/features" className="marketing-nav-link">
              Features
            </NavLink>
            <NavLink to="/how-it-works" className="marketing-nav-link">
              How it works
            </NavLink>
            <NavLink to="/why" className="marketing-nav-link">
              Why
            </NavLink>
            <NavLink to="/get-started" className="marketing-nav-link marketing-nav-cta">
              Get started
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="marketing-main">
        <Outlet />
      </main>
      <footer className="marketing-footer">
        <span className="marketing-footer-brand">Life ONE</span>
        <span className="marketing-footer-copy">© {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
