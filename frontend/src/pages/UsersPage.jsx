import { useState, useEffect } from 'react'
import api from '../utils/api'

const ROLE_OPTIONS = ['team-head', 'member', 'client']
const ROLE_CFG = {
  'team-head': { label: '👑 Team Head', badge: 'badge-cyan'   },
  member:      { label: '👤 Member',    badge: 'badge-green'  },
  client:      { label: '🏢 Client',   badge: 'badge-amber'  },
}

export default function UsersPage() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [deleting, setDeleting]         = useState(null)
  const [updatingRole, setUpdatingRole] = useState(null)

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(res.data.users))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    setDeleting(id)
    try { await api.delete(`/users/${id}`); setUsers(prev => prev.filter(u => u._id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.') }
    finally { setDeleting(null) }
  }
  const handleRoleChange = async (id, role) => {
    setUpdatingRole(id)
    try {
      const res = await api.patch(`/users/${id}/role`, { role })
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: res.data.user.role } : u))
    } catch (err) { alert(err.response?.data?.message || 'Failed.') }
    finally { setUpdatingRole(null) }
  }

  if (loading) return <Spinner />

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 fade-up">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">Users</h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {users.length} registered · admin manages all access
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New User
        </button>
      </div>

      {error && <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>⚠️ {error}</div>}

      <div className="card overflow-hidden fade-up">
        {users.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium text-white mb-1">No users yet</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(241,245,249,0.4)' }}>Add your first team member or client.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">Add User</button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {['User', 'Email', 'Role', 'Joined', ''].map(th => (
                      <th key={th} className="text-left px-5 py-3 text-[10px] font-mono uppercase tracking-widest"
                        style={{ color: 'rgba(241,245,249,0.3)' }}>{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="group transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 10px rgba(99,102,241,0.3)' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono" style={{ color: 'rgba(241,245,249,0.5)' }}>{u.email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {updatingRole === u._id
                          ? <div className="w-4 h-4 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                          : <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                              className={`text-[10px] font-mono font-bold rounded-full cursor-pointer border-0 outline-none py-0.5 pl-2 pr-1 ${ROLE_CFG[u.role]?.badge || 'badge-indigo'}`}
                              style={{ background: 'transparent' }}>
                              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label || r}</option>)}
                            </select>
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono" style={{ color: 'rgba(241,245,249,0.35)' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {deleting === u._id
                          ? <div className="w-4 h-4 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin ml-auto" />
                          : <button onClick={() => handleDelete(u._id, u.name)}
                              className="opacity-0 group-hover:opacity-100 transition-all btn-danger text-[10px] px-2.5 py-1">
                              🗑 delete
                            </button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y" style={{ '--divide-color': 'rgba(255,255,255,0.06)' }}>
              {users.map(u => (
                <div key={u._id} className="p-4 flex items-center gap-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-xs font-mono truncate" style={{ color: 'rgba(241,245,249,0.4)' }}>{u.email}</p>
                    <span className={`${ROLE_CFG[u.role]?.badge || 'badge-indigo'} mt-1 inline-flex text-[9px]`}>{ROLE_CFG[u.role]?.label}</span>
                  </div>
                  <button onClick={() => handleDelete(u._id, u.name)} className="btn-danger px-2.5 py-1.5 text-xs shrink-0">🗑</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && <CreateUserModal onClose={() => setShowModal(false)} onCreated={u => { setUsers(prev => [u, ...prev]); setShowModal(false) }} />}
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'member' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { const res = await api.post('/users', form); onCreated(res.data.user) }
    catch (err) { setError(err.response?.data?.message || 'Failed to create.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden modal-in"
        style={{ background: '#0d1120', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 50px rgba(99,102,241,0.15), 0 30px 60px rgba(0,0,0,0.5)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #6366f1, #22d3ee)' }} />
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-xl text-white">+ New User</h2>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>Add someone to the workspace</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(241,245,249,0.5)' }}>✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Jane Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" placeholder="jane@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input pr-14" placeholder="Min. 6 chars"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded-lg"
                  style={{ color: 'rgba(241,245,249,0.4)', background: 'rgba(255,255,255,0.06)' }}>
                  {showPwd ? 'hide' : 'show'}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Role *</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input">
                <option value="team-head">👑 Team Head — sees all tasks</option>
                <option value="member">👤 Member — manages own tasks</option>
                <option value="client">🏢 Client — views assigned tasks</option>
              </select>
            </div>
            {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>⚠️ {error}</div>}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="btn-primary gap-2">
                {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Creating…</> : '+ Create User'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" /></div>
}
