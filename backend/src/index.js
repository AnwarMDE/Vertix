import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { initDb, pool, wrap } from './db.js';
import authRoutes from './routes/auth.routes.js';
import betRoutes from './routes/bets.routes.js';
import statsRoutes from './routes/stats.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { fetchLiveOdds } from './odds.js';

const app = express();

// CORS: allow CLIENT_ORIGIN env var in production; open in dev.
const allowedOrigin = process.env.CLIENT_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));

app.use(express.json({ limit: '50kb' }));

app.get('/api/health', wrap(async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'postgres', ts: Date.now() });
  } catch {
    res.status(503).json({ ok: false, error: 'DB unreachable' });
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/odds', wrap(async (req, res) => {
  const data = await fetchLiveOdds({ sport: req.query.sport, region: req.query.region });
  res.json(data);
}));

// Generic error handler — maps known PG codes to HTTP responses.
app.use((err, req, res, _next) => {
  if (err.code === '23505') return res.status(409).json({ error: 'Registro duplicado' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referencia inválida' });
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Vertix API (PostgreSQL) escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('❌ No se pudo inicializar la base de datos:', e.message);
    process.exit(1);
  });
