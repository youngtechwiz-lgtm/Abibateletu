// Supabase Edge Function: cloudinary-delete
// Checks references before coordinated deletion from Cloudinary + Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isDesignatedAdmin = user.email?.toLowerCase() === 'eletuabibat12@gmail.com';

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRow } = await adminClient
      .from('admin_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminRow && !isDesignatedAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { assetId, publicId, force } = await req.json();

    // Check existing references in portfolio, digitals, and heroes
    const [{ data: projects }, { data: digitals }, { data: heroes }] = await Promise.all([
      adminClient.from('portfolio_projects').select('id, title').eq('cover_asset_id', assetId),
      adminClient.from('digitals_items').select('id, title').eq('asset_id', assetId),
      adminClient.from('page_heroes').select('page_slug, slides'),
    ]);

    const heroRefs = (heroes ?? []).filter((h) =>
      JSON.stringify(h.slides ?? []).includes(assetId)
    );

    const referenceCount = (projects?.length ?? 0) + (digitals?.length ?? 0) + heroRefs.length;

    if (referenceCount > 0 && !force) {
      return new Response(
        JSON.stringify({
          error: 'Asset is currently referenced on active pages',
          references: {
            portfolioProjects: projects ?? [],
            digitalsItems: digitals ?? [],
            heroPages: heroRefs.map((h) => h.page_slug),
          },
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret && publicId) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await sha1Hex(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`);
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: formData,
      });
    }

    await adminClient.from('media_assets').delete().eq('id', assetId);

    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
