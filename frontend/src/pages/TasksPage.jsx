import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const STATUSES = ['pending', 'in-progress', 'completed']

const STATUS_CONFIG = {
  pending:       { label: 'Pending',     classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  'in-progress': { label: 'In Progress', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed:     { label: 'Completed',   classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [error, setError]         = useState('')
  const [deleting, setDeleting]   = useState(null)
  const [updating, setUpdating]   = useState(null)

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data.tasks)
    } catch (err) {
      setError('Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdating(taskId)
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus })
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t))
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.')
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return
    setDeleting(taskId)
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t._id !== taskId))
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  if (loading) return <PageSpinner />

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 fade-up">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Tasks</h1>
          <p className="text-ink-500 text-sm mt-1">{tasks.length} total tasks</p>
        </div>
        {user.role === 'admin' && (
          <Link to="/tasks/new" className="btn-primary">+ New Task</Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 fade-up">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize ${
              filter === s
                ? 'bg-ink-900 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            {s === 'all' ? `All (${tasks.length})` : `${STATUS_CONFIG[s].label} (${tasks.filter(t=>t.status===s).length})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center fade-up">
          <div className="w-12 h-12 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-ink-500 text-sm">No tasks found.</p>
          {user.role === 'admin' && (
            <Link to="/tasks/new" className="btn-primary inline-block mt-4 text-xs px-4 py-2">Create first task</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {filtered.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              userRole={user.role}
              userId={user.id}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              isUpdating={updating === task._id}
              isDeleting={deleting === task._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, userRole, userId, onStatusChange, onDelete, isUpdating, isDeleting }) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  const canEdit = userRole === 'admin' || (userRole === 'team' && task.assigned_to?._id === userId)

  return (
    <div className="card p-5 flex items-start gap-4 group">
      {/* Status indicator */}
      <div className={`mt-0.5 px-2 py-0.5 rounded border text-xs font-medium shrink-0 ${cfg.classes}`}>
        {cfg.label}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-ink-800 text-sm">{task.title}</h3>
        {task.description && (
          <p className="text-ink-500 text-xs mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-ink-400">
            → {task.assigned_to?.name || '—'}
            <span className="ml-1 text-ink-300">({task.assigned_to?.role})</span>
          </span>
          {task.created_by && (
            <span className="text-xs text-ink-300">by {task.created_by?.name}</span>
          )}
          <span className="text-xs text-ink-300">
            {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {canEdit && (
          <select
            value={task.status}
            onChange={e => onStatusChange(task._id, e.target.value)}
            disabled={isUpdating}
            className="text-xs border border-ink-200 rounded-lg px-2 py-1.5 bg-white text-ink-700 focus:outline-none focus:ring-1 focus:ring-ink-400 disabled:opacity-50 cursor-pointer"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}

        {isUpdating && <Spinner />}

        {userRole === 'admin' && !isUpdating && (
          <button
            onClick={() => onDelete(task._id)}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-rose-500 transition-all duration-150 disabled:opacity-50"
            title="Delete task"
          >
            {isDeleting ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
    </div>
  )
}
