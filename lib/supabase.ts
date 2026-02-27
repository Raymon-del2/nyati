import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
