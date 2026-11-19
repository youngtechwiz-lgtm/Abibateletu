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

  // 1. Verify Authentication
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

  // 2. Validate Cloudinary Server Configuration
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({
      error: 'Cloudinary server credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured in environment variables.',
      configured: false,
    });
  }

  // 3. Parse Body & Generate Signature
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const folder =
    typeof body?.folder === 'string' && body.folder.trim()
      ? body.folder.trim()
      : 'abibat/portfolio';

  const tags = Array.isArray(body?.tags)
    ? body.tags.join(',')
    : typeof body?.tags === 'string'
      ? body.tags
      : '';

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = { folder, timestamp };
  if (tags) paramsToSign.tags = tags;

  const sortedQuery = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(`${sortedQuery}${apiSecret}`)
    .digest('hex');

  return res.status(200).json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    folder,
    tags,
  });
}
