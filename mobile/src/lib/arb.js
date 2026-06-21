// Lógica de arbitraje (idéntica a web y backend).
export function americanToDecimal(american) {
  const a = Number(american);
  if (!a) return null;
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}

export function calcArbitrage(oddsList, totalStake = 100, opts = {}) {
  const round = Number(opts.round) || 0;
  const odds = (oddsList || []).map(Number).filter((o) => o > 1);
  if (odds.length < 2) return null;

  const implied = odds.map((o) => 1 / o);
  const sum = implied.reduce((a, b) => a + b, 0);
  const isArb = sum < 1;
  const profitPct = (1 / sum - 1) * 100;

  let stakes = implied.map((p) => (totalStake * p) / sum);
  if (round > 0) stakes = stakes.map((s) => Math.round(s / round) * round);

  const actualTotal = stakes.reduce((a, b) => a + b, 0);
  const payouts = stakes.map((s, i) => s * odds[i]);
  const worstPayout = payouts.length ? Math.min(...payouts) : 0;
  const guaranteedProfit = worstPayout - actualTotal;

  return {
    odds, implied, sum, isArb,
    arbPercent: sum * 100,
    profitPct,
    stakes: stakes.map(r2),
    payouts: payouts.map(r2),
    totalStake: r2(actualTotal),
    guaranteedProfit: r2(guaranteedProfit),
    profitPctRealized: actualTotal ? r2((guaranteedProfit / actualTotal) * 100) : 0,
  };
}

function r2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
