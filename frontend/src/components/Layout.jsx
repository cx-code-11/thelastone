import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLogo from './AppLogo'

const NAV = [
  {
    to: '/dashboard', label: 'Dashboard',
    roles: ['admin','team-head','member','client'],
    icon: <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  },
  {
    to: '/tasks', label: 'Kanban',
    roles: ['admin','team-head','member','client'],
    icon: <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
  },
  {
    to: '/teams', label: 'Teams',
    roles: ['admin','team-head','member','client'],
    icon: <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  },
  {
    to: '/users', label: 'Users',
    roles: ['admin'],
    icon: <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
  },
]

const ROLE_META = {
  admin:       { badge: 'badge-indigo', label: '⭐ Admin' },
  'team-head': { badge: 'badge-cyan',   label: '👑 Team Head' },
  member:      { badge: 'badge-green',  label: '👤 Member' },
  client:      { badge: 'badge-amber',  label: '🏢 Client' },
}

function SidebarContent({ user, visible, meta, onClose, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <AppLogo size="sm" animate />
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg transition-colors"
            style={{ color: 'rgba(241,245,249,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(241,245,249,0.5)'}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visible.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'} onClick={onClose}>
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={isActive
                  ? { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', boxShadow: '0 0 15px rgba(99,102,241,0.1)' }
                  : { border: '1px solid transparent', color: 'rgba(241,245,249,0.45)' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f1f5f9' }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(241,245,249,0.45)' }}}>
                <span style={{ color: isActive ? '#818cf8' : 'inherit' }}>{icon}</span>
                <span className="flex-1">{label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ boxShadow: '0 0 6px #818cf8' }} />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="rounded-xl p-3 mb-2" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', animation: 'neonPulse 3s ease-in-out infinite' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-mono truncate" style={{ color: 'rgba(241,245,249,0.35)' }}>{user?.email}</p>
            </div>
          </div>
          <span className={`${meta.badge} text-[10px]`}>{meta.label}</span>
        </div>
        <button onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200"
          style={{ color: 'rgba(241,245,249,0.35)', background: 'transparent', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'rgba(241,245,249,0.35)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const visible = NAV.filter(n => n.roles.includes(user?.role))
  const meta = ROLE_META[user?.role] || { badge: 'badge-slate', label: user?.role }

  return (
    <div className="min-h-screen flex" style={{ background: '#070b14' }}>

      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 relative slide-left"
        style={{ background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute top-0 right-0 w-px h-full pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.3) 40%, rgba(34,211,238,0.15) 70%, transparent)' }} />
        <SidebarContent user={user} visible={visible} meta={meta} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-72 flex flex-col"
            style={{ background: '#0d1120', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <SidebarContent user={user} visible={visible} meta={meta}
              onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30"
          style={{ background: 'rgba(7,11,20,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(241,245,249,0.7)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <AppLogo size="sm" animate={false} />
        </header>

        <main className="flex-1 overflow-auto page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
