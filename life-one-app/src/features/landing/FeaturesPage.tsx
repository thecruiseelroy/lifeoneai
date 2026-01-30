import {
  Dumbbell,
  ClipboardList,
  UtensilsCrossed,
  CalendarDays,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Workouts',
    description: 'Exercise library and logging. Track sets, reps, and progress.',
  },
  {
    icon: ClipboardList,
    title: 'Programs',
    description: 'Structured workout programs and sections. Follow a plan that fits you.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Nutrition',
    description: 'Food library and diet plans. Know what you eat and how it fits your goals.',
  },
  {
    icon: CalendarDays,
    title: 'Meals',
    description: 'Log meals by day. Keep it simple and consistent.',
  },
] as const

export function FeaturesPage() {
  return (
    <div className="landing-page">
      <h1 className="landing-page-title">What Life ONE is</h1>
      <p className="landing-page-lead">
        One app for your workouts and your nutrition.
      </p>
      <div className="landing-features-grid">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="landing-feature-card">
            <span className="landing-feature-icon" aria-hidden>
              <Icon size={32} strokeWidth={2} />
            </span>
            <h2 className="landing-feature-title">{title}</h2>
            <p className="landing-feature-desc">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
