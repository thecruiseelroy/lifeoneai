import { Link } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import {
  Library,
  ClipboardList,
  UtensilsCrossed,
  Apple,
  CalendarDays,
  User,
  Settings,
} from 'lucide-react'

const DASHBOARD_LINKS = [
  { to: '/library', label: 'Library', description: 'Exercise library', icon: Library },
  { to: '/programs', label: 'Programs', description: 'Workout programs', icon: ClipboardList },
  { to: '/foods', label: 'Foods', description: 'Food library', icon: UtensilsCrossed },
  { to: '/diets', label: 'Diets', description: 'Diet plans', icon: Apple },
  { to: '/meals', label: 'Meals', description: 'Meal logging', icon: CalendarDays },
  { to: '/profile', label: 'Profile', description: 'Profile & data', icon: User },
  { to: '/settings', label: 'Settings', description: 'App settings', icon: Settings },
] as const

export function DashboardPage() {
  return (
    <PageLayout title="Dashboard">
      <div className="dashboard-page">
        <p className="dashboard-welcome">
          Welcome to Life One. Choose an area to get started.
        </p>
        <nav className="dashboard-grid" aria-label="Main areas">
          {DASHBOARD_LINKS.map(({ to, label, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="dashboard-card"
              aria-label={`${label}: ${description}`}
            >
              <span className="dashboard-card-icon" aria-hidden>
                <Icon size={24} strokeWidth={2} />
              </span>
              <span className="dashboard-card-label">{label}</span>
              <span className="dashboard-card-desc">{description}</span>
            </Link>
          ))}
        </nav>
      </div>
    </PageLayout>
  )
}
