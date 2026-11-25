import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fr_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('fr_token'));

  const logout = useCallback(() => {
    localStorage.removeItem('fr_token');
    setToken(null);
    setUser(null);
  }, []);

  // restore session on first load
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api('/auth/me', { token })
      .then((d) => setUser(d.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // any 401 from the API logs the user out
  useEffect(() => {
    window.addEventListener('fr:unauthorized', logout);
    return () => window.removeEventListener('fr:unauthorized', logout);
  }, [logout]);

  const persist = (data) => {
    localStorage.setItem('fr_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => persist(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register = async (form) => persist(await api('/auth/register', { method: 'POST', body: form }));

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
