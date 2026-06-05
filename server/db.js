// ============================================================
// Zahlx — PostgreSQL Connection Pool
// Uses pg.Pool for efficient connection reuse across requests.
// ============================================================
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'zahlx',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max: 10,                   // Max concurrent connections
  idleTimeoutMillis: 30000,  // Close idle clients after 30s
});

export default pool;
