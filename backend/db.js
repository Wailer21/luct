const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://luct_reports_user:VfNK4tNbsVQ58Bvh4glC1dVQ4cPDjbm5@dpg-d36jogadbo4c73dse7l0-a.virginia-postgres.render.com/luct_reports',
  ssl: {
    rejectUnauthorized: false // Required for Render.com PostgreSQL
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};