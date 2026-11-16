import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { api } from '../lib/supabase';
import {
  mergeSiteAssets,
  SITE_ASSET_DEFAULTS,
  type SiteAssetKey,
  type SiteAssetsMap,
} from '../lib/siteAssets';

interface SiteAssetsCtx {
  assets: SiteAssetsMap;
  loading: boolean;
  refresh: () => Promise<void>;
  setAsset: (key: SiteAssetKey, imageUrl: string) => Promise<void>;
  resetAsset: (key: SiteAssetKey) => Promise<void>;
  get: (key: SiteAssetKey) => string;
}

const Ctx = createContext<SiteAssetsCtx | null>(null);

export function SiteAssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<SiteAssetsMap>(SITE_ASSET_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await api.getSiteAssets();
      setAssets(mergeSiteAssets(next));
    } catch {
      setAssets(SITE_ASSET_DEFAULTS);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setAsset = useCallback(async (key: SiteAssetKey, imageUrl: string) => {
    const next = await api.updateSiteAsset(key, imageUrl);
    setAssets(mergeSiteAssets(next));
  }, []);

  const resetAsset = useCallback(async (key: SiteAssetKey) => {
    const next = await api.resetSiteAsset(key);
    setAssets(mergeSiteAssets(next));
  }, []);

  const get = useCallback((key: SiteAssetKey) => assets[key] || SITE_ASSET_DEFAULTS[key], [assets]);

  const value = useMemo(
    () => ({ assets, loading, refresh, setAsset, resetAsset, get }),
    [assets, loading, refresh, setAsset, resetAsset, get],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteAssets() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSiteAssets outside provider');
  return v;
}

/** Optional hook when provider might be missing (tests) */
export function useSiteAsset(key: SiteAssetKey): string {
  const ctx = useContext(Ctx);
  return ctx?.assets[key] || SITE_ASSET_DEFAULTS[key];
}
