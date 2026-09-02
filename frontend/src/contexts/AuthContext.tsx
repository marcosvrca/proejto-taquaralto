import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setUnauthorizedHandler } from '../services/api';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!token && !refreshToken) {
      setUser(null);
      return;
    }

    try {
      const res = await api.get('/api/auth/me');
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const userData = localStorage.getItem('user');

      if (!token && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        if (userData) JSON.parse(userData);
        await refreshUser();
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [refreshUser]);

  const login = (token: string, userData: User, refreshToken?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setUser(userData);
  };

  const { showWarning, stayLoggedIn } = useInactivityTimeout(logout, !!user);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
      {showWarning && user && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.45)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inactivity-title"
        >
          <div className="card shadow border-0 p-4 mx-3" style={{ maxWidth: 420, borderRadius: 16 }}>
            <h2 id="inactivity-title" className="h5 fw-bold mb-2">Sessão prestes a expirar</h2>
            <p className="text-secondary mb-4">
              Você ficou inativo. Em cerca de 2 minutos a sessão será encerrada automaticamente.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-outline-secondary" onClick={logout}>
                Sair agora
              </button>
              <button type="button" className="btn btn-primary" onClick={stayLoggedIn}>
                Continuar conectado
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
