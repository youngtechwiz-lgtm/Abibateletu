import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CMS_STATE } from '../data/defaultCmsState.ts';
import { isSupabaseEnabled, supabase, verifyUserIsAdmin } from '../lib/supabase.ts';
import {
  deleteMediaAssetFromSupabase,
  fetchCmsStateFromSupabase,
  saveCmsStateToSupabase,
} from '../lib/supabaseSync.ts';
import { getAssetReferences } from '../lib/assetReferences.ts';
import type { AssetReference, CmsState, ContactInquiry, MediaAsset } from '../types/cms.ts';

interface ConfigStatus {
  supabaseConfigured: boolean;
  cloudinaryConfigured: boolean;
  cloudinaryCloudName: string;
}

interface CmsContextValue {
  state: CmsState;
  loading: boolean;
  saving: boolean;
  configStatus: ConfigStatus;
  isAuthenticated: boolean;
  authLoading: boolean;
  adminToken: string | null;
  adminEmail: string | null;
  getAssetById: (assetId: string) => MediaAsset | undefined;
  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  updateState: (updater: (prev: CmsState) => CmsState) => Promise<void>;
  deleteAsset: (
    assetId: string,
    force?: boolean
  ) => Promise<{ deleted: boolean; references?: AssetReference[]; error?: string }>;
  submitInquiry: (
    payload: Omit<ContactInquiry, 'id' | 'status' | 'createdAt'> & {
      honeypot?: string;
      formStartedAt?: number;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  updateInquiryStatus: (id: string, status: ContactInquiry['status']) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  refreshState: () => Promise<void>;
}

const CmsContext = createContext<CmsContextValue | null>(null);

/**
 * Returns the currently active, cryptographically valid Supabase Auth JWT access token.
 */
async function getValidAuthToken(): Promise<string | null> {
  if (isSupabaseEnabled && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CmsState>(DEFAULT_CMS_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const initialCloudName =
    (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined)?.trim() || '';

  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    supabaseConfigured: isSupabaseEnabled,
    cloudinaryConfigured: Boolean(initialCloudName),
    cloudinaryCloudName: initialCloudName,
  });

  const refreshState = useCallback(async () => {
    try {
      const token = await getValidAuthToken();

      // Attempt to load live state from Supabase PostgreSQL if enabled
      let supabaseLoadedState: CmsState | null = null;
      if (isSupabaseEnabled && supabase) {
        try {
          supabaseLoadedState = await fetchCmsStateFromSupabase(supabase);
        } catch (err) {
          console.warn('Supabase fetch bypassed:', err);
        }
      }

      const [contentRes, configRes] = await Promise.all([
        fetch('/api/content', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => null),
        fetch('/api/config/status').catch(() => null),
      ]);

      if (supabaseLoadedState) {
        setState(supabaseLoadedState);
      } else if (contentRes && contentRes.ok) {
        const data = (await contentRes.json()) as CmsState;
        setState(data);
      }

      if (configRes && configRes.ok) {
        const cfg = (await configRes.json()) as ConfigStatus;
        setConfigStatus((prev) => ({
          supabaseConfigured: typeof cfg.supabaseConfigured === 'boolean' ? cfg.supabaseConfigured : prev.supabaseConfigured,
          cloudinaryConfigured: typeof cfg.cloudinaryConfigured === 'boolean' ? cfg.cloudinaryConfigured : prev.cloudinaryConfigured,
          cloudinaryCloudName: cfg.cloudinaryCloudName || prev.cloudinaryCloudName,
        }));
      }
    } catch {
      // Gracefully retain current / default state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();

    let isMounted = true;

    // Check existing Supabase session and verify authorization role on mount
    async function checkAuthSession() {
      if (!isSupabaseEnabled || !supabase) {
        if (isMounted) {
          setAdminToken(null);
          setAdminEmail(null);
          setIsAdmin(false);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !sessionData?.session?.user) {
          if (isMounted) {
            setAdminToken(null);
            setAdminEmail(null);
            setIsAdmin(false);
            setAuthLoading(false);
          }
          return;
        }

        const user = sessionData.session.user;
        const authCheck = await verifyUserIsAdmin(user);

        if (isMounted) {
          if (authCheck.isAdmin) {
            setAdminToken(sessionData.session.access_token);
            setAdminEmail(user.email ?? null);
            setIsAdmin(true);
          } else {
            // Signed in on Supabase, but lacks admin authorization
            await supabase.auth.signOut().catch(() => null);
            setAdminToken(null);
            setAdminEmail(null);
            setIsAdmin(false);
          }
          setAuthLoading(false);
        }
      } catch (err) {
        console.warn('[Auth] Session check failed:', err);
        if (isMounted) {
          setAdminToken(null);
          setAdminEmail(null);
          setIsAdmin(false);
          setAuthLoading(false);
        }
      }
    }

    checkAuthSession();

    // Listen to Supabase auth events (automatic session refresh, signout, token update)
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseEnabled && supabase) {
      const client = supabase;
      const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setAdminToken(null);
          setAdminEmail(null);
          setIsAdmin(false);
          setAuthLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          const user = session.user;
          const authCheck = await verifyUserIsAdmin(user);
          if (authCheck.isAdmin) {
            setAdminToken(session.access_token);
            setAdminEmail(user.email ?? null);
            setIsAdmin(true);
          } else {
            await client.auth.signOut().catch(() => null);
            setAdminToken(null);
            setAdminEmail(null);
            setIsAdmin(false);
          }
          setAuthLoading(false);
        }
      });
      authSubscription = listener.subscription;
    }

    // Real-time sync across browser tabs via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('abibat_cms_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CMS_UPDATED' && event.data.state) {
          setState(event.data.state as CmsState);
        }
      };
    }

    // Real-time postgres changes via Supabase Realtime if configured
    let supabaseSubscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseEnabled && supabase) {
      try {
        const sub = supabase
          .channel('abibat_public_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'contact_inquiries' },
            () => {
              refreshState();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'media_assets' },
            () => {
              refreshState();
            }
          )
          .subscribe();
        supabaseSubscription = sub;
      } catch {
        // Realtime channels optional
      }
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      channel?.close();
      supabaseSubscription?.unsubscribe();
    };
  }, [refreshState]);

  const loginAdmin = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      if (!isSupabaseEnabled || !supabase) {
        return {
          ok: false,
          error: 'Supabase authentication is not configured. Please check your Supabase environment variables in .env.',
        };
      }

      try {
        // Supabase is the single, authoritative authentication provider
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error || !data.session?.user) {
          return {
            ok: false,
            error: error?.message || 'Invalid administrator login credentials.',
          };
        }

        const user = data.session.user;
        const authCheck = await verifyUserIsAdmin(user);

        if (!authCheck.isAdmin) {
          await supabase.auth.signOut().catch(() => null);
          setAdminToken(null);
          setAdminEmail(null);
          setIsAdmin(false);
          return {
            ok: false,
            error: authCheck.reason || 'Access denied: You do not have administrator permissions.',
          };
        }

        setAdminToken(data.session.access_token);
        setAdminEmail(user.email ?? email.trim());
        setIsAdmin(true);
        await refreshState();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err as Error).message || 'Authentication failed.' };
      }
    },
    [refreshState]
  );

  const logoutAdmin = useCallback(async () => {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut().catch(() => null);
    }
    setAdminToken(null);
    setAdminEmail(null);
    setIsAdmin(false);
    await refreshState();
  }, [refreshState]);

  const updateState = useCallback(
    async (updater: (prev: CmsState) => CmsState) => {
      let nextSnapshot: CmsState | null = null;
      setState((prev) => {
        nextSnapshot = updater(prev);
        return nextSnapshot;
      });

      if (!nextSnapshot) return;
      setSaving(true);
      try {
        const token = await getValidAuthToken();

        // Synchronize with Express server store
        const serverSyncPromise = fetch('/api/content', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(nextSnapshot),
        }).catch(() => null);

        // Synchronize with Supabase PostgreSQL if enabled
        let supabaseSyncPromise = Promise.resolve();
        if (isSupabaseEnabled && supabase) {
          supabaseSyncPromise = saveCmsStateToSupabase(supabase, nextSnapshot).catch((err) => {
            console.warn('Supabase background save notice:', err);
          });
        }

        const [serverRes] = await Promise.all([serverSyncPromise, supabaseSyncPromise]);

        if (serverRes && serverRes.ok) {
          const saved = (await serverRes.json()) as CmsState;
          setState(saved);
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('abibat_cms_sync');
            channel.postMessage({ type: 'CMS_UPDATED', state: saved });
            channel.close();
          }
        }
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const deleteAsset = useCallback(
    async (
      assetId: string,
      force = false
    ): Promise<{ deleted: boolean; references?: AssetReference[]; error?: string }> => {
      const refs = getAssetReferences(state, assetId);
      if (refs.length > 0 && !force) {
        return {
          deleted: false,
          references: refs,
          error: 'This image is currently assigned to one or more pages.',
        };
      }

      const token = await getValidAuthToken();
      const res = await fetch('/api/cloudinary/destroy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assetId, force }),
      });

      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        return {
          deleted: false,
          references: body.references || refs,
          error: body.error || 'Asset is referenced across pages.',
        };
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { deleted: false, error: body.error || 'Failed to delete asset' };
      }

      // Delete from Supabase media_assets table if configured
      if (isSupabaseEnabled && supabase) {
        await deleteMediaAssetFromSupabase(supabase, assetId);
      }

      const data = await res.json();
      if (data.state) {
        setState(data.state as CmsState);
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('abibat_cms_sync');
          channel.postMessage({ type: 'CMS_UPDATED', state: data.state });
          channel.close();
        }
      }
      return { deleted: true };
    },
    [state]
  );

  const submitInquiry = useCallback(
    async (
      payload: Omit<ContactInquiry, 'id' | 'status' | 'createdAt'> & {
        honeypot?: string;
        formStartedAt?: number;
      }
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { ok: false, error: err.error || 'Unable to submit inquiry' };
        }

        const data = await res.json().catch(() => ({}));

        // Insert into Supabase if enabled
        if (isSupabaseEnabled && supabase) {
          try {
            await supabase.from('contact_inquiries').insert({
              id: data?.inquiry?.id || `inq-${crypto.randomUUID().slice(0, 8)}`,
              name: payload.name.trim(),
              email: payload.email.trim(),
              organization: payload.organization.trim(),
              inquiry_type: payload.inquiryType,
              location: payload.location.trim(),
              dates: payload.dates.trim(),
              message: payload.message.trim(),
              status: 'new',
            });
          } catch {
            // Local backend already stored inquiry
          }
        }

        // Immediately reflect the new inquiry in state so the admin dashboard updates
        if (data?.inquiry) {
          setState((prev) => ({
            ...prev,
            inquiries: [data.inquiry, ...prev.inquiries],
          }));
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('abibat_cms_sync');
            channel.postMessage({
              type: 'CMS_UPDATED',
              state: { ...state, inquiries: [data.inquiry, ...state.inquiries] },
            });
            channel.close();
          }
        }

        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    },
    [state]
  );

  const updateInquiryStatus = useCallback(
    async (id: string, status: ContactInquiry['status']) => {
      const token = await getValidAuthToken();
      await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      if (isSupabaseEnabled && supabase) {
        try {
          await supabase.from('contact_inquiries').update({ status }).eq('id', id);
        } catch {
          // Local server state already updated
        }
      }

      setState((prev) => ({
        ...prev,
        inquiries: prev.inquiries.map((inq) => (inq.id === id ? { ...inq, status } : inq)),
      }));
    },
    []
  );

  const deleteInquiry = useCallback(async (id: string) => {
    const token = await getValidAuthToken();
    await fetch(`/api/inquiries/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('contact_inquiries').delete().eq('id', id);
      } catch {
        // Local server state already updated
      }
    }

    setState((prev) => ({
      ...prev,
      inquiries: prev.inquiries.filter((inq) => inq.id !== id),
    }));
  }, []);

  const assetMap = useMemo(() => {
    const map = new Map<string, MediaAsset>();
    for (const a of state.mediaAssets) {
      map.set(a.id, a);
    }
    return map;
  }, [state.mediaAssets]);

  const getAssetById = useCallback(
    (assetId: string) => assetMap.get(assetId),
    [assetMap]
  );

  return (
    <CmsContext.Provider
      value={{
        state,
        loading,
        saving,
        configStatus,
        isAuthenticated: Boolean(adminToken && isAdmin),
        authLoading,
        adminToken,
        adminEmail,
        getAssetById,
        loginAdmin,
        logoutAdmin,
        updateState,
        deleteAsset,
        submitInquiry,
        updateInquiryStatus,
        deleteInquiry,
        refreshState,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCms must be used within CmsProvider');
  }
  return ctx;
}
