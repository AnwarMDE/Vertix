import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setUnauthorizedHandler } from '../api.js';

const AuthCtx = createContext(null);
export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    const t = localStorage.getItem('token');
    if (!t) {
      setLoading(false);
      return;
    }
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  async function login(email, password) {
    const r = await api.login({ email, password });
    localStorage.setItem('token', r.token);
    setUser(r.user);
  }

  async function register(email, password, name) {
    const r = await api.register({ email, password, name });
    localStorage.setItem('token', r.token);
    setUser(r.user);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
