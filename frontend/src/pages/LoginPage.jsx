import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLogo from '../components/AppLogo'

const ROLES = [
  { icon: '⭐', role: 'Admin',     cls: 'badge-indigo', desc: 'Full workspace control' },
  { icon: '👑', role: 'Team Head', cls: 'badge-cyan',   desc: 'Assigns & oversees tasks' },
  { icon: '👤', role: 'Member',    cls: 'badge-green',  desc: 'Creates & completes tasks' },
  { icon: '🏢', role: 'Client',    cls: 'badge-amber',  desc: 'Tracks project progress' },
]

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)
  const [focused, setFocused]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/dashboard') }
    catch (err) { setError(err.response?.data?.message || 'Wrong credentials. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#070b14' }}>

      {/* ── LEFT: branding (hidden on mobile, shown on lg+) ── */}
      <div className="hidden lg:flex lg:w-[50%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob-1 absolute w-[420px] h-[420px] rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', top: '-10%', left: '-10%' }} />
          <div className="blob-2 absolute w-[320px] h-[320px] rounded-full blur-3xl opacity-08"
            style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)', bottom: '5%', right: '-5%' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10"><AppLogo size="md" animate /></div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-mono"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
            <span className="dot-pulse" /> Live workspace · 2025
          </div>
          <h1 className="font-display font-bold leading-[1.05] mb-5 text-white"
            style={{ fontSize: 'clamp(2.4rem, 3.5vw, 3.8rem)' }}>
            Work flows<br /><span className="gradient-text">beautifully.</span>
          </h1>
          <p className="text-base leading-relaxed max-w-sm mb-8" style={{ color: 'rgba(241,245,249,0.45)' }}>
            One portal for every role. Dark, fast, and built for people who ship.
          </p>
          <div className="flex gap-8">
            {[['4', 'roles'], ['∞', 'tasks'], ['1', 'portal']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="font-display font-bold text-2xl text-white">{val}</p>
                <p className="text-xs font-mono" style={{ color: 'rgba(241,245,249,0.4)' }}>{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Role cards */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5">
          {ROLES.map(({ icon, role, cls, desc }, i) => (
            <div key={role} className="rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', animation: `fadeUp 0.5s ease forwards ${0.1 * (i + 1)}s`, opacity: 0 }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{icon}</span>
                <span className={`${cls} text-[10px]`}>{role}</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: login form ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.05) 0%, transparent 65%)' }} />

        <div className="w-full max-w-sm relative fade-up">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden flex justify-center">
            <AppLogo size="lg" animate />
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">Welcome back 👋</h2>
          <p className="text-sm mb-7" style={{ color: 'rgba(241,245,249,0.4)' }}>Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <input id="email-input" type="email" className="input pl-10"
                  placeholder="you@company.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  required autoFocus />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none"
                  style={{ color: focused === 'email' ? '#818cf8' : 'rgba(241,245,249,0.3)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input id="password-input" type={showPwd ? 'text' : 'password'} className="input pl-10 pr-16"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  required />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none"
                  style={{ color: focused === 'password' ? '#818cf8' : 'rgba(241,245,249,0.3)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all"
                  style={{ color: 'rgba(241,245,249,0.4)', background: 'rgba(255,255,255,0.06)' }}>
                  {showPwd ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 fade-in"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            )}

            <button id="login-btn" type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2"/>Signing in…</>
                : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-xs mt-8 font-mono" style={{ color: 'rgba(241,245,249,0.2)' }}>
            No account? Ask your admin to add you.
          </p>
        </div>
      </div>
    </div>
  )
}
