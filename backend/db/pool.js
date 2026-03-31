const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false },   // uncomment for AWS RDS / Heroku
});

pool.on('error', (err) => {
  console.error('🔴 Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
