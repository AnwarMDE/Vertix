// Datos de ejemplo para probar la app rápidamente.
// Uso:  npm run seed
import { db } from './db.js';
import { hashPassword } from './auth.js';
import { calcArbitrage } from './arb.js';

const email = 'demo@surebets.app';
const password = 'demo1234';

db.prepare('DELETE FROM bets WHERE user_id IN (SELECT id FROM users WHERE email = ?)').run(email);
db.prepare('DELETE FROM users WHERE email = ?').run(email);

const info = db
  .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
  .run(email, 'Usuario Demo', hashPassword(password));
const userId = info.lastInsertRowid;

const samples = [
  { event: 'Real Madrid vs Barcelona', sport: 'Fútbol', market: '1X2', legs: [['Bet365', 'Local', 2.1], ['Pinnacle', 'Empate', 3.6], ['Betfair', 'Visitante', 4.2]], stake: 200, daysAgo: 1, status: 'won' },
  { event: 'Nadal vs Alcaraz', sport: 'Tenis', market: 'Ganador', legs: [['Bet365', 'Nadal', 2.05], ['Pinnacle', 'Alcaraz', 2.1]], stake: 150, daysAgo: 2, status: 'won' },
  { event: 'Lakers vs Celtics', sport: 'Baloncesto', market: 'Ganador', legs: [['Betfair', 'Lakers', 1.95], ['Bet365', 'Celtics', 2.15]], stake: 300, daysAgo: 2, status: 'won' },
  { event: 'Verstappen vs Hamilton (H2H)', sport: 'F1', market: 'Duelo', legs: [['Pinnacle', 'Verstappen', 1.9], ['Bet365', 'Hamilton', 2.25]], stake: 120, daysAgo: 5, status: 'lost', actual: -3.5 },
  { event: 'Djokovic vs Sinner', sport: 'Tenis', market: 'Ganador', legs: [['Bet365', 'Djokovic', 2.2], ['Betfair', 'Sinner', 2.0]], stake: 180, daysAgo: 8, status: 'won' },
  { event: 'Man City vs Liverpool', sport: 'Fútbol', market: '1X2', legs: [['Pinnacle', 'Local', 2.3], ['Bet365', 'Empate', 3.7], ['Betfair', 'Visitante', 3.5]], stake: 250, daysAgo: 0, status: 'pending' },
  { event: 'Atlético vs Sevilla', sport: 'Fútbol', market: '1X2', legs: [['Bet365', 'Local', 2.0], ['Betfair', 'Empate', 3.9], ['Pinnacle', 'Visitante', 4.5]], stake: 220, daysAgo: 0, status: 'pending' },
];

const insert = db.prepare(`
  INSERT INTO bets (user_id, event, sport, market, legs, total_stake, expected_profit, profit_pct, status, actual_profit, placed_at, settled_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of samples) {
  const odds = s.legs.map((l) => l[2]);
  const calc = calcArbitrage(odds, s.stake, { round: 1 });
  const legs = s.legs.map((l, i) => ({ bookmaker: l[0], outcome: l[1], odds: l[2], stake: calc.stakes[i] }));
  const placedAt = isoDaysAgo(s.daysAgo);
  const settledAt = s.status === 'pending' ? null : placedAt;
  const actual = s.actual != null ? s.actual : (s.status === 'won' ? calc.guaranteedProfit : s.status === 'void' ? 0 : null);
  insert.run(userId, s.event, s.sport, s.market, JSON.stringify(legs), calc.totalStake, calc.guaranteedProfit, calc.profitPctRealized, s.status, actual, placedAt, settledAt);
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

console.log('✅ Seed completado.');
console.log(`   Usuario:    ${email}`);
console.log(`   Contraseña: ${password}`);
console.log(`   Apuestas creadas: ${samples.length}`);
