import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('token');
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync('token');
        if (t) {
          setAuthToken(t);
          const r = await api.me();
          setUser(r.user);
        }
      } catch {
        await SecureStore.deleteItemAsync('token');
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const r = await api.login({ email, password });
    await SecureStore.setItemAsync('token', r.token);
    setAuthToken(r.token);
    setUser(r.user);
  };

  const register = async (email, password, name) => {
    const r = await api.register({ email, password, name });
    await SecureStore.setItemAsync('token', r.token);
    setAuthToken(r.token);
    setUser(r.user);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
