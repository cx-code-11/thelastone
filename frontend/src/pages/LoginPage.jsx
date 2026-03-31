import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, tenant } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-500 rounded-md flex items-center justify-center">
            <svg className="w-4 h-4 text-ink-950" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="font-display text-xl text-white">TaskFlow</span>
        </div>

        <div>
          <p className="font-display text-5xl text-white leading-tight mb-6">
            Work flows<br />
            <em className="text-amber-400">beautifully.</em>
          </p>
          <p className="text-ink-400 font-body text-base leading-relaxed max-w-sm">
            A multi-tenant task management platform. Each team gets their own isolated workspace.
          </p>
        </div>

        <div className="flex gap-6">
          {['Isolated tenants', 'Role-based access', 'Real-time updates'].map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-ink-400 text-xs font-body">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm fade-up">
          {/* Tenant badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-ink-100 rounded-full px-3 py-1.5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs text-ink-600">{tenant}.app</span>
            </div>
            <h1 className="font-display text-3xl text-ink-900">Welcome back</h1>
            <p className="text-ink-500 text-sm mt-1 font-body">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                <p className="text-rose-600 text-sm font-body">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink-400 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-400 mt-8 font-body">
            New tenant? Ask your admin for credentials.
          </p>
        </div>
      </div>
    </div>
  )
}
