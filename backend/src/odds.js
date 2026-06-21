// Stub de proveedor de cuotas en vivo.
// Hoy devuelve vacío. Cuando quieras escanear surebets automáticamente,
// configura ODDS_API_PROVIDER + ODDS_API_KEY en .env e implementa fetchLiveOdds().
//
// Ejemplo de integración con The Odds API (https://the-odds-api.com):
//
//   const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/` +
//     `?apiKey=${process.env.ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
//   const res = await fetch(url);
//   const events = await res.json();
//   ...recorrer eventos, buscar la mejor cuota por resultado en cada casa,
//      y aplicar calcArbitrage() para detectar surebets.

export const oddsConfigured = Boolean(process.env.ODDS_API_KEY);

export async function fetchLiveOdds(/* { sport, region } */) {
  if (!oddsConfigured) {
    return {
      provider: null,
      configured: false,
      message: 'Integración de cuotas en vivo no configurada. Añade ODDS_API_KEY en .env.',
      events: [],
    };
  }
  // TODO: implementar la llamada real al proveedor configurado.
  return { provider: process.env.ODDS_API_PROVIDER || 'unknown', configured: true, events: [] };
}
