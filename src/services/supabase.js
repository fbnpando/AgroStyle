import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_BUCKET =
  import.meta.env.VITE_SUPABASE_BUCKET || 'agrostyle';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local'
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      })
    : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
