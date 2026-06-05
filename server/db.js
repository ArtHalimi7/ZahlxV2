import dotenv from 'dotenv';
import fs from 'fs';
import mysql from 'mysql2/promise';

dotenv.config();

const buildSslConfig = () => {
  const sslMode = (process.env.DB_SSL_MODE || '').toUpperCase();
  const sslCa = process.env.DB_SSL_CA;
  const sslCaPath = process.env.DB_SSL_CA_PATH;

  if (sslCa) {
    return { ca: sslCa, rejectUnauthorized: true };
  }

  if (sslCaPath && fs.existsSync(sslCaPath)) {
    return {
      ca: fs.readFileSync(sslCaPath, 'utf8'),
      rejectUnauthorized: true,
    };
  }

  if (sslMode === 'REQUIRED') {
    return { rejectUnauthorized: false };
  }

  return undefined;
};

const buildPoolOptions = () => {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    const sslMode = (url.searchParams.get('ssl-mode') || process.env.DB_SSL_MODE || '').toUpperCase();

    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: sslMode === 'REQUIRED' ? buildSslConfig() : buildSslConfig(),
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zahlx',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: buildSslConfig(),
  };
};

const pool = mysql.createPool(buildPoolOptions());

export default pool;
