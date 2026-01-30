import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="landing-hero">
      <h1 className="landing-hero-title">Your fitness. One place.</h1>
      <p className="landing-hero-subtitle">
        Workouts, programs, nutrition, and meals—together. Simple. Focused.
      </p>
      <Link to="/get-started" className="landing-cta landing-cta-primary">
        Get started
      </Link>
    </section>
  )
}
