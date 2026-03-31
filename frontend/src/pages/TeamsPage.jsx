import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const ROLE_BADGE = { 'team-head': 'badge-cyan', member: 'badge-green', client: 'badge-amber', admin: 'badge-indigo' }
const ROLE_LABEL = { 'team-head': '👑 Team Head', member: '👤 Member', client: '🏢 Client', admin: '⭐ Admin' }

export default function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTeam, setEditTeam]   = useState(null)

  const fetchTeams = () => {
    setLoading(true)
    api.get('/teams').then(res => setTeams(res.data.teams)).finally(() => setLoading(false))
  }
  useEffect(() => { fetchTeams() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this team?')) return
    try { await api.delete(`/teams/${id}`); setTeams(prev => prev.filter(t => t._id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.') }
  }
  const handleSaved = (team, isNew) => {
    if (isNew) setTeams(prev => [team, ...prev])
    else setTeams(prev => prev.map(t => t._id === team._id ? team : t))
    setShowModal(false); setEditTeam(null)
  }

  if (loading) return <Spinner />

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 fade-up">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">Teams</h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {user.role === 'admin' ? `${teams.length} team(s) · admin manages membership` : `you're in ${teams.length} team(s)`}
          </p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => { setEditTeam(null); setShowModal(true) }} className="btn-primary gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            New Team
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="card p-12 sm:p-16 text-center fade-up">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>◈</div>
          <p className="font-display font-semibold text-white text-lg mb-1">No teams yet</p>
          <p className="text-sm mb-5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {user.role === 'admin' ? 'Create your first team to group members.' : "You haven't been added to a team yet."}
          </p>
          {user.role === 'admin' && <button onClick={() => setShowModal(true)} className="btn-primary">Create First Team</button>}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 stagger">
          {teams.map(team => (
            <TeamCard key={team._id} team={team} isAdmin={user.role === 'admin'}
              onEdit={() => { setEditTeam(team); setShowModal(true) }}
              onDelete={() => handleDelete(team._id)} />
          ))}
        </div>
      )}

      {showModal && (
        <TeamModal team={editTeam}
          onClose={() => { setShowModal(false); setEditTeam(null) }}
          onSaved={handleSaved} />
      )}
    </div>
  )
}

function TeamCard({ team, isAdmin, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-bold text-lg text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 14px rgba(99,102,241,0.35)' }}>
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-white text-base sm:text-lg">{team.name}</h3>
              <span className="badge-indigo text-[9px]">{team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}</span>
            </div>
            {team.description && <p className="text-sm mb-2" style={{ color: 'rgba(241,245,249,0.5)' }}>{team.description}</p>}
            <button onClick={() => setExpanded(e => !e)}
              className="text-xs font-mono transition-colors flex items-center gap-1"
              style={{ color: 'rgba(99,102,241,0.7)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(99,102,241,0.7)'}>
              {expanded ? '▲ hide' : '▼ show'} members
            </button>
            {expanded && (
              <div className="mt-3 flex flex-wrap gap-2">
                {team.members?.length === 0
                  ? <span className="text-xs font-mono" style={{ color: 'rgba(241,245,249,0.3)' }}>No members yet</span>
                  : team.members?.map(m => (
                    <div key={m._id} className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 ${ROLE_BADGE[m.role] || 'badge-indigo'}`}>
                      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold bg-white/20">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      {m.name}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <button onClick={onEdit} className="btn-secondary text-xs px-3 py-1.5">✏️ Edit</button>
            <button onClick={onDelete} className="btn-danger px-3 py-1.5">🗑</button>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamModal({ team, onClose, onSaved }) {
  const isEdit = !!team
  const [name, setName]     = useState(team?.name || '')
  const [desc, setDesc]     = useState(team?.description || '')
  const [members, setMembers] = useState(team?.members?.map(m => m._id) || [])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get('/users/assignable')
      .then(res => setAllUsers(res.data.users.filter(u => u.role !== 'admin')))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setFetching(false))
  }, [])

  const toggle = id => setMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Team name required.'); return }
    setLoading(true)
    try {
      const res = isEdit
        ? await api.patch(`/teams/${team._id}`, { name, description: desc, members })
        : await api.post('/teams', { name, description: desc, members })
      onSaved(res.data.team, !isEdit)
    } catch (err) { setError(err.response?.data?.message || 'Failed to save.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden modal-in"
        style={{ background: '#0d1120', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 50px rgba(99,102,241,0.15), 0 30px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(to right, #6366f1, #22d3ee)' }} />
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-xl text-white">{isEdit ? '✏️ Edit Team' : '◈ New Team'}</h2>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>Group employees and clients</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(241,245,249,0.5)' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Team Name *</label>
              <input className="input" placeholder="e.g. Marketing Team" value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea rows={2} className="input resize-none" placeholder="What does this team work on?" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            <div>
              <label className="label">Members ({members.length} selected)</label>
              {fetching ? (
                <div className="flex justify-center py-6"><div className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" /></div>
              ) : allUsers.length === 0 ? (
                <p className="text-xs font-mono" style={{ color: 'rgba(241,245,249,0.4)' }}>No users found. Add users first.</p>
              ) : (
                <div className="rounded-xl overflow-hidden max-h-52 overflow-y-auto"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  {allUsers.map(u => (
                    <label key={u._id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <input type="checkbox" checked={members.includes(u._id)} onChange={() => toggle(u._id)} />
                      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs font-mono" style={{ color: 'rgba(241,245,249,0.4)' }}>{u.email}</p>
                      </div>
                      <span className={`${ROLE_BADGE[u.role] || 'badge-indigo'} text-[9px]`}>{ROLE_LABEL[u.role]}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>⚠️ {error}</div>}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="btn-primary gap-2">
                {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Saving…</> : isEdit ? '✓ Save' : '◈ Create Team'}
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
