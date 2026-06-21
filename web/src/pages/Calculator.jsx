import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { calcArbitrage } from '../lib/arb.js';
import { money, pct, todayISO } from '../lib/format.js';
import { IconPlus, IconTrash, IconBolt, IconCheck } from '../components/icons.jsx';

const num = (v) => parseFloat(String(v).replace(',', '.'));

const SPORTS = ['Fútbol', 'Tenis', 'Baloncesto', 'F1', 'Béisbol', 'Hockey', 'eSports', 'Otro'];

export default function Calculator() {
  const [legs, setLegs] = useState([
    { bookmaker: '', outcome: 'Local', odds: '' },
    { bookmaker: '', outcome: 'Visitante', odds: '' },
  ]);
  const [totalStake, setTotalStake] = useState('100');
  const [rounding, setRounding] = useState('0');

  const [event, setEvent] = useState('');
  const [sport, setSport] = useState('Fútbol');
  const [market, setMarket] = useState('');
  const [placedAt, setPlacedAt] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const decimals = legs.map((l) => num(l.odds));
  const allValid = decimals.length >= 2 && decimals.every((o) => o > 1);

  const calc = useMemo(
    () => (allValid ? calcArbitrage(decimals, num(totalStake) || 0, { round: Number(rounding) }) : null),
    [JSON.stringify(decimals), totalStake, rounding, allValid]
  );

  function setLeg(i, patch) {
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    setSaved(false);
  }
  function addLeg() {
    setLegs((prev) => [...prev, { bookmaker: '', outcome: `Resultado ${prev.length + 1}`, odds: '' }]);
  }
  function removeLeg(i) {
    setLegs((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function save() {
    if (!calc) return;
    setError('');
    if (!event.trim()) {
      setError('Pon un nombre de evento para guardar la apuesta');
      return;
    }
    setSaving(true);
    try {
      const betLegs = legs.map((l, i) => ({
        bookmaker: l.bookmaker || `Casa ${i + 1}`,
        outcome: l.outcome || `Resultado ${i + 1}`,
        odds: decimals[i],
        stake: calc.stakes[i],
      }));
      await api.createBet({
        event: event.trim(),
        sport,
        market: market.trim() || null,
        legs: betLegs,
        total_stake: calc.totalStake,
        expected_profit: calc.guaranteedProfit,
        profit_pct: calc.profitPctRealized,
        placed_at: placedAt,
        status: 'pending',
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isArb = calc?.isArb;

  return (
    <div className="calc-grid">
      {/* ---- Entradas ---- */}
      <div className="stack">
        <div className="panel">
          <div className="panel__head">
            <h2>Cuotas y reparto</h2>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Cuotas decimales</span>
          </div>
          <div className="panel__body stack">
            <div className="row" style={{ gap: 16 }}>
              <div className="field grow">
                <label>Inversión total</label>
                <input className="input num" inputMode="decimal" value={totalStake}
                  onChange={(e) => { setTotalStake(e.target.value); setSaved(false); }} placeholder="100" />
              </div>
              <div className="field grow">
                <label>Redondeo de stakes</label>
                <select className="select" value={rounding} onChange={(e) => setRounding(e.target.value)}>
                  <option value="0">Sin redondeo</option>
                  <option value="1">A 1</option>
                  <option value="5">A 5</option>
                  <option value="10">A 10</option>
                </select>
              </div>
            </div>

            <div>
              <div className="leg-row" style={{ marginBottom: 6 }}>
                <span className="section-title">Casa de apuestas</span>
                <span className="section-title">Resultado</span>
                <span className="section-title" style={{ textAlign: 'right' }}>Cuota</span>
                <span />
              </div>
              {legs.map((l, i) => (
                <div className="leg-row" key={i}>
                  <input className="input" placeholder={`Casa ${i + 1}`} value={l.bookmaker}
                    onChange={(e) => setLeg(i, { bookmaker: e.target.value })} />
                  <input className="input" placeholder="Resultado" value={l.outcome}
                    onChange={(e) => setLeg(i, { outcome: e.target.value })} />
                  <input className="input num" inputMode="decimal" placeholder="2.10"
                    value={l.odds} onChange={(e) => setLeg(i, { odds: e.target.value })} />
                  <button className="btn btn--icon btn--ghost" onClick={() => removeLeg(i)}
                    disabled={legs.length <= 2} title="Quitar resultado">
                    <IconTrash size={15} />
                  </button>
                </div>
              ))}
              <button className="btn btn--ghost btn--sm" style={{ marginTop: 12 }} onClick={addLeg}>
                <IconPlus size={15} /> Añadir resultado
              </button>
            </div>
          </div>
        </div>

        {/* ---- Guardar ---- */}
        <div className="panel">
          <div className="panel__head"><h2>Registrar esta apuesta</h2></div>
          <div className="panel__body stack">
            {error && <div className="alert alert--error">{error}</div>}
            {saved && (
              <div className="alert alert--ok">
                Apuesta guardada como pendiente. <Link to="/apuestas">Ver en mis apuestas →</Link>
              </div>
            )}
            <div className="field">
              <label>Evento</label>
              <input className="input" placeholder="Ej: Real Madrid vs Barcelona" value={event}
                onChange={(e) => { setEvent(e.target.value); setSaved(false); }} />
            </div>
            <div className="row" style={{ gap: 16 }}>
              <div className="field grow">
                <label>Deporte</label>
                <select className="select" value={sport} onChange={(e) => setSport(e.target.value)}>
                  {SPORTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field grow">
                <label>Mercado</label>
                <input className="input" placeholder="1X2, Ganador…" value={market}
                  onChange={(e) => setMarket(e.target.value)} />
              </div>
              <div className="field grow">
                <label>Fecha</label>
                <input className="input" type="date" value={placedAt} onChange={(e) => setPlacedAt(e.target.value)} />
              </div>
            </div>
            <button className="btn btn--primary" onClick={save} disabled={!calc || saving}>
              <IconCheck size={16} /> {saving ? 'Guardando…' : 'Guardar apuesta'}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Resultados ---- */}
      <div className="panel" style={{ position: 'sticky', top: 88 }}>
        <div className="panel__head">
          <h2>Resultado</h2>
          {calc && (
            <span className={`badge ${isArb ? 'badge--profit' : 'badge--loss'}`}>
              {isArb ? <><IconBolt size={13} /> Surebet</> : 'Sin arbitraje'}
            </span>
          )}
        </div>

        {!calc ? (
          <div className="empty">
            <IconBolt />
            <h3>Introduce las cuotas</h3>
            <p>Rellena al menos 2 resultados con su cuota para calcular el reparto y el beneficio garantizado.</p>
          </div>
        ) : (
          <>
            <div className="result-big">
              <div className={`result-big__pct ${isArb ? 'value-profit' : 'value-loss'}`}>
                {pct(calc.profitPctRealized, { sign: true })}
              </div>
              <div className="result-big__label">
                {isArb
                  ? <>Beneficio garantizado de <strong className="value-profit">{money(calc.guaranteedProfit, { sign: true })}</strong></>
                  : 'Estas cuotas no garantizan beneficio'}
              </div>
            </div>

            <div className="panel__body">
              {legs.map((l, i) => (
                <div className="payout-row" key={i}>
                  <div>
                    <div className="payout-row__book">{l.bookmaker || `Casa ${i + 1}`}</div>
                    <div className="payout-row__out">{l.outcome || `Resultado ${i + 1}`} · cuota {decimals[i]?.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="cell-strong num">{money(calc.stakes[i])}</div>
                    <div className="cell-sub num">retorno {money(calc.payouts[i])}</div>
                  </div>
                </div>
              ))}

              <div className="payout-row">
                <span className="muted">Inversión total</span>
                <span className="cell-strong num">{money(calc.totalStake)}</span>
              </div>
              <div className="payout-row">
                <span className="muted">Beneficio garantizado</span>
                <span className={`cell-strong ${isArb ? 'value-profit' : 'value-loss'}`}>{money(calc.guaranteedProfit, { sign: true })}</span>
              </div>
              <div className="payout-row">
                <span className="muted">Suma prob. implícitas</span>
                <span className="num">{calc.arbPercent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
