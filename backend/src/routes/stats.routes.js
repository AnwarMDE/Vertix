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
  const ym = new Date().toISOString().slice(0, 7);

  const r = await query(`
    SELECT
      COUNT(*)::int                                                              AS count,
      COUNT(*) FILTER (WHERE status = 'pending')::int                           AS pending,
      COUNT(*) FILTER (WHERE status <> 'pending')::int                          AS settled,
      COUNT(*) FILTER (WHERE status = 'won')::int                               AS won,
      COALESCE(SUM(total_stake), 0)                                             AS total_staked,
      COALESCE(SUM(
        CASE
          WHEN status = 'void'    THEN 0
          WHEN status = 'pending' THEN expected_profit
          ELSE COALESCE(actual_profit, expected_profit)
        END
      ), 0)                                                                     AS total_profit,
      COALESCE(SUM(
        CASE WHEN substr(placed_at, 1, 7) = $2 THEN
          CASE
            WHEN status = 'void'    THEN 0
            WHEN status = 'pending' THEN expected_profit
            ELSE COALESCE(actual_profit, expected_profit)
          END
        ELSE 0 END
      ), 0)                                                                     AS month_profit
    FROM bets
    WHERE user_id = $1
  `, [req.user.id, ym]);

  const row = r.rows[0];
  const totalProfit = round2(Number(row.total_profit));
  const totalStaked = round2(Number(row.total_staked));
  const settled = row.settled;
  const won = row.won;

  res.json({
    count: row.count,
    pending: row.pending,
    settled,
    won,
    winRate: settled ? round2((won / settled) * 100) : 0,
    totalStaked,
    totalProfit,
    monthProfit: round2(Number(row.month_profit)),
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
