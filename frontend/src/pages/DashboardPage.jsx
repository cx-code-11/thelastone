import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  completed:   { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

export default function DashboardPage() {
  const { user, tenant } = useAuth()
  const [tasks, setTasks]   = useState([])
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, usersRes] = await Promise.allSettled([
          api.get('/tasks'),
          user.role === 'admin' ? api.get('/users') : Promise.resolve({ data: { users: [] } }),
        ])
        if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.tasks)
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.role])

  const counts = {
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
  }

  const recentTasks = tasks.slice(0, 5)

  if (loading) return <PageSpinner />

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 fade-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-ink-400 uppercase tracking-wider">{tenant}</span>
          <span className="text-ink-300">·</span>
          <span className="font-mono text-xs text-ink-400 capitalize">{user.role}</span>
        </div>
        <h1 className="font-display text-3xl text-ink-900">
          Good {timeOfDay()}, {user.name.split(' ')[0]}.
        </h1>
        <p className="text-ink-500 text-sm mt-1">Here's what's happening in your workspace.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <StatCard label="Total Tasks"   value={counts.total}      accent="bg-ink-900" />
        <StatCard label="Pending"       value={counts.pending}    accent="bg-amber-500" />
        <StatCard label="In Progress"   value={counts.inProgress} accent="bg-blue-500" />
        <StatCard label="Completed"     value={counts.completed}  accent="bg-emerald-500" />
      </div>

      {user.role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 col-span-2 lg:col-span-1">
            <p className="label">Team Members</p>
            <p className="font-display text-4xl text-ink-900">{users.length}</p>
          </div>
          <div className="card p-5 flex items-center gap-4 col-span-2 lg:col-span-3">
            <div className="flex-1">
              <p className="label mb-2">Quick Actions</p>
              <div className="flex gap-3 flex-wrap">
                <Link to="/tasks/new" className="btn-primary text-xs px-4 py-2">+ New Task</Link>
                <Link to="/users"     className="btn-secondary text-xs px-4 py-2">Manage Users</Link>
                <Link to="/tasks"     className="btn-secondary text-xs px-4 py-2">View All Tasks</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="card fade-up">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-body font-semibold text-ink-800">Recent Tasks</h2>
          <Link to="/tasks" className="text-xs text-ink-400 hover:text-ink-700 transition-colors">View all →</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-ink-400 text-sm">No tasks yet.</p>
            {user.role === 'admin' && (
              <Link to="/tasks/new" className="btn-primary inline-block mt-3 text-xs px-4 py-2">Create your first task</Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-ink-50 stagger">
            {recentTasks.map(task => (
              <li key={task._id} className="px-6 py-4 flex items-center gap-4">
                <StatusDot status={task.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{task.title}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Assigned to {task.assigned_to?.name || '—'}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${accent} rounded-l-2xl`} />
      <p className="label">{label}</p>
      <p className="font-display text-4xl text-ink-900 mt-1">{value}</p>
    </div>
  )
}

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function timeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
    </div>
  )
}
