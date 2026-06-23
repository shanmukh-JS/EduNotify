import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dialect = process.env.DB_DIALECT || 'sqlite';
let pool = null;
let sqliteDb = null;

// Expose connection metrics or metadata
export const getDbMeta = () => ({
  dialect,
  isConnected: dialect === 'postgres' ? !!pool : !!sqliteDb,
});

if (dialect === 'postgres') {
  const connectionString = process.env.DATABASE_URL;
  pool = new pg.Pool({
    connectionString,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
} else {
  // SQLite configuration
  const dbPath = path.resolve(__dirname, '../../database/edunotify.db');
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Could not connect to SQLite database', err);
    } else {
      console.log(`SQLite database loaded at: ${dbPath}`);
      // Enable foreign key support in SQLite
      sqliteDb.run('PRAGMA foreign_keys = ON;');
    }
  });
}

/**
 * Universal query runner supporting both PostgreSQL and SQLite.
 * Translates PG placeholder syntax ($1, $2) to SQLite syntax (?1, ?2).
 */
export const query = async (text, params = []) => {
  if (dialect === 'postgres') {
    return pool.query(text, params);
  }

  // SQLite Flow
  return new Promise((resolve, reject) => {
    // Translate PG placeholders ($1) to SQLite (?1)
    const sqliteSql = text.replace(/\$(\d+)/g, '?$1');
    const trimmedSql = text.trim().toLowerCase();
    
    // SQLite3 library divides calls between select queries (db.all) and mutations (db.run)
    const isSelect = trimmedSql.startsWith('select') || trimmedSql.includes('returning');
    
    if (isSelect) {
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) {
          console.error('SQLite query error:', err, 'SQL:', sqliteSql);
          return reject(err);
        }
        resolve({
          rows: rows || [],
          rowCount: rows ? rows.length : 0,
        });
      });
    } else {
      sqliteDb.run(sqliteSql, params, function(err) {
        if (err) {
          console.error('SQLite mutation error:', err, 'SQL:', sqliteSql);
          return reject(err);
        }
        resolve({
          rows: [],
          rowCount: this.changes,
          lastID: this.lastID,
          changes: this.changes,
        });
      });
    }
  });
};

/**
 * Initialize SQLite database by translating schema.sql statements.
 */
export const initDb = async () => {
  if (dialect === 'postgres') {
    console.log('Using PostgreSQL database. Schema migrations must be applied externally or via database CLI.');
    return;
  }

  console.log('Initializing SQLite database schema from PostgreSQL schema.sql...');
  
  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  let schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Translate PostgreSQL schema syntax to SQLite compatible syntax
  schemaSql = schemaSql
    .replace(/CREATE EXTENSION[\s\S]*?;/g, '') // Remove postgres extension creation
    .replace(/UUID PRIMARY KEY DEFAULT uuid_generate_v4\(\)/g, 'TEXT PRIMARY KEY')
    .replace(/UUID REFERENCES/g, 'TEXT REFERENCES')
    .replace(/UUID/g, 'TEXT')
    // Handle array defaults first, before types are stripped
    .replace(/ARRAY\[.*?\]::VARCHAR\(\d+\)\[\]/g, "'[\"SMS\", \"EMAIL\"]'")
    .replace(/ARRAY\[.*?\]::TEXT\[\]/g, "'[]'")
    // Convert column types
    .replace(/VARCHAR\(\d+\)\[\]/g, 'TEXT') // Convert arrays to TEXT
    .replace(/VARCHAR\(\d+\)/g, 'TEXT')
    .replace(/TIMESTAMP WITH TIME ZONE/g, 'DATETIME')
    .replace(/DATE NOT NULL/g, 'TEXT NOT NULL') // SQLite uses TEXT for dates
    .replace(/JSONB/g, 'TEXT')
    .replace(/::[a-zA-Z0-9_()[\]]+/g, '') // Strip out PostgreSQL type casting (e.g. ::JSONB, ::TEXT)
    .replace(/TIME NOT NULL DEFAULT '.*?'/g, 'TEXT NOT NULL DEFAULT "12:00:00"')
    .replace(/ON DELETE SET NULL/g, 'ON DELETE SET NULL')
    .replace(/ON DELETE CASCADE/g, 'ON DELETE CASCADE');

  // Split schema SQL by statements
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await new Promise((resolve, reject) => {
        sqliteDb.run(statement, (err) => {
          if (err) {
            // Ignore minor errors like "index already exists" during startup
            if (err.message.includes('already exists')) {
              return resolve();
            }
            return reject(err);
          }
          resolve();
        });
      });
    } catch (err) {
      console.error('Failed to run schema statement:', statement, err);
      throw err;
    }
  }
  console.log('SQLite database schema initialized successfully.');
};
