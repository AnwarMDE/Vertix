import { Router } from 'express';
import { query, wrap } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();
router.use(authRequired);

// Beneficio "efectivo" de una apuesta para estadísticas/calendario:
//  - void      => 0 (stake devuelto)
//  - pending   => beneficio esperado (proyección)
//  - won/lost  => beneficio real si existe, si no el esperado
function effectiveProfit(b) {
  if (b.status === 'void') return 0;
  if (b.status === 'pending') return b.expected_profit;
  return b.actual_profit != null ? b.actual_profit : b.expected_profit;
}

router.get('/summary', wrap(async (req, res) => {
  const r = await query('SELECT * FROM bets WHERE user_id = $1', [req.user.id]);
  const rows = r.rows;
  const ym = new Date().toISOString().slice(0, 7);

  let totalProfit = 0, monthProfit = 0, totalStaked = 0, pending = 0, settled = 0, won = 0;
  for (const b of rows) {
    const p = effectiveProfit(b);
    totalProfit += p;
    totalStaked += b.total_stake;
    if ((b.placed_at || '').slice(0, 7) === ym) monthProfit += p;
    if (b.status === 'pending') pending += 1; else settled += 1;
    if (b.status === 'won') won += 1;
  }

  res.json({
    count: rows.length,
    pending,
    settled,
    won,
    winRate: settled ? round2((won / settled) * 100) : 0,
    totalStaked: round2(totalStaked),
    totalProfit: round2(totalProfit),
    monthProfit: round2(monthProfit),
    roi: totalStaked ? round2((totalProfit / totalStaked) * 100) : 0,
  });
}));

// Agregado por día para un mes (?month=YYYY-MM)
router.get('/calendar', wrap(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  const r = await query('SELECT * FROM bets WHERE user_id = $1 AND substr(placed_at, 1, 7) = $2', [req.user.id, month]);

  const days = {};
  for (const b of r.rows) {
    const d = b.placed_at;
    if (!days[d]) days[d] = { date: d, profit: 0, stake: 0, count: 0, pending: 0 };
    days[d].profit += effectiveProfit(b);
    days[d].stake += b.total_stake;
    days[d].count += 1;
    if (b.status === 'pending') days[d].pending += 1;
  }
  for (const d of Object.values(days)) {
    d.profit = round2(d.profit);
    d.stake = round2(d.stake);
  }
  res.json({ month, days: Object.values(days).sort((a, b) => (a.date < b.date ? -1 : 1)) });
}));

// Agregado por mes para un año (?year=YYYY)
router.get('/monthly', wrap(async (req, res) => {
  const year = String(req.query.year || new Date().getFullYear());
  const r = await query('SELECT * FROM bets WHERE user_id = $1 AND substr(placed_at, 1, 4) = $2', [req.user.id, year]);

  const months = {};
  for (const b of r.rows) {
    const m = (b.placed_at || '').slice(0, 7);
    if (!months[m]) months[m] = { month: m, profit: 0, stake: 0, count: 0 };
    months[m].profit += effectiveProfit(b);
    months[m].stake += b.total_stake;
    months[m].count += 1;
  }
  for (const m of Object.values(months)) {
    m.profit = round2(m.profit);
    m.stake = round2(m.stake);
  }
  res.json({ year, months: Object.values(months).sort((a, b) => (a.month < b.month ? -1 : 1)) });
}));

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export default router;
