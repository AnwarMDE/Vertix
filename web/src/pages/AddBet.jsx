import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { todayISO, money, pnlClass } from '../lib/format.js';
import { useT } from '../settings.jsx';
import { IconCheck } from '../components/icons.jsx';

const num = (v) => parseFloat(String(v).replace(',', '.'));
const STATUSES = ['pending', 'won', 'lost', 'void'];

export default function AddBet() {
  const t = useT();
  const [placedAt, setPlacedAt] = useState(todayISO());
  const [status, setStatus] = useState('pending');
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [boost, setBoost] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const s = num(stake) || 0;
  const o = num(odds) || 0;
  const b = num(boost) || 0;
  const needsOdds = status === 'pending' || status === 'won';

  // Beneficio automático según la cuota, el aumento y el estado.
  const profit = useMemo(() => {
    if (status === 'void') return 0;
    if (status === 'lost') return -s;
    if (!(s > 0) || !(o > 1)) return null; // won/pending necesitan cuota válida
    const base = s * (o - 1);
    return Math.round(base * (1 + b / 100) * 100) / 100;
  }, [status, s, o, b]);

  async function save() {
    setError('');
    if (!(s > 0)) { setError(t('add.needStake')); return; }
    if (needsOdds && !(o > 1)) { setError(t('add.needOdds')); return; }

    const p = profit == null ? 0 : profit;
    const event = o > 1 ? `${t('add.betWord')} @${o}` : t('add.betWord');
    const payload = {
      event,
      legs: o > 1 ? [{ bookmaker: '', outcome: '', odds: o, stake: s }] : [],
      total_stake: s,
      expected_profit: p,
      placed_at: placedAt,
      status,
      notes: b > 0 ? `+${b}% aumento` : null,
    };
    if (status === 'won' || status === 'lost') payload.actual_profit = p;
    if (status === 'void') payload.actual_profit = 0;

    setSaving(true);
    try {
      await api.createBet(payload);
      setSaved(true);
      setStake(''); setOdds(''); setBoost(''); setStatus('pending'); setPlacedAt(todayISO());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
      <div className="panel">
        <div className="panel__head"><h2>{t('add.title')}</h2></div>
        <div className="panel__body stack">
          {error && <div className="alert alert--error">{error}</div>}
          {saved && (
            <div className="alert alert--ok">
              {t('add.saved')} <Link to="/calendario">{t('add.seeBets')}</Link>
            </div>
          )}

          <div className="field">
            <label>{t('add.date')}</label>
            <input className="input" type="date" value={placedAt}
              onChange={(e) => { setPlacedAt(e.target.value); setSaved(false); }} />
          </div>

          <div className="field">
            <label>{t('add.status')}</label>
            <div className="segmented">
              {STATUSES.map((st) => (
                <button key={st} className={status === st ? 'active' : ''} onClick={() => { setStatus(st); setSaved(false); }}>{t(`st.${st}`)}</button>
              ))}
            </div>
          </div>

          <div className="row" style={{ gap: 16 }}>
            <div className="field grow">
              <label>{t('add.stake')}</label>
              <input className="input num" inputMode="decimal" placeholder="100" value={stake}
                onChange={(e) => { setStake(e.target.value); setSaved(false); }} />
            </div>
            <div className="field grow">
              <label>{t('add.odds')}</label>
              <input className="input num" inputMode="decimal" placeholder="2.10" value={odds}
                disabled={!needsOdds} onChange={(e) => { setOdds(e.target.value); setSaved(false); }} />
            </div>
          </div>

          {needsOdds && (
            <div className="field">
              <label>{t('add.boost')}</label>
              <input className="input num" inputMode="decimal" placeholder="0" value={boost}
                onChange={(e) => { setBoost(e.target.value); setSaved(false); }} />
              <div className="muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>{t('add.boostHint')}</div>
            </div>
          )}

          <div className="addbet-result">
            <span className="muted">{t('add.computedProfit')}</span>
            <span className={`addbet-result__val ${profit == null ? '' : pnlClass(profit)}`}>
              {profit == null ? '—' : money(profit, { sign: true })}
            </span>
          </div>

          <button className="btn btn--primary" onClick={save} disabled={saving}>
            <IconCheck size={16} /> {saving ? t('add.saving') : t('add.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
