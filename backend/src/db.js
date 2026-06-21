import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(__dirname, '..', 'surebets.db');

export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    name          TEXT,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    event           TEXT NOT NULL,
    sport           TEXT,
    market          TEXT,
    legs            TEXT NOT NULL,             -- JSON: [{ bookmaker, outcome, odds, stake }]
    total_stake     REAL NOT NULL,
    expected_profit REAL NOT NULL,             -- beneficio garantizado calculado
    profit_pct      REAL NOT NULL,             -- % de beneficio sobre el stake
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending | won | lost | void
    actual_profit   REAL,                      -- beneficio real una vez liquidada
    placed_at       TEXT NOT NULL,             -- YYYY-MM-DD (lo usa el calendario)
    settled_at      TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_bets_user_date ON bets(user_id, placed_at);
`);

export default db;
