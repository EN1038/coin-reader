import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mockApi } from './mock/api';
import { realApi } from './real/api';
import type { CoinReaderApi } from './api';

const useMockFlag = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isMockMode = useMockFlag || !url || !anon;

export function getSupabase(): SupabaseClient | null {
  if (isMockMode || !url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export const api: CoinReaderApi = isMockMode ? mockApi : realApi;

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
