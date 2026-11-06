import { useEffect, useState, type FormEvent } from "react";
import { ActionButton, ActionLink } from "../../components/Actions";
import { supabase } from "./client";
import { Unavailable } from "./Auth";
import { recoveryRedirectUrl } from "./recovery";
import { clearRecoverySession, recoverySession } from "./recovery-session";

export function RequestRecovery() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  if (!supabase) return <Unavailable />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: recoveryRedirectUrl(window.location.href),
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError("Não foi possível enviar a solicitação. Tente novamente mais tarde.");
    } finally { setBusy(false); }
  }
  return <>
    <header className="page-heading"><p className="eyebrow">ACESSO</p><h1>Recuperar senha</h1></header>
    {sent ? <p role="status">Se houver uma conta para este e-mail, você receberá as instruções para redefinir sua senha.</p> :
      <form className="diary-form" onSubmit={submit}>
        <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {error && <p role="alert">{error}</p>}
        <ActionButton icon="send" type="submit" className="button" loading={busy} disabled={busy}>Enviar instruções</ActionButton>
      </form>}
    <ActionLink icon="arrowLeft" to="/entrar">Voltar para entrar</ActionLink>
  </>;
}

export function ResetPassword() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; recoverySession().then((result) => { if (active) setUserId(result?.userId ?? null); }); return () => { active = false; }; }, []);
  if (!supabase) return <Unavailable />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setError("As senhas não coincidem."); return; }
    setBusy(true);
    setError("");
    try {
      const { data, error: sessionError } = await supabase!.auth.getSession();
      if (sessionError || !userId || data.session?.user.id !== userId) throw new Error("session");
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) throw error;
      clearRecoverySession();
      setPassword(""); setConfirmation(""); setDone(true);
    } catch { setError("Não foi possível alterar a senha. Confira os requisitos de senha ou solicite outro link."); }
    finally { setBusy(false); }
  }
  return <>
    <header className="page-heading"><p className="eyebrow">ACESSO</p><h1>Redefinir senha</h1></header>
    {userId === undefined ? <p role="status">Verificando link…</p> : done ? <><p role="status">Senha alterada. Sua sessão está ativa neste navegador.</p><ActionLink icon="book" to="/meu-diario">Ir para o diário</ActionLink></> : !userId ? <><p role="alert">Este link é inválido, expirou ou já foi usado. Solicite um novo.</p><ActionLink icon="arrowRight" to="/recuperar-senha">Solicitar novo link</ActionLink></> :
      <form className="diary-form" onSubmit={submit}>
        <label>Nova senha<input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label>Confirmar nova senha<input type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>
        {error && <p role="alert">{error}</p>}
        <ActionButton icon="save" type="submit" className="button" loading={busy} disabled={busy}>Salvar nova senha</ActionButton>
      </form>}
  </>;
}
