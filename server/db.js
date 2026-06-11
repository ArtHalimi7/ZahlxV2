import dotenv from 'dotenv';
import fs from 'fs';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SQL translation logic
export function translateSql(sql) {
  if (typeof sql !== 'string') return sql;
  let res = sql;
  
  // Replace FOR UPDATE
  res = res.replace(/\s*FOR\s+UPDATE\s*/gi, ' ');
  
  // Replace DATE_FORMAT(col, format)
  res = res.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'([^']+)'\s*\)/gi, (match, col, format) => {
    let sqliteFormat = format.replace(/%u/g, '%W').replace(/%v/g, '%W');
    return `strftime('${sqliteFormat}', ${col})`;
  });

  // Replace CURDATE()
  res = res.replace(/CURDATE\(\)/gi, "date('now', 'localtime')");
  
  // Replace CURDATE
  res = res.replace(/\bCURDATE\b/gi, "date('now', 'localtime')");

  // Replace DATE(column)
  res = res.replace(/DATE\(([^)]+)\)/gi, "date($1)");
  
  // Replace DATE_SUB(...)
  res = res.replace(/DATE_SUB\s*\(\s*date\('now',\s*'localtime'\)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi, "date('now', 'localtime', '-$1 days')");
  res = res.replace(/DATE_SUB\s*\(\s*date\('now',\s*'localtime'\)\s*,\s*INTERVAL\s+(\d+)\s+MONTH\s*\)/gi, "date('now', 'localtime', '-$1 months')");
  res = res.replace(/DATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi, "date($1, '-$2 days')");
  res = res.replace(/DATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+MONTH\s*\)/gi, "date($1, '-$2 months')");
  
  // Replace YEAR(...) and MONTH(...)
  res = res.replace(/YEAR\s*\(\s*date\('now',\s*'localtime'\s*(?:,\s*'[^']+'\s*)*\)\s*\)/gi, (match) => {
    const expr = match.substring(5, match.length - 1);
    return `strftime('%Y', ${expr})`;
  });
  res = res.replace(/MONTH\s*\(\s*date\('now',\s*'localtime'\s*(?:,\s*'[^']+'\s*)*\)\s*\)/gi, (match) => {
    const expr = match.substring(6, match.length - 1);
    return `strftime('%m', ${expr})`;
  });
  res = res.replace(/YEAR\s*\(\s*date\(([^)]+)\)\s*\)/gi, "strftime('%Y', $1)");
  res = res.replace(/MONTH\s*\(\s*date\(([^)]+)\)\s*\)/gi, "strftime('%m', $1)");
  res = res.replace(/YEAR\(([^)]+)\)/gi, "strftime('%Y', $1)");
  res = res.replace(/MONTH\(([^)]+)\)/gi, "strftime('%m', $1)");

  // Translate DDL schema
  res = res.replace(/INT UNSIGNED AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  res = res.replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  res = res.replace(/INT UNSIGNED/gi, 'INTEGER');
  res = res.replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/gi, '');
  res = res.replace(/ENGINE=InnoDB/gi, '');
  res = res.replace(/DEFAULT CHARSET=utf8mb4/gi, '');
  res = res.replace(/COLLATE=utf8mb4_unicode_ci/gi, '');
  res = res.replace(/ENUM\([^)]+\)/gi, 'TEXT');
  res = res.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
  
  return res;
}

class SqlitePoolShim {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(dbPath);
    this.db.run('PRAGMA foreign_keys = ON;');
  }

  async query(sql, params = []) {
    const translatedSql = translateSql(sql);
    let cleanParams = Array.isArray(params) ? params : [params];
    
    // SQLite uses strftime/date functions which may complain if parameters are passed directly as numbers in some cases,
    // but generally SQLite handles types dynamically. Let's make sure we pass them cleanly.
    return new Promise((resolve, reject) => {
      const isSelect = /^\s*select/i.test(translatedSql);
      if (isSelect) {
        this.db.all(translatedSql, cleanParams, (err, rows) => {
          if (err) {
            console.error("SQLite query error:", err, "SQL:", translatedSql);
            return reject(err);
          }
          resolve([rows || [], []]);
        });
      } else {
        this.db.run(translatedSql, cleanParams, function(err) {
          if (err) {
            console.error("SQLite execution error:", err, "SQL:", translatedSql);
            return reject(err);
          }
          resolve([{
            insertId: this.lastID,
            affectedRows: this.changes,
          }, []]);
        });
      }
    });
  }

  async getConnection() {
    return new SqliteConnectionShim(this);
  }

  async end() {
    return new Promise((resolve) => {
      this.db.close(() => resolve());
    });
  }
}

class SqliteConnectionShim {
  constructor(poolShim) {
    this.poolShim = poolShim;
    this.inTransaction = false;
  }

  async beginTransaction() {
    this.inTransaction = true;
    await this.query('BEGIN TRANSACTION');
  }

  async query(sql, params = []) {
    return this.poolShim.query(sql, params);
  }

  async commit() {
    if (this.inTransaction) {
      await this.query('COMMIT');
      this.inTransaction = false;
    }
  }

  async rollback() {
    if (this.inTransaction) {
      await this.query('ROLLBACK');
      this.inTransaction = false;
    }
  }

  release() {
    // No-op
  }
}

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
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
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
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: buildSslConfig(),
  };
};

let pool;
const dbMode = (process.env.DB_MODE || 'AUTO').toUpperCase();

if (dbMode === 'SQLITE') {
  console.log('ℹ Using SQLite by explicit DB_MODE configuration');
  const dbPath = path.join(__dirname, 'database.db');
  pool = new SqlitePoolShim(dbPath);
} else {
  try {
    const options = buildPoolOptions();
    console.log(`Checking connection to MySQL server at ${options.host}:${options.port}...`);
    const tempPool = mysql.createPool(options);
    
    // Test connection with a query and timeout
    const testPromise = tempPool.query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 3000)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    console.log('✓ Successfully connected to MySQL database');
    pool = tempPool;
  } catch (err) {
    console.warn('⚠ MySQL connection failed or timed out:', err.message || err);
    console.log('ℹ Falling back to local SQLite database...');
    const dbPath = path.join(__dirname, 'database.db');
    pool = new SqlitePoolShim(dbPath);
  }
}

export default pool;
