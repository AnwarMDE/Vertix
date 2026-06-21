// Lógica de arbitraje deportivo (surebets).
// Trabaja siempre con cuotas decimales internamente.

export function americanToDecimal(american) {
  const a = Number(american);
  if (!a) return null;
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}

export function decimalToAmerican(decimal) {
  const d = Number(decimal);
  if (!d || d <= 1) return null;
  return d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
}

export function fractionalToDecimal(num, den) {
  return 1 + Number(num) / Number(den);
}

/**
 * Calcula el reparto de stakes para un arbitraje de N resultados.
 * @param {number[]} oddsList  cuotas decimales (una por resultado)
 * @param {number}   totalStake importe total a repartir
 * @param {object}   opts { round: redondeo de stakes (0 = sin redondeo) }
 * @returns objeto con análisis o null si hay menos de 2 cuotas válidas
 */
export function calcArbitrage(oddsList, totalStake = 100, opts = {}) {
  const round = Number(opts.round) || 0;
  const odds = (oddsList || []).map(Number).filter((o) => o > 1);
  if (odds.length < 2) return null;

  const implied = odds.map((o) => 1 / o);
  const sum = implied.reduce((a, b) => a + b, 0); // suma de probabilidades implícitas
  const isArb = sum < 1;
  const profitPct = (1 / sum - 1) * 100; // % de beneficio teórico

  // Reparto ideal para payout idéntico en todos los resultados
  let stakes = implied.map((p) => (totalStake * p) / sum);
  if (round > 0) stakes = stakes.map((s) => Math.round(s / round) * round);

  const actualTotal = stakes.reduce((a, b) => a + b, 0);
  const payouts = stakes.map((s, i) => s * odds[i]);
  const worstPayout = payouts.length ? Math.min(...payouts) : 0;
  const guaranteedProfit = worstPayout - actualTotal; // peor caso => beneficio garantizado

  return {
    odds,
    implied,
    sum,
    isArb,
    arbPercent: sum * 100,
    profitPct,
    stakes: stakes.map((s) => round2(s)),
    payouts: payouts.map((p) => round2(p)),
    totalStake: round2(actualTotal),
    worstPayout: round2(worstPayout),
    guaranteedProfit: round2(guaranteedProfit),
    profitPctRealized: actualTotal ? round2((guaranteedProfit / actualTotal) * 100) : 0,
  };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
