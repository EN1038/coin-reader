import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { api, isMockMode } from '../lib/supabase';
import type { SessionUser } from '../lib/types';
import { ApiError } from '../lib/types';

interface AppCtx {
  user: SessionUser | null;
  balance: number;
  loading: boolean;
  isMock: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setBalance: (n: number) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await api.getSession();
    setUser(s);
    if (s) {
      try {
        const w = await api.myWallet();
        setBalance(w.balance);
      } catch {
        setBalance(0);
      }
    } else {
      setBalance(0);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await api.login(email, password);
    setUser(u);
    const w = await api.myWallet();
    setBalance(w.balance);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const u = await api.signup(email, password, name);
    setUser(u);
    const w = await api.myWallet();
    setBalance(w.balance);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setBalance(0);
  }, []);

  const value = useMemo(
    () => ({
      user, balance, loading, isMock: isMockMode, refresh, login, signup, logout, setBalance,
    }),
    [user, balance, loading, refresh, login, signup, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}

export function errMessage(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'INSUFFICIENT_COINS': return 'เหรียญไม่พอ';
      case 'PRICE_CHANGED': return 'ราคาเปลี่ยนแล้ว กรุณาลองใหม่';
      case 'UNAUTHORIZED': return e.message || 'กรุณาเข้าสู่ระบบ';
      case 'IDEMPOTENCY_CONFLICT': return 'คำขอซ้ำกับแพ็กอื่น';
      default: return e.message || e.code;
    }
  }
  if (e instanceof Error) return e.message;
  return 'เกิดข้อผิดพลาด';
}
