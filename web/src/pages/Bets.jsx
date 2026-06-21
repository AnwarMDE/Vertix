import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import BetsTable from '../components/BetsTable.jsx';
import { IconInbox, IconPlus } from '../components/icons.jsx';

const FILTERS = [
  { key: '', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'won', label: 'Ganadas' },
  { key: 'lost', label: 'Perdidas' },
  { key: 'void', label: 'Anuladas' },
];

export default function Bets() {
  const [filter, setFilter] = useState('');
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.listBets(filter ? { status: filter } : {})
      .then((r) => setBets(r.bets))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function mark(bet, status) {
    const patch = { status };
    if (status === 'lost') {
      const v = window.prompt('Resultado real de esta apuesta en € (usa un número negativo si perdiste dinero):', '0');
      if (v === null) return;
      patch.actual_profit = parseFloat(String(v).replace(',', '.')) || 0;
    }
    await api.updateBet(bet.id, patch);
    load();
  }

  async function remove(bet) {
    if (!window.confirm(`¿Eliminar la apuesta "${bet.event}"?`)) return;
    await api.deleteBet(bet.id);
    load();
  }

  return (
    <div className="stack stack--lg">
      <div className="row row--between row--wrap" style={{ gap: 12 }}>
        <div className="segmented">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <Link to="/calculadora" className="btn btn--primary"><IconPlus size={16} /> Nueva surebet</Link>
      </div>

      <div className="panel">
        <div className="panel__body--flush">
          {loading ? (
            <div className="empty"><p>Cargando…</p></div>
          ) : bets.length ? (
            <BetsTable bets={bets} onMark={mark} onDelete={remove} />
          ) : (
            <div className="empty">
              <IconInbox />
              <h3>No hay apuestas {filter && 'con este filtro'}</h3>
              <p>Cuando guardes una surebet desde la calculadora aparecerá aquí para que la liquides.</p>
              <Link to="/calculadora" className="btn btn--primary" style={{ marginTop: 16 }}>Crear una apuesta</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
