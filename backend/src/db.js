// Capa de base de datos — PostgreSQL (Neon) vía node-postgres.
// La conexión se toma de DATABASE_URL (Render env var en producción,
// backend/.env en local). Los datos son PERMANENTES (a diferencia del
// SQLite anterior, que se borraba en cada reinicio del host gratuito).
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Falta DATABASE_URL. Defínela en Render (Environment) o en backend/.env');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Helper de consulta.
export const query = (text, params) => pool.query(text, params);

// Envoltura para capturar errores de handlers async en Express 4.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Crea el esquema si no existe (idempotente).
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bets (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event           TEXT NOT NULL,
      sport           TEXT,
      market          TEXT,
      legs            TEXT NOT NULL,                  -- JSON: [{ bookmaker, outcome, odds, stake }]
      total_stake     DOUBLE PRECISION NOT NULL,
      expected_profit DOUBLE PRECISION NOT NULL,
      profit_pct      DOUBLE PRECISION NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending',
      actual_profit   DOUBLE PRECISION,
      placed_at       TEXT NOT NULL,                  -- YYYY-MM-DD (lo usa el calendario)
      settled_at      TEXT,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_bets_user_date ON bets(user_id, placed_at);');
}

export default pool;
