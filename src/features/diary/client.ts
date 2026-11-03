import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
// Não processar callbacks por hash: o hash pertence ao roteador da aplicação.
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storageKey: "greenmond-auth-v1",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
