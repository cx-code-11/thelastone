require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const pool    = require('./db/pool');
const User    = require('./models/User.model');
const fs      = require('fs');
const path    = require('path');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes');
const teamRoutes = require('./routes/team.routes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'postgresql' }));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ─── DB + Start ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Verify connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');

    // Run schema migrations
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('📐 Schema applied');
    }

    // Seed admin if none exists
    const admin = await User.findOneByRole('admin');
    if (!admin) {
      await User.create({
        name: 'Admin',
        email: 'admin@taskflow.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('🌱 Admin seeded: admin@taskflow.com / admin123');
    }

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('❌ PostgreSQL failed:', err.message);
    process.exit(1);
  }
}

start();
