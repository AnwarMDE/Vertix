export const CURRENCY = '€';

export function money(n, { sign = false } = {}) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}${s} ${CURRENCY}`;
}

export function pct(n, { sign = false } = {}) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}${s} %`;
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const DOW_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const STATUS = {
  pending: { label: 'Pendiente', color: '#f4b740' },
  won: { label: 'Ganada', color: '#3ddc97' },
  lost: { label: 'Perdida', color: '#f76d6d' },
  void: { label: 'Anulada', color: '#98a4ba' },
};

export function effectiveProfit(b) {
  if (b.status === 'void') return 0;
  if (b.status === 'pending') return b.expected_profit;
  return b.actual_profit != null ? b.actual_profit : b.expected_profit;
}
