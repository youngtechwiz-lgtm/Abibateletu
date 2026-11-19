import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const DESIGNATED_ADMIN =
  (process.env.ADMIN_EMAIL || 'eletuabibat12@gmail.com').toLowerCase();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7).trim();

  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Supabase session' });
    }

    const user = authData.user;
    const isDesignated = user.email?.toLowerCase() === DESIGNATED_ADMIN;

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin =
      (profile && (profile.role === 'admin' || profile.role === 'super_admin')) ||
      isDesignated;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Administrator credentials required' });
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

  const { assetId, publicId } = body ?? {};
  if (!assetId && !publicId) {
    return res.status(400).json({ error: 'assetId or publicId is required' });
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  if (cloudName && apiKey && apiSecret && publicId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const destroyRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    if (!destroyRes.ok) {
      const err = await destroyRes.json().catch(() => ({}));
      return res.status(500).json({ error: err.error?.message || 'Failed to destroy Cloudinary image' });
    }
  }

  return res.status(200).json({ ok: true });
}
