import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const STATUS_CFG = {
  pending:       { dot: '#f59e0b', badge: 'badge-amber',  label: 'Pending'     },
  'in-progress': { dot: '#6366f1', badge: 'badge-indigo', label: 'In Progress' },
  completed:     { dot: '#10b981', badge: 'badge-green',  label: 'Done'        },
}

function useCountUp(target, duration = 700) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!target) return
    let n = 0
    const step = target / (duration / 16)
    const t = setInterval(() => {
      n += step; if (n >= target) { setCount(target); clearInterval(t) } else setCount(Math.floor(n))
    }, 16)
    return () => clearInterval(t)
  }, [target])
  return count
}

function StatCard({ label, value, accent, emoji, gradient }) {
  const count = useCountUp(value)
  return (
    <div className="card card-hover relative overflow-hidden p-4 sm:p-5"
      style={{ borderTop: `2px solid ${accent}` }}>
      <div className="absolute top-0 left-0 right-0 h-12 opacity-5"
        style={{ background: `radial-gradient(at 50% 0%, ${accent}, transparent 60%)` }} />
      <p className="label">{emoji} {label}</p>
      <p className="font-display font-bold text-4xl sm:text-5xl text-white relative z-10"
        style={{ animation: 'countUp 0.5s ease forwards', fontVariantNumeric: 'tabular-nums' }}>{count}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [tasks,   setTasks]   = useState([])
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [api.get('/tasks')]
    if (user.role === 'admin') fetches.push(api.get('/users'))
    Promise.allSettled(fetches).then(([tRes, uRes]) => {
      if (tRes.status === 'fulfilled') setTasks(tRes.value.data.tasks)
      if (uRes?.status === 'fulfilled') setUsers(uRes.value.data.users)
    }).finally(() => setLoading(false))
  }, [user.role])

  const counts = {
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
  }
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return <Spinner />

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 sm:mb-8 fade-up">
        <p className="text-xs font-mono mb-2 flex items-center gap-2" style={{ color: 'rgba(99,102,241,0.8)' }}>
          <span className="dot-pulse" /> live workspace
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-1">
          {greeting}, <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>
          Here's what's going on in your workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 stagger">
        <StatCard label="Total"       value={counts.total}      accent="#6366f1" emoji="📋" />
        <StatCard label="Pending"     value={counts.pending}    accent="#f59e0b" emoji="⏳" />
        <StatCard label="In Progress" value={counts.inProgress} accent="#22d3ee" emoji="⚡" />
        <StatCard label="Done"        value={counts.completed}  accent="#10b981" emoji="✅" />
      </div>

      {/* Admin: users + quick actions */}
      {user.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 stagger">
          <div className="card p-4 sm:p-5">
            <p className="label mb-2">Total Users</p>
            <p className="font-display font-bold text-4xl sm:text-5xl text-white">{users.length}</p>
          </div>
          <div className="card p-4 sm:p-5 sm:col-span-2">
            <p className="label mb-3">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/tasks"  className="btn-primary  text-xs px-3 py-2 gap-1.5">⊟ Kanban Board</Link>
              <Link to="/teams"  className="btn-secondary text-xs px-3 py-2 gap-1.5">◈ Teams</Link>
              <Link to="/users"  className="btn-secondary text-xs px-3 py-2 gap-1.5">◎ Users</Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="card fade-up overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="font-display font-semibold text-white text-base sm:text-lg">Recent Tasks</h2>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(241,245,249,0.35)' }}>latest activity</p>
          </div>
          <Link to="/tasks" className="text-xs font-mono transition-colors hover:text-indigo-400"
            style={{ color: 'rgba(99,102,241,0.7)' }}>
            Open board →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-medium text-white mb-1">No tasks yet</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(241,245,249,0.4)' }}>Create your first task on the board</p>
            <Link to="/tasks" className="btn-primary text-xs px-4 py-2">Go to board</Link>
          </div>
        ) : (
          <ul className="stagger divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {tasks.slice(0, 8).map(task => {
              const cfg = STATUS_CFG[task.status] || STATUS_CFG.pending
              return (
                <li key={task._id}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{task.title}</p>
                    <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'rgba(241,245,249,0.35)' }}>
                      {task.assignment_type === 'team' && task.assigned_team
                        ? `👥 ${task.assigned_team.name}`
                        : task.assigned_to ? `→ ${task.assigned_to.name}` : 'unassigned'}
                    </p>
                  </div>
                  <span className={`${cfg.badge} shrink-0 hidden xs:inline-flex`}>{cfg.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
  </div>
}
