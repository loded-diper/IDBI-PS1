import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Persona } from '../types';
import { login as apiLogin, logout as apiLogout } from '../api/client';

interface AuthContextType {
  persona: Persona | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (personaId: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedPersona = localStorage.getItem('persona');
    if (storedToken && storedPersona) {
      setToken(storedToken);
      setPersona(JSON.parse(storedPersona));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (personaId: string) => {
    setLoading(true);
    try {
      const response = await apiLogin(personaId);
      setToken(response.token);
      setPersona(response.persona);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setToken(null);
    setPersona(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        persona,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
