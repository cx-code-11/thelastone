import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const COLUMNS = [
  { id: 'pending',     label: 'Pending',     emoji: '⏳', accent: '#f59e0b', bg: 'rgba(245,158,11,0.05)',    border: 'rgba(245,158,11,0.2)',  badge: 'badge-amber'  },
  { id: 'in-progress', label: 'In Progress', emoji: '⚡', accent: '#6366f1', bg: 'rgba(99,102,241,0.05)',  border: 'rgba(99,102,241,0.2)',  badge: 'badge-indigo' },
  { id: 'completed',   label: 'Completed',   emoji: '✅', accent: '#10b981', bg: 'rgba(16,185,129,0.05)',   border: 'rgba(16,185,129,0.2)',  badge: 'badge-green'  },
]
const PRIORITY_CFG = {
  high:   { cls: 'badge-red',    emoji: '🔴' },
  medium: { cls: 'badge-amber',  emoji: '🟡' },
  low:    { cls: 'badge-cyan',   emoji: '🟢' },
}
const ROLE_BADGE = { 'team-head': 'badge-cyan', member: 'badge-green', client: 'badge-amber', admin: 'badge-indigo' }

export default function TasksPage() {
  const { user }  = useAuth()
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTask, setActiveTask] = useState(null)
  const [showModal, setShowModal]   = useState(false)
  const [editTask, setEditTask]     = useState(null)
  const [error, setError]           = useState('')
  const [view, setView]             = useState('kanban') // 'kanban' | 'list'

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const fetchTasks = useCallback(async () => {
    try { const r = await api.get('/tasks'); setTasks(r.data.tasks) }
    catch { setError('Failed to load tasks.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleDragStart = ({ active }) => setActiveTask(tasks.find(t => t._id === active.id) || null)
  const handleDragEnd   = async ({ active, over }) => {
    setActiveTask(null)
    if (!over) return
    const task = tasks.find(t => t._id === active.id)
    if (!task || task.status === over.id) return
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: over.id } : t))
    try { await api.patch(`/tasks/${task._id}`, { status: over.id }) }
    catch { setTasks(prev => prev.map(t => t._id === task._id ? task : t)) }
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try { await api.delete(`/tasks/${id}`); setTasks(prev => prev.filter(t => t._id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.') }
  }
  const handleSaved = (task, isNew) => {
    if (isNew) setTasks(prev => [task, ...prev])
    else setTasks(prev => prev.map(t => t._id === task._id ? task : t))
    setShowModal(false); setEditTask(null)
  }

  if (loading) return <Spinner />

  return (
    <div className="p-4 sm:p-6 flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">Kanban Board</h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>
            {tasks.length} tasks · drag cards to move
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {[['kanban','⊟'],['list','☰']].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-2 text-sm transition-all"
                style={view === v
                  ? { background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }
                  : { background: 'transparent', color: 'rgba(241,245,249,0.4)' }}>
                {icon}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditTask(null); setShowModal(true) }} className="btn-primary gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      {view === 'list' ? (
        /* ── List view ── */
        <div className="card overflow-hidden fade-in">
          {tasks.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium text-white mb-1">No tasks yet</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-xs px-4 py-2">Create First Task</button>
            </div>
          ) : tasks.map((task, i) => {
            const pri = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium
            const col = COLUMNS.find(c => c.id === task.status) || COLUMNS[0]
            return (
              <div key={task._id} className="flex items-center gap-3 px-4 sm:px-6 py-3.5 group transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.accent, boxShadow: `0 0 6px ${col.accent}` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{task.title}</p>
                  {task.description && <p className="text-xs truncate" style={{ color: 'rgba(241,245,249,0.4)' }}>{task.description}</p>}
                </div>
                <span className={`${pri.cls} hidden sm:inline-flex`}>{pri.emoji}</span>
                <span className={`${col.badge} hidden xs:inline-flex`}>{col.label}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => { setEditTask(task); setShowModal(true) }} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>✏️</button>
                  <button onClick={() => handleDelete(task._id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Kanban view ── */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 sm:gap-4 flex-1 overflow-x-auto pb-4">
            {COLUMNS.map(col => (
              <KanbanColumn key={col.id} column={col}
                tasks={tasks.filter(t => t.status === col.id)}
                user={user} onDelete={handleDelete}
                onEdit={t => { setEditTask(t); setShowModal(true) }} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeTask && <div className="rotate-2 scale-105 w-64 sm:w-72"><TaskCard task={activeTask} user={user} ghost /></div>}
          </DragOverlay>
        </DndContext>
      )}

      {showModal && (
        <TaskModal task={editTask} user={user}
          onClose={() => { setShowModal(false); setEditTask(null) }}
          onSaved={handleSaved} />
      )}
    </div>
  )
}

function KanbanColumn({ column, tasks, user, onDelete, onEdit }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id })
  return (
    <div ref={setNodeRef}
      className="flex flex-col rounded-2xl transition-all duration-200"
      style={{
        width: '17rem', minWidth: '15rem',
        background: isOver ? column.bg.replace('0.05', '0.12') : column.bg,
        border: `1px solid ${isOver ? column.accent + '60' : column.border}`,
        boxShadow: isOver ? `0 0 25px ${column.accent}15` : 'none',
      }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${column.border}` }}>
        <div className="flex items-center gap-2">
          <span>{column.emoji}</span>
          <span className="font-display font-semibold text-white text-sm">{column.label}</span>
        </div>
        <span className={`${column.badge} text-[10px]`}>{tasks.length}</span>
      </div>
      <div className="h-0.5 mx-4" style={{ background: `linear-gradient(to right, ${column.accent}, transparent)` }} />
      <div className="flex-1 flex flex-col gap-2.5 p-3 min-h-[12rem]">
        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <p className="text-xs font-mono" style={{ color: 'rgba(241,245,249,0.2)' }}>drop here</p>
          </div>
        )}
        {tasks.map(task => (
          <DraggableCard key={task._id} task={task} user={user} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}

function DraggableCard({ task, user, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id })
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.2 : 1, cursor: isDragging ? 'grabbing' : 'grab' }}
      {...attributes} {...listeners}>
      <TaskCard task={task} user={user} onDelete={onDelete} onEdit={onEdit} />
    </div>
  )
}

function TaskCard({ task, user, onDelete, onEdit, ghost }) {
  const pri = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium
  const assignee = task.assignment_type === 'team'
    ? { label: `👥 ${task.assigned_team?.name || 'Team'}`, type: 'team' }
    : task.assigned_to ? { label: task.assigned_to.name, role: task.assigned_to.role, type: 'user' }
    : { label: 'Unassigned', type: 'none' }

  return (
    <div className="rounded-xl p-3.5 select-none transition-all duration-200 group"
      style={{
        background: ghost ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${ghost ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: ghost ? '0 0 25px rgba(99,102,241,0.3), 0 15px 35px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(8px)',
      }}>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className={`${pri.cls} text-[9px]`}>{pri.emoji} {PRIORITY_CFG[task.priority]?.cls.replace('badge-','').toUpperCase() || 'MED'}</span>
        {!ghost && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onEdit(task) }}
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>✏</button>
            <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(task._id) }}
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>✕</button>
          </div>
        )}
      </div>
      <h3 className="font-display font-semibold text-white text-xs sm:text-sm leading-snug mb-1.5 line-clamp-2">{task.title}</h3>
      {task.description && <p className="text-[11px] line-clamp-2 mb-2.5" style={{ color: 'rgba(241,245,249,0.4)' }}>{task.description}</p>}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {assignee.type === 'team' ? (
          <span className="text-[10px] font-mono" style={{ color: 'rgba(241,245,249,0.5)' }}>{assignee.label}</span>
        ) : assignee.type === 'user' ? (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              {assignee.label.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] text-white font-medium truncate max-w-[80px]">{assignee.label}</span>
          </div>
        ) : (
          <span className="text-[10px] font-mono" style={{ color: 'rgba(241,245,249,0.3)' }}>unassigned</span>
        )}
        <span className="text-[9px] font-mono" style={{ color: 'rgba(241,245,249,0.25)' }}>
          {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

function TaskModal({ task, user, onClose, onSaved }) {
  const isEdit  = !!task
  const isAdmin = user.role === 'admin'
  const [assignType, setAssignType] = useState(task?.assignment_type || 'user')
  const [form, setForm] = useState({
    title:         task?.title       || '',
    description:   task?.description || '',
    priority:      task?.priority    || 'medium',
    status:        task?.status      || 'pending',
    assigned_to:   task?.assigned_to?._id   || '',
    assigned_team: task?.assigned_team?._id || '',
  })
  const [users,   setUsers]   = useState([])
  const [teams,   setTeams]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([api.get('/users/assignable'), api.get('/teams')]).then(([uRes, tRes]) => {
      setUsers(uRes.data.users.filter(u => u.role !== 'admin'))
      setTeams(tRes.data.teams)
    }).catch(() => setError('Failed to load assignment options.'))
  }, [isAdmin])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { title: form.title, description: form.description, priority: form.priority, status: form.status }
      if (isAdmin) {
        payload.assignment_type = assignType
        payload.assigned_to     = assignType === 'user' ? (form.assigned_to || null) : null
        payload.assigned_team   = assignType === 'team' ? (form.assigned_team || null) : null
      }
      const res = isEdit ? await api.patch(`/tasks/${task._id}`, payload) : await api.post('/tasks', payload)
      onSaved(res.data.task, !isEdit)
    } catch (err) { setError(err.response?.data?.message || 'Failed to save.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden modal-in"
        style={{ background: '#0d1120', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 50px rgba(99,102,241,0.15), 0 30px 60px rgba(0,0,0,0.5)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #6366f1, #22d3ee)' }} />

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white">{isEdit ? '✏️ Edit Task' : '+ New Task'}</h2>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
                {isAdmin ? 'admin · assign freely' : 'will be assigned to you'}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(241,245,249,0.5)' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input name="title" type="text" className="input" placeholder="What needs to be done?" value={form.title} onChange={handleChange} required autoFocus />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" rows={3} className="input resize-none" placeholder="More details…" value={form.description} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="input">
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="input">
                  <option value="pending">⏳ Pending</option>
                  <option value="in-progress">⚡ In Progress</option>
                  <option value="completed">✅ Done</option>
                </select>
              </div>
            </div>

            {isAdmin && (
              <div>
                <label className="label">Assign To</label>
                <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {[['user','👤 Individual'],['team','👥 Team']].map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => setAssignType(val)}
                      className="flex-1 py-2 text-sm font-semibold transition-all"
                      style={assignType === val
                        ? { background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' }
                        : { background: 'transparent', color: 'rgba(241,245,249,0.4)' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {assignType === 'user' && (
                  users.length === 0
                    ? <p className="text-xs text-amber-400">No users yet. <Link to="/users" onClick={onClose} className="underline">Add users.</Link></p>
                    : <select name="assigned_to" value={form.assigned_to} onChange={handleChange} className="input">
                        <option value="">— Unassigned —</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                      </select>
                )}
                {assignType === 'team' && (
                  teams.length === 0
                    ? <p className="text-xs text-amber-400">No teams yet. <Link to="/teams" onClick={onClose} className="underline">Create a team.</Link></p>
                    : <select name="assigned_team" value={form.assigned_team} onChange={handleChange} className="input">
                        <option value="">— Unassigned —</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.name} ({t.members?.length || 0} members)</option>)}
                      </select>
                )}
              </div>
            )}

            {error && <div className="rounded-xl px-4 py-3 text-sm fade-in" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>⚠️ {error}</div>}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="btn-primary gap-2">
                {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Saving…</> : isEdit ? '✓ Save' : '+ Create'}
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
