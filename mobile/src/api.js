import { API_URL } from './config';

let authToken = null;
export function setAuthToken(t) {
  authToken = t;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar. Revisa API_URL en src/config.js y que el backend esté arrancado.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ha ocurrido un error');
  return data;
}

export const api = {
  register: (d) => request('/api/auth/register', { method: 'POST', body: d, auth: false }),
  login: (d) => request('/api/auth/login', { method: 'POST', body: d, auth: false }),
  me: () => request('/api/auth/me'),

  listBets: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request('/api/bets' + (q ? `?${q}` : ''));
  },
  createBet: (d) => request('/api/bets', { method: 'POST', body: d }),
  updateBet: (id, d) => request(`/api/bets/${id}`, { method: 'PATCH', body: d }),
  deleteBet: (id) => request(`/api/bets/${id}`, { method: 'DELETE' }),

  summary: () => request('/api/stats/summary'),
  calendar: (month) => request(`/api/stats/calendar?month=${month}`),
  monthly: (year) => request(`/api/stats/monthly?year=${year}`),
};
