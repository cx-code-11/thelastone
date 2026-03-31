import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

export default function CreateTaskPage() {
  const navigate = useNavigate()

  const [form, setForm]     = useState({ title: '', description: '', assigned_to: '' })
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(res.data.users))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setFetching(false))
  }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.assigned_to) { setError('Please select a user to assign this task to.'); return }
    setLoading(true)
    try {
      await api.post('/tasks', form)
      setSuccess(true)
      setTimeout(() => navigate('/tasks'), 1200)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center fade-up">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p className="font-display text-2xl text-ink-900">Task created!</p>
          <p className="text-ink-500 text-sm mt-1">Redirecting to tasks…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 fade-up">
        <Link to="/tasks" className="text-xs text-ink-400 hover:text-ink-700 flex items-center gap-1 mb-4 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to tasks
        </Link>
        <h1 className="font-display text-3xl text-ink-900">New Task</h1>
        <p className="text-ink-500 text-sm mt-1">Create and assign a task to a team member.</p>
      </div>

      <div className="card p-8 fade-up">
        {fetching ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Task Title *</label>
              <input
                name="title"
                type="text"
                className="input"
                placeholder="e.g. Review Q3 report"
                value={form.title}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                rows={4}
                className="input resize-none"
                placeholder="Optional details about this task…"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Assign To *</label>
              {users.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-amber-700 text-sm">
                    No users found.{' '}
                    <Link to="/users" className="underline">Create users first.</Link>
                  </p>
                </div>
              ) : (
                <select
                  name="assigned_to"
                  value={form.assigned_to}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">— Select a user —</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                <p className="text-rose-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading || users.length === 0} className="btn-primary flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-ink-400 border-t-white rounded-full animate-spin"/>
                    Creating…
                  </>
                ) : 'Create Task'}
              </button>
              <Link to="/tasks" className="btn-secondary">Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
