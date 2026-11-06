import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (b) => setUser((await api.login(b)).user), []);
  const register = useCallback(async (b) => setUser((await api.register(b)).user), []);
  const logout = useCallback(async () => { await api.logout().catch(() => {}); setUser(null); }, []);
  const update = useCallback(async (b) => setUser((await api.updateMe(b)).user), []);

  return <Ctx.Provider value={{ user, loading, login, register, logout, update }}>{children}</Ctx.Provider>;
}
