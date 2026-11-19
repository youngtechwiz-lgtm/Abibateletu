import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseConfigured = Boolean(
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  );

  const cloudinaryCloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || '';
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const cloudinaryConfigured = Boolean(
    cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret
  );

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    supabaseConfigured,
    cloudinaryConfigured,
    cloudinaryCloudName,
  });
}
