import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

/**
 * Disponibiliza a sessão autenticada para todas as páginas.
 * O token não é guardado em localStorage; ele permanece no cookie httpOnly.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await api('/auth/me');
      setUser(response.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ao atualizar a página, consulta o servidor para recuperar a sessão.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async credentials => {
    const response = await api('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async registration => {
    const response = await api('/auth/register', {
      method: 'POST',
      body: registration,
    });
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user, loading, login, register, logout, refresh,
  }), [user, loading, login, register, logout, refresh]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
