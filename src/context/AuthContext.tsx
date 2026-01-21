import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase.ts';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<{ error?: any; data?: any }>;
  login: (email: string, password: string) => Promise<{ error?: any; data?: any }>;
  logout: () => Promise<{ error?: any; success?: boolean }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setError(error.message);
        } else {
          setUser(session?.user || null);
          setSession(session || null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        setSession(session || null);
        setLoading(false);
      });

    return () => subscription?.unsubscribe();
  }, []);

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    return { data };
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    setUser(data.user);
    setSession(data.session);

    return { data };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return { error };

    setUser(null);
    setSession(null);

    return { success: true };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
