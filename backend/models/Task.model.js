const pool = require('../db/pool');

// ─── populate helper ──────────────────────────────────────────────────────────
async function populate(tasks) {
  if (!tasks || tasks.length === 0) return tasks;
  const isArray = Array.isArray(tasks);
  const arr = isArray ? tasks : [tasks];

  // Collect all referenced UUIDs
  const userIds = new Set();
  const teamIds = new Set();
  for (const t of arr) {
    if (t.assigned_to)   userIds.add(t.assigned_to);
    if (t.assigned_team) teamIds.add(t.assigned_team);
    if (t.created_by)    userIds.add(t.created_by);
  }

  // Fetch users
  const usersMap = {};
  if (userIds.size > 0) {
    const ids = [...userIds];
    const { rows } = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id = ANY($1::uuid[])`,
      [ids]
    );
    for (const u of rows) usersMap[u.id] = u;
  }

  // Fetch teams (with members)
  const teamsMap = {};
  if (teamIds.size > 0) {
    const ids = [...teamIds];
    const { rows: teamRows } = await pool.query(
      `SELECT id, name FROM teams WHERE id = ANY($1::uuid[])`, [ids]
    );
    const ph = ids.map((_, i) => `$${i + 1}`).join(',');
    const { rows: memberRows } = await pool.query(
      `SELECT tm.team_id, u.id, u.name, u.email, u.role
       FROM team_members tm JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id IN (${ph})`,
      ids
    );
    for (const t of teamRows) {
      teamsMap[t.id] = { id: t.id, name: t.name, members: [] };
    }
    for (const m of memberRows) {
      if (teamsMap[m.team_id]) {
        teamsMap[m.team_id].members.push({ id: m.id, name: m.name, email: m.email, role: m.role });
      }
    }
  }

  const result = arr.map(t => ({
    ...t,
    assigned_to:   t.assigned_to   ? usersMap[t.assigned_to]   || null : null,
    assigned_team: t.assigned_team ? teamsMap[t.assigned_team] || null : null,
    created_by:    t.created_by    ? usersMap[t.created_by]    || null : null,
  }));

  return isArray ? result : result[0];
}

// ─── Task model ───────────────────────────────────────────────────────────────

const Task = {
  async find(filter = {}) {
    let query;
    let params = [];

    if (filter.adminAll) {
      query = `SELECT * FROM tasks ORDER BY created_at DESC`;
    } else if (filter.userId && filter.teamIds) {
      const teamPlaceholders = filter.teamIds.length > 0
        ? `OR (assignment_type = 'team' AND assigned_team = ANY($2::uuid[]))`
        : '';
      const teamParam = filter.teamIds.length > 0 ? [filter.userId, filter.teamIds] : [filter.userId];
      query = `
        SELECT * FROM tasks
        WHERE (assignment_type = 'user'  AND assigned_to = $1)
           OR (assignment_type = 'self'  AND assigned_to = $1)
           OR  created_by = $1
           ${teamPlaceholders}
        ORDER BY created_at DESC`;
      params = teamParam;
    } else {
      query = `SELECT * FROM tasks ORDER BY created_at DESC`;
    }

    const { rows } = await pool.query(query, params);
    return populate(rows);
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!rows[0]) return null;
    return populate(rows[0]);
  },

  async create({ title, description = '', priority = 'medium', status = 'pending',
                 assignment_type = 'self', assigned_to = null, assigned_team = null, created_by }) {
    const { rows } = await pool.query(
      `INSERT INTO tasks
         (title, description, priority, status, assignment_type, assigned_to, assigned_team, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [title, description, priority, status, assignment_type, assigned_to, assigned_team, created_by]
    );
    return populate(rows[0]);
  },

  async update(id, fields) {
    const allowed = ['title','description','status','priority','assignment_type','assigned_to','assigned_team'];
    const sets = [];
    const vals = [];
    let idx = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = $${idx++}`);
        vals.push(fields[key]);
      }
    }
    if (sets.length === 0) return Task.findById(id);
    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    if (!rows[0]) return null;
    return populate(rows[0]);
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Task;
