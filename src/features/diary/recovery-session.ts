import { supabase } from "./client";
import { consumeRecoveryCallback } from "./recovery";

type RecoveryResult = { userId: string } | null;
let recovery: Promise<RecoveryResult> = Promise.resolve(null);

// Executado antes de criar o roteador, que também usa o fragmento da URL.
export function initializeRecovery() {
  const callback = consumeRecoveryCallback(window.location.href);
  if (callback.kind === "none") return;
  const clean = new URL(window.location.href);
  clean.searchParams.delete("recovery");
  clean.hash = "/redefinir-senha";
  window.history.replaceState(window.history.state, "", clean.toString());
  if (callback.kind === "error" || !supabase) {
    recovery = Promise.resolve(null);
    return;
  }
  recovery = supabase.auth.setSession({
    access_token: callback.accessToken,
    refresh_token: callback.refreshToken,
  }).then(({ data, error }) => error || !data.session ? null : { userId: data.session.user.id }).catch(() => null);
}

export function recoverySession() { return recovery; }
export function clearRecoverySession() { recovery = Promise.resolve(null); }
