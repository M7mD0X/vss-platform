import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, type AuthUser } from '../lib/auth';

interface AuthContextValue { user: AuthUser | null; loading: boolean; refresh: () => Promise<void>; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => { setUser(await getCurrentUser()); };
  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => { await refresh(); });
    return () => subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={{ user, loading, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
