import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function resolveDbPath(env = process.env) {
  const configured = (env.DATABASE_PATH || '').trim();
  if (!configured) {
    return path.resolve(serverRoot, 'data', 'lineguard.db');
  }
  if (configured === ':memory:') return ':memory:';
  return path.resolve(serverRoot, configured);
}

export function openDatabase(dbPath = resolveDbPath()) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL');
  }

  const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.exec(schema);
  return db;
}
