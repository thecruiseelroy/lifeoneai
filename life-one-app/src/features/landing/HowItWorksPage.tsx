import { Activity, ClipboardList, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    icon: Activity,
    title: 'Track',
    description: 'Log workouts and meals. Everything in one place.',
  },
  {
    icon: ClipboardList,
    title: 'Plan',
    description: 'Follow programs and diets. Structure without the clutter.',
  },
  {
    icon: TrendingUp,
    title: 'Improve',
    description: 'See your progress. Stay consistent over time.',
  },
] as const

export function HowItWorksPage() {
  return (
    <div className="landing-page">
      <h1 className="landing-page-title">Track. Plan. Improve.</h1>
      <p className="landing-page-lead">
        Three steps. One app.
      </p>
      <div className="landing-steps">
        {STEPS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="landing-step">
            <span className="landing-step-icon" aria-hidden>
              <Icon size={28} strokeWidth={2} />
            </span>
            <h2 className="landing-step-title">{title}</h2>
            <p className="landing-step-desc">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
