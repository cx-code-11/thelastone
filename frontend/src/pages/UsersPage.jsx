import { useState, useEffect } from 'react'
import api from '../utils/api'

const ROLE_CONFIG = {
  admin:  { classes: 'bg-rose-100 text-rose-700',    label: 'Admin' },
  team:   { classes: 'bg-blue-100 text-blue-700',    label: 'Team' },
  client: { classes: 'bg-ink-100 text-ink-600',      label: 'Client' },
}

export default function UsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data.users)
    } catch (err) {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setDeleting(userId)
    try {
      await api.delete(`/users/${userId}`)
      setUsers(prev => prev.filter(u => u._id !== userId))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.')
    } finally {
      setDeleting(null)
    }
  }

  const handleUserCreated = (newUser) => {
    setUsers(prev => [newUser, ...prev])
    setShowForm(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 fade-up">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Users</h1>
          <p className="text-ink-500 text-sm mt-1">{users.length} member{users.length !== 1 ? 's' : ''} in this workspace</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New User'}
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="card p-6 mb-6 fade-up">
          <h2 className="font-body font-semibold text-ink-800 mb-4">Create User</h2>
          <CreateUserForm onSuccess={handleUserCreated} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden fade-up">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-ink-400 text-sm">No users yet. Create one above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50 stagger">
              {users.map(user => (
                <tr key={user._id} className="group hover:bg-ink-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-ink-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-ink-700 uppercase">{user.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-ink-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink-600 font-mono text-xs">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_CONFIG[user.role]?.classes || ''}`}>
                      {ROLE_CONFIG[user.role]?.label || user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-400">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      disabled={deleting === user._id}
                      className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-rose-500 transition-all disabled:opacity-50"
                      title="Delete user"
                    >
                      {deleting === user._id ? (
                        <div className="w-4 h-4 border-2 border-ink-200 border-t-ink-500 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CreateUserForm({ onSuccess, onCancel }) {
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'client' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/users', form)
      onSuccess(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Full Name *</label>
        <input name="name" type="text" className="input" placeholder="Jane Doe" value={form.name} onChange={handleChange} required />
      </div>
      <div>
        <label className="label">Email *</label>
        <input name="email" type="email" className="input" placeholder="jane@company.com" value={form.email} onChange={handleChange} required />
      </div>
      <div>
        <label className="label">Password *</label>
        <input name="password" type="password" className="input" placeholder="Min. 6 chars" value={form.password} onChange={handleChange} required minLength={6} />
      </div>
      <div>
        <label className="label">Role *</label>
        <select name="role" value={form.role} onChange={handleChange} className="input">
          <option value="client">Client</option>
          <option value="team">Team</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && (
        <div className="col-span-2 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      <div className="col-span-2 flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-ink-400 border-t-white rounded-full animate-spin"/>Creating…</> : 'Create User'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  )
}
