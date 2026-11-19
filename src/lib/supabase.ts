import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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

    // If table doesn't exist yet in Supabase (PGRST205), allow designated admin email
    if (error && error.code === 'PGRST205') {
      const isDesignatedAdmin = user.email?.toLowerCase() === 'eletuabibat12@gmail.com';
      return {
        isAdmin: isDesignatedAdmin,
        reason: isDesignatedAdmin
          ? undefined
          : 'Your account is not an authorized administrator. (Note: Database migration 001_initial_schema.sql has not been run yet in Supabase SQL Editor).',
      };
    }

    return {
      isAdmin: false,
      reason: error ? `Authorization check error: ${error.message}` : 'No administrator profile found for this account.',
    };
  } catch (err) {
    return { isAdmin: false, reason: (err as Error).message };
  }
}
