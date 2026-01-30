import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const { login, register } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    setLoading(true)
    try {
      if (isRegister) {
        await register(trimmed, password)
      } else {
        await login(trimmed, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Dumbbell size={40} strokeWidth={2} />
          <h1>Life One</h1>
          <p className="login-tagline">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <label className="login-label">
            Name
            <input
              type="text"
              className="login-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </label>
          <label className="login-label">
            Password
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              disabled={loading}
            />
          </label>
          <div className="login-actions">
            <button
              type="submit"
              className="login-btn-primary"
              disabled={loading}
            >
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
            </button>
            <button
              type="button"
              className="login-btn-secondary"
              onClick={() => {
                setIsRegister((r) => !r)
                setError(null)
              }}
              disabled={loading}
            >
              {isRegister ? 'Already have an account? Log in' : 'Create an account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
