import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../auth.js';
import { calcArbitrage } from '../arb.js';

const router = Router();
router.use(authRequired);

function parseBet(row) {
  return { ...row, legs: safeParse(row.legs) };
}
function safeParse(s) {
  try { return JSON.parse(s); } catch { return []; }
}

// Listado con filtros opcionales (?from=YYYY-MM-DD&to=...&status=...)
router.get('/', (req, res) => {
  const { from, to, status } = req.query;
  let sql = 'SELECT * FROM bets WHERE user_id = ?';
  const params = [req.user.id];
  if (from) { sql += ' AND placed_at >= ?'; params.push(String(from)); }
  if (to) { sql += ' AND placed_at <= ?'; params.push(String(to)); }
  if (status) { sql += ' AND status = ?'; params.push(String(status)); }
  sql += ' ORDER BY placed_at DESC, id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ bets: rows.map(parseBet) });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bets WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Apuesta no encontrada' });
  res.json({ bet: parseBet(row) });
});

router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.event) return res.status(400).json({ error: 'El evento es obligatorio' });
  const legs = Array.isArray(b.legs) ? b.legs : [];
  if (legs.length < 2) return res.status(400).json({ error: 'Se requieren al menos 2 resultados' });

  // Recalcular en el servidor para mantener la integridad de los números
  const totalStake = Number(b.total_stake) || legs.reduce((a, l) => a + (Number(l.stake) || 0), 0);
  const calc = calcArbitrage(legs.map((l) => Number(l.odds)), totalStake);
  const expected = b.expected_profit != null ? Number(b.expected_profit) : (calc ? calc.guaranteedProfit : 0);
  const profitPct = b.profit_pct != null ? Number(b.profit_pct) : (calc ? calc.profitPctRealized : 0);
  const placedAt = b.placed_at || new Date().toISOString().slice(0, 10);

  const info = db.prepare(`
    INSERT INTO bets
      (user_id, event, sport, market, legs, total_stake, expected_profit, profit_pct, status, actual_profit, placed_at, settled_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    String(b.event),
    b.sport ? String(b.sport) : null,
    b.market ? String(b.market) : null,
    JSON.stringify(legs),
    totalStake,
    expected,
    profitPct,
    b.status ? String(b.status) : 'pending',
    b.actual_profit != null ? Number(b.actual_profit) : null,
    String(placedAt),
    b.settled_at ? String(b.settled_at) : null,
    b.notes ? String(b.notes) : null
  );

  const row = db.prepare('SELECT * FROM bets WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ bet: parseBet(row) });
});

router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bets WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Apuesta no encontrada' });

  const b = req.body || {};
  const fields = {};
  const allowed = ['event', 'sport', 'market', 'status', 'actual_profit', 'placed_at', 'settled_at', 'notes', 'total_stake', 'expected_profit', 'profit_pct'];
  for (const k of allowed) {
    if (k in b && b[k] !== undefined) {
      fields[k] = b[k] === null ? null : (['actual_profit', 'total_stake', 'expected_profit', 'profit_pct'].includes(k) ? Number(b[k]) : String(b[k]));
    }
  }
  if ('legs' in b && Array.isArray(b.legs)) fields.legs = JSON.stringify(b.legs);

  // Al liquidar, fija settled_at automáticamente
  if (fields.status && fields.status !== 'pending' && !fields.settled_at && !row.settled_at) {
    fields.settled_at = new Date().toISOString().slice(0, 10);
  }
  // Si se marca ganada sin beneficio real, usa el esperado
  if (fields.status === 'won' && fields.actual_profit == null && row.actual_profit == null) {
    fields.actual_profit = row.expected_profit;
  }
  if (fields.status === 'void' && fields.actual_profit == null) fields.actual_profit = 0;

  const keys = Object.keys(fields);
  if (keys.length === 0) return res.json({ bet: parseBet(row) });

  const setSql = keys.map((k) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE bets SET ${setSql} WHERE id = ?`).run(...keys.map((k) => fields[k]), row.id);

  const updated = db.prepare('SELECT * FROM bets WHERE id = ?').get(row.id);
  res.json({ bet: parseBet(updated) });
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM bets WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Apuesta no encontrada' });
  res.json({ ok: true });
});

export default router;
