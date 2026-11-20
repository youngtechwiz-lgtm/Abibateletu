import { createClient } from '@supabase/supabase-js';
import { DEFAULT_CMS_STATE } from '../src/data/defaultCmsState.ts';
import { fetchCmsStateFromSupabase, saveCmsStateToSupabase } from '../src/lib/supabaseSync.ts';
import type { CmsState } from '../src/types/cms.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const DESIGNATED_ADMIN = (process.env.ADMIN_EMAIL || 'eletuabibat12@gmail.com').toLowerCase();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase =
    SUPABASE_URL && SUPABASE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  if (req.method === 'GET') {
    try {
      if (supabase) {
        const liveState = await fetchCmsStateFromSupabase(supabase);
        if (liveState) {
          return res.status(200).json(liveState);
        }
      }
    } catch {
      // Fall through to default CMS state
    }
    return res.status(200).json(DEFAULT_CMS_STATE);
  }

  if (req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7).trim();

    if (supabase) {
      const { data: authData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !authData?.user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Supabase session' });
      }

      const user = authData.user;
      const isDesignated = user.email?.toLowerCase() === DESIGNATED_ADMIN;

      if (!isDesignated) {
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();

        const isAdmin = profile && (profile.role === 'admin' || profile.role === 'super_admin');
        if (!isAdmin) {
          return res.status(403).json({ error: 'Forbidden: Administrator credentials required' });
        }
      }
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const incoming = body as CmsState;
    if (supabase) {
      try {
        await saveCmsStateToSupabase(supabase, incoming);
      } catch (err) {
        console.warn('Vercel API: Supabase sync notice:', err);
      }
    }

    return res.status(200).json(incoming);
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
