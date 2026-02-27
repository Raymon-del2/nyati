import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not set');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export const supabase = {
  get client() {
    return getSupabaseClient();
  }
} as unknown as { client: SupabaseClient };

export interface ApiKey {
  id: string;
  user_id: string;
  key_hint: string;
  secret_hash: string;
  is_active: boolean;
  tier: string;
  created_at: string;
  last_used_at: string | null;
}

export interface Profile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
}
