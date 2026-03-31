const pool    = require('../db/pool');
const bcrypt  = require('bcryptjs');

const User = {
  /** Find by id (no password) */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  /** Find by email — optionally include password hash */
  async findByEmail(email, withPassword = false) {
    const cols = withPassword
      ? 'id, name, email, password, role, created_at, updated_at'
      : 'id, name, email, role, created_at, updated_at';
    const { rows } = await pool.query(
      `SELECT ${cols} FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return rows[0] || null;
  },

  /** List all users except admins */
  async findNonAdmins() {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users WHERE role <> 'admin' ORDER BY created_at DESC`
    );
    return rows;
  },

  /** List all users (for dropdowns) */
  async findAll() {
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY name ASC'
    );
    return rows;
  },

  /** Find one matching role */
  async findOneByRole(role) {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1',
      [role]
    );
    return rows[0] || null;
  },

  /** Create user (hashes password) */
  async create({ name, email, password, role = 'member' }) {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email.toLowerCase(), hash, role]
    );
    return rows[0];
  },

  /** Update role */
  async updateRole(id, role) {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, name, email, role, created_at, updated_at`,
      [role, id]
    );
    return rows[0] || null;
  },

  /** Delete */
  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return rowCount > 0;
  },

  /** Compare plain password with stored hash */
  async comparePassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },
};

module.exports = User;
