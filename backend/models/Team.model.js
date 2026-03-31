const pool = require('../db/pool');

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Add members array to a team row (or array of team rows) */
async function attachMembers(teams) {
  const isArray = Array.isArray(teams);
  const arr = isArray ? teams : [teams];
  if (arr.length === 0) return arr;

  const ids = arr.map(t => t.id);
  // Build $1,$2,... placeholders
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rows: members } = await pool.query(
    `SELECT tm.team_id,
            u.id, u.name, u.email, u.role
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id IN (${placeholders})`,
    ids
  );

  const byTeam = {};
  for (const m of members) {
    if (!byTeam[m.team_id]) byTeam[m.team_id] = [];
    byTeam[m.team_id].push({ id: m.id, name: m.name, email: m.email, role: m.role });
  }

  const result = arr.map(t => ({ ...t, members: byTeam[t.id] || [] }));
  return isArray ? result : result[0];
}

/** Populate created_by and members on a team (or array) */
async function populateTeam(teams) {
  return attachMembers(teams);
}

// ─── Team model ───────────────────────────────────────────────────────────────

const Team = {
  /** Get teams — all (admin) or just the ones the user belongs to */
  async find({ memberId } = {}) {
    let rows;
    if (memberId) {
      ({ rows } = await pool.query(
        `SELECT t.id, t.name, t.description, t.created_by, t.created_at, t.updated_at,
                u.name AS creator_name, u.email AS creator_email
         FROM teams t
         JOIN users u ON u.id = t.created_by
         JOIN team_members tm ON tm.team_id = t.id
         WHERE tm.user_id = $1
         ORDER BY t.created_at DESC`,
        [memberId]
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT t.id, t.name, t.description, t.created_by, t.created_at, t.updated_at,
                u.name AS creator_name, u.email AS creator_email
         FROM teams t
         JOIN users u ON u.id = t.created_by
         ORDER BY t.created_at DESC`
      ));
    }
    return populateTeam(rows.map(formatTeam));
  },

  /** Find by id */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.description, t.created_by, t.created_at, t.updated_at,
              u.name AS creator_name, u.email AS creator_email
       FROM teams t
       JOIN users u ON u.id = t.created_by
       WHERE t.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    return populateTeam(formatTeam(rows[0]));
  },

  /** Find teams where the user is a member */
  async findByMember(userId) {
    const { rows } = await pool.query(
      `SELECT t.id FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1`,
      [userId]
    );
    return rows; // [{ id }]
  },

  /** Create a team and set members */
  async create({ name, description = '', members = [], created_by }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO teams (name, description, created_by)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, created_by, created_at, updated_at`,
        [name, description, created_by]
      );
      const team = rows[0];
      if (members.length > 0) {
        const vals = members.map((uid, i) => `($1, $${i + 2})`).join(',');
        await client.query(
          `INSERT INTO team_members (team_id, user_id) VALUES ${vals}`,
          [team.id, ...members]
        );
      }
      await client.query('COMMIT');
      return Team.findById(team.id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  /** Update team */
  async update(id, { name, description, members }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updates = [];
      const vals = [];
      let pIdx = 1;
      if (name        !== undefined) { updates.push(`name = $${pIdx++}`);        vals.push(name); }
      if (description !== undefined) { updates.push(`description = $${pIdx++}`); vals.push(description); }
      if (updates.length > 0) {
        vals.push(id);
        await client.query(
          `UPDATE teams SET ${updates.join(', ')} WHERE id = $${pIdx}`,
          vals
        );
      }
      if (members !== undefined) {
        await client.query('DELETE FROM team_members WHERE team_id = $1', [id]);
        if (members.length > 0) {
          const placeholders = members.map((_, i) => `($1, $${i + 2})`).join(',');
          await client.query(
            `INSERT INTO team_members (team_id, user_id) VALUES ${placeholders}`,
            [id, ...members]
          );
        }
      }
      await client.query('COMMIT');
      return Team.findById(id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  /** Delete team */
  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

function formatTeam(row) {
  return {
    id:           row.id,
    name:         row.name,
    description:  row.description,
    created_at:   row.created_at,
    updated_at:   row.updated_at,
    created_by: {
      id:    row.created_by,
      name:  row.creator_name,
      email: row.creator_email,
    },
  };
}

module.exports = Team;
