import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../api.js';
import BetsTable, { effectiveProfit } from '../components/BetsTable.jsx';
import { money, pnlClass, MONTHS_ES, DOW_ES, fmtDate, todayISO } from '../lib/format.js';

const BADGE_BY_PNL = { 'value-profit': 'badge--profit', 'value-loss': 'badge--loss', 'value-flat': 'badge--muted' };
import { IconChevronLeft, IconChevronRight, IconCalendar } from '../components/icons.jsx';

const pad = (n) => String(n).padStart(2, '0');

export default function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [days, setDays] = useState({});
  const [selected, setSelected] = useState(null);
  const [dayBets, setDayBets] = useState([]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const ym = `${year}-${pad(month + 1)}`;

  const loadMonth = useCallback(() => {
    api.calendar(ym).then((r) => {
      const map = {};
      r.days.forEach((d) => { map[d.date] = d; });
      setDays(map);
    });
  }, [ym]);

  useEffect(() => { loadMonth(); setSelected(null); setDayBets([]); }, [loadMonth]);

  function pickDay(dateStr) {
    setSelected(dateStr);
    api.listBets({ from: dateStr, to: dateStr }).then((r) => setDayBets(r.bets));
  }

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // lunes = 0
    const total = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [year, month]);

  const monthTotal = Object.values(days).reduce((a, d) => a + d.profit, 0);
  const monthCount = Object.values(days).reduce((a, d) => a + d.count, 0);
  const todayStr = todayISO();

  return (
    <div className="stack stack--lg">
      <div className="panel">
        <div className="panel__head">
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn--icon btn--ghost" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior"><IconChevronLeft size={16} /></button>
            <h2 style={{ minWidth: 170, textAlign: 'center' }}>{MONTHS_ES[month]} {year}</h2>
            <button className="btn btn--icon btn--ghost" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente"><IconChevronRight size={16} /></button>
            <button className="btn btn--ghost btn--sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Hoy</button>
          </div>
          <div className="row" style={{ gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div className="cell-sub">Resultado del mes</div>
              <div className={`cell-strong num ${pnlClass(monthTotal)}`} style={{ fontSize: '1.15rem' }}>{money(monthTotal, { sign: true })}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="cell-sub">Apuestas</div>
              <div className="cell-strong num" style={{ fontSize: '1.15rem' }}>{monthCount}</div>
            </div>
          </div>
        </div>
        <div className="cal-body">
          <div className="cal">
            <div className="cal__head">
              {DOW_ES.map((d) => <div className="cal__dow" key={d}>{d}</div>)}
            </div>
            <div className="cal__grid">
              {cells.map((d, i) => {
                if (d === null) return <div className="cal-cell empty" key={`e${i}`} />;
                const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
                const info = days[dateStr];
                const has = info && info.count > 0;
                const isToday = dateStr === todayStr;
                const isSel = dateStr === selected;
                if (!has) {
                  return (
                    <button className={`cal-cell cal-bare ${isToday ? 'today' : ''}`} key={dateStr} onClick={() => pickDay(dateStr)}>
                      <span className="cal-bare__num">{d}</span>
                    </button>
                  );
                }
                const profit = info.profit || 0;
                const win = profit >= -0.001;
                return (
                  <button className={`cal-cell cal-tile ${win ? 'win' : 'lose'} ${isSel ? 'sel' : ''}`} key={dateStr} onClick={() => pickDay(dateStr)}>
                    {info.pending > 0 && <span className="cal-tile__dot" title="Pendientes" />}
                    <span className="cal-tile__num">{d}</span>
                    <span className="cal-tile__amt">{Math.round(Math.abs(profit))} €</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selected && (() => {
        const daySum = dayBets.reduce((a, b) => a + effectiveProfit(b), 0);
        return (
        <div className="panel">
          <div className="panel__head">
            <h2><IconCalendar size={16} style={{ verticalAlign: '-3px', marginRight: 8 }} />{fmtDate(selected)}</h2>
            {dayBets.length > 0 && (
              <span className={`badge ${BADGE_BY_PNL[pnlClass(daySum)]}`}>
                {money(daySum, { sign: true })}
              </span>
            )}
          </div>
          <div className="panel__body--flush">
            {dayBets.length ? (
              <BetsTable bets={dayBets} compact />
            ) : (
              <div className="empty"><p>No hay apuestas registradas este día.</p></div>
            )}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
