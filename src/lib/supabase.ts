import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null =
  isSupabaseEnabled && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    : null;

/**
 * Checks whether an authenticated Supabase user has admin privileges.
 * First queries public.admin_profiles table.
 * If the table has not yet been created in Supabase, checks against designated admin email.
 */
export async function verifyUserIsAdmin(user: User): Promise<{ isAdmin: boolean; reason?: string }> {
  if (!supabase || !user) {
    return { isAdmin: false, reason: 'Supabase client not initialized or no user provided' };
  }

  try {
    const isDesignatedAdmin = user.email?.toLowerCase() === 'eletuabibat12@gmail.com';
    if (isDesignatedAdmin) {
      return { isAdmin: true };
    }

    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      const isRoleAdmin = data.role === 'admin' || data.role === 'super_admin';
      return {
        isAdmin: isRoleAdmin,
        reason: isRoleAdmin
          ? undefined
          : 'Your account does not have administrator privileges in admin_profiles.',
      };
    }

    return {
      isAdmin: false,
      reason: error ? `Authorization check error: ${(error as { message?: string })?.message || error}` : 'No administrator profile found for this account.',
    };
  } catch (err) {
    return { isAdmin: false, reason: (err as Error).message };
  }
}
