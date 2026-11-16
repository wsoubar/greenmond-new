import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionButton, ActionLink } from "../../components/Actions";
import { PrivateDiary, useAuth } from "../diary/Auth";
import { supabase } from "../diary/client";
import {
  fields,
  listContacts,
  getUnreadCount,
  sendContact,
  setContactStatus,
  type ContactForm,
  type ContactStatus,
} from "./api";
import { Turnstile } from "./Turnstile";

const empty: ContactForm = {
  name: "",
  contact: "",
  subject: "",
  message: "",
  website: "",
};
export function ContactPage() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    if (
      fields.some(
        ({ key, max }) =>
          !form[key].trim() || [...form[key].trim()].length > max,
      )
    ) {
      setError("Preencha todos os campos com conteúdo válido.");
      return;
    }
    if (!token) {
      setError("Aguarde a verificação de segurança antes de enviar.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await sendContact(form, token);
      setForm(empty);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setToken("");
      setVerificationAttempt((value) => value + 1);
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Contato</p>
        <h1>Fale com os narradores</h1>
        <p className="intro">
          Dúvidas, sugestões ou interesse em participar de Greenmond? Envie sua
          mensagem.
        </p>
      </header>
      <p className="diary-help">
        Sua mensagem e seu contato serão vistos apenas pelos narradores. A
        resposta será feita pelo canal que você informar, fora do site.
      </p>
      {!supabase ? (
        <p role="status">O contato está temporariamente indisponível.</p>
      ) : sent ? (
        <div className="diary-notice" role="status">
          <h2>Mensagem recebida</h2>
          <p>Os narradores poderão responder pelo contato informado.</p>
          <ActionButton icon="plus" onClick={() => setSent(false)}>
            Enviar outra mensagem
          </ActionButton>
        </div>
      ) : (
        <form className="diary-form contact-form" onSubmit={submit}>
          {fields.map(({ key, label, max }) => (
            <label key={key}>
              <span id={`contact-${key}-label`}>{label}</span>
              {key === "message" ? (
                <textarea
                  aria-labelledby={`contact-${key}-label`}
                  required
                  maxLength={max}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  rows={8}
                />
              ) : (
                <input
                  aria-labelledby={`contact-${key}-label`}
                  required
                  maxLength={max}
                  autoComplete={key === "name" ? "name" : "off"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  aria-describedby={
                    key === "contact" ? "contact-help" : undefined
                  }
                />
              )}
              {key === "contact" && (
                <small id="contact-help">
                  Informe seu e-mail, WhatsApp com DDD ou outro canal para
                  retorno.
                </small>
              )}
              {key === "message" && <small>Até 5.000 caracteres.</small>}
            </label>
          ))}
          <div className="contact-trap" aria-hidden="true">
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </label>
          </div>
          <Turnstile key={verificationAttempt} onToken={setToken} />
          <p className="diary-help">
            O envio utiliza o Cloudflare Turnstile para proteção contra spam.
          </p>
          {error && <p role="alert">{error}</p>}
          <ActionButton
            icon="send"
            type="submit"
            tone="primary"
            disabled={busy || !token}
            loading={busy}
          >
            Enviar mensagem
          </ActionButton>
        </form>
      )}
    </>
  );
}
export function ContactInbox() {
  return (
    <PrivateDiary>
      <NarratorContacts />
    </PrivateDiary>
  );
}
function NarratorContacts() {
  const { profile } = useAuth();
  if (profile?.role !== "narrator" || !profile.active)
    return <p role="alert">Acesso exclusivo dos narradores.</p>;
  return <Inbox key={profile.user_id} />;
}
function Inbox() {
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof listContacts>
  > | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setResult(null);
    setError("");
    setSelected(null);
    listContacts(page)
      .then((data) => {
        if (live) setResult(data);
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [page, attempt]);
  async function change(id: string, status: ContactStatus) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await setContactStatus(id, status);
      setResult(await listContacts(page));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível atualizar.",
      );
    } finally {
      setBusy(false);
    }
  }
  const detail = result?.contacts.find((item) => item.id === selected);
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Escrita e revisão</p>
        <h1>Contatos</h1>
        <p className="intro">
          Mensagens privadas dos visitantes para os narradores.
        </p>
      </header>
      <div className="diary-toolbar">
        <ActionLink icon="arrowLeft" to="/meu-diario">
          Voltar à escrita e revisão
        </ActionLink>
        <ActionButton
          icon="refresh"
          disabled={busy}
          onClick={() => setAttempt((v) => v + 1)}
        >
          Atualizar contatos
        </ActionButton>
      </div>
      {error && <p role="alert">{error}</p>}
      {!result && !error && <p role="status">Carregando contatos…</p>}
      {result && (
        <>
          <p role="status">
            {result.unread} nova(s) · {result.total} mensagem(ns)
          </p>
          {detail ? (
            <article className="contact-detail">
              <ActionButton icon="arrowLeft" onClick={() => setSelected(null)}>
                Voltar à lista
              </ActionButton>
              <h2>{detail.subject}</h2>
              <p>
                {detail.name} ·{" "}
                {new Date(detail.created_at).toLocaleString("pt-BR")}
              </p>
              <p>
                <strong>Contato para retorno:</strong> {detail.contact}
              </p>
              <p className="contact-message">{detail.message}</p>
              <p>Estado: {detail.status}</p>
              <div className="diary-toolbar">
                {(["lida", "resolvida", "nova"] as ContactStatus[])
                  .filter((status) => status !== detail.status)
                  .map((status) => (
                    <ActionButton
                      key={status}
                      icon={status === "resolvida" ? "check" : "restore"}
                      disabled={busy}
                      onClick={() => void change(detail.id, status)}
                    >
                      {status === "nova"
                        ? "Reabrir atendimento"
                        : `Marcar como ${status}`}
                    </ActionButton>
                  ))}
              </div>
            </article>
          ) : (
            <>
              {!result.contacts.length && (
                <p className="empty">Nenhuma mensagem recebida.</p>
              )}
              <ul className="contact-list">
                {result.contacts.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => setSelected(item.id)}>
                      <span className="eyebrow">{item.status}</span>
                      <strong>{item.subject}</strong>
                      <span>
                        {item.name} ·{" "}
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="diary-pagination">
                <ActionButton
                  icon="arrowLeft"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </ActionButton>
                <span>Página {page + 1}</span>
                <ActionButton
                  icon="arrowRight"
                  disabled={(page + 1) * 20 >= result.total}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </ActionButton>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
export function ContactInboxLink() {
  const { profile } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    if (profile?.role === "narrator" && profile.active)
      getUnreadCount()
        .then((count) => {
          if (live) setCount(count);
        })
        .catch(() => {
          if (live) setCount(null);
        });
    return () => {
      live = false;
    };
  }, [profile]);
  return profile?.role === "narrator" && profile.active ? (
    <ActionLink icon="file" to="/meu-diario/contatos">
      Contatos{count !== null ? ` (${count} novas)` : ""}
    </ActionLink>
  ) : null;
}
