import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { AccountLink, PrivateDiary, Unavailable, useAuth } from "./Auth";
import { supabase } from "./client";
import {
  client,
  errorMessage,
  getCharacters,
  getEntry,
  getReviews,
  labels,
  listEntries,
  saveEntry,
  transitionEntry,
  type Entry,
  type Form,
  type Status,
} from "./api";

function useLoad<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<{
    value: T | null;
    loading: boolean;
    error: string;
  }>({ value: null, loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ value: null, loading: true, error: "" });
    load()
      .then((value) => {
        if (live) setState({ value, loading: false, error: "" });
      })
      .catch((error) => {
        if (live)
          setState({ value: null, loading: false, error: errorMessage(error) });
      });
    return () => {
      live = false;
    };
    // A chave descreve todos os argumentos da consulta e invalida respostas antigas.
  }, [key, attempt]);
  return { ...state, retry: () => setAttempt((v) => v + 1) };
}
function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="diary-notice" role="alert">
      <p>{message}</p>
      <button className="button" onClick={retry}>
        Tentar novamente
      </button>
    </div>
  );
}
function Header({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">Diário da crônica</p>
      <h1>{title}</h1>
      {children && <p className="intro">{children}</p>}
    </header>
  );
}
export function diaryDate(date: string | null) {
  return date
    ? new Date(date).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "short",
        hour12: false,
      })
    : "";
}
function EntryCards({
  entries,
  privateView = false,
}: {
  entries: Entry[];
  privateView?: boolean;
}) {
  return (
    <ul className="diary-grid">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            to={privateView ? `/meu-diario/${entry.id}` : `/diario/${entry.id}`}
          >
            <p className="eyebrow">
              {labels[entry.kind]}
              {privateView ? ` · ${labels[entry.status]}` : ""}
            </p>
            <h2>{entry.title}</h2>
            <p>
              {entry.body.slice(0, 180)}
              {entry.body.length > 180 ? "…" : ""}
            </p>
            <small>
              {entry.character_name ? `${entry.character_name} · ` : ""}
              {entry.author_name}
              {entry.session_ref ? ` · ${entry.session_ref}` : ""}
            </small>
            <small>
              {privateView
                ? "Atualizado em " + diaryDate(entry.updated_at)
                : "Publicado em " + diaryDate(entry.published_at)}
            </small>
          </Link>
        </li>
      ))}
    </ul>
  );
}
export function DiaryList() {
  if (!supabase) return <Unavailable />;
  return <List />;
}
export function MyDiary() {
  return (
    <PrivateDiary>
      <List privateView />
    </PrivateDiary>
  );
}
function List({ privateView = false }: { privateView?: boolean }) {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("pagina") ?? "1");
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage - 1, 10000) : 0;
  const kind = ["character", "session"].includes(params.get("tipo") ?? "")
    ? params.get("tipo")!
    : "";
  const status = ["draft", "review", "published", "archived"].includes(
    params.get("estado") ?? "",
  )
    ? params.get("estado")!
    : "";
  const result = useLoad(
    `${privateView}:${profile?.user_id}:${profile?.role}:${page}:${kind}:${status}`,
    () =>
      listEntries({
        publicOnly: !privateView,
        kind,
        status: privateView ? status : "",
        page,
      }),
  );
  function filter(name: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("pagina");
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next);
  }
  return (
    <>
      <Header
        title={
          privateView
            ? profile?.role === "narrator"
              ? "Escrita e revisão"
              : "Meu diário"
            : "Histórias da crônica"
        }
      >
        {privateView
          ? "Prepare seus textos e acompanhe a publicação."
          : "Relatos dos personagens e registros das sessões de Greenmond."}
      </Header>
      <div className="diary-toolbar">
        <AccountLink />
        {privateView && (
          <Link className="button" to="/meu-diario/novo">
            Nova entrada ↗
          </Link>
        )}
      </div>
      <div className="filters">
        <label>
          Tipo de entrada
          <select value={kind} onChange={(e) => filter("tipo", e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="character">Relatos de personagem</option>
            <option value="session">Resumos de sessão</option>
          </select>
        </label>
        {privateView && (
          <label>
            Estado
            <select
              value={status}
              onChange={(e) => filter("estado", e.target.value)}
            >
              <option value="">Todos os estados</option>
              {(["draft", "review", "published", "archived"] as Status[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
      </div>
      {result.loading ? (
        <p role="status">Carregando entradas…</p>
      ) : result.error ? (
        <LoadError message={result.error} retry={result.retry} />
      ) : (
        <>
          <p role="status">{result.value?.total ?? 0} entrada(s)</p>
          {!result.value?.entries.length ? (
            <p className="empty">Nenhuma entrada encontrada.</p>
          ) : (
            <EntryCards
              entries={result.value.entries}
              privateView={privateView}
            />
          )}
          <div className="diary-pagination" aria-label="Paginação do diário">
            <button
              disabled={!page}
              onClick={() =>
                setParams({
                  ...Object.fromEntries(params),
                  pagina: String(page),
                })
              }
            >
              ← Anterior
            </button>
            <span>Página {page + 1}</span>
            <button
              disabled={(page + 1) * 20 >= (result.value?.total ?? 0)}
              onClick={() =>
                setParams({
                  ...Object.fromEntries(params),
                  pagina: String(page + 2),
                })
              }
            >
              Próxima →
            </button>
          </div>
        </>
      )}
    </>
  );
}
export function DiaryDetail() {
  const { entryId = "" } = useParams();
  if (!supabase) return <Unavailable />;
  return <PublicDetail key={entryId} id={entryId} />;
}
function PublicDetail({ id }: { id: string }) {
  const result = useLoad(id, () => getEntry(id, true));
  if (result.loading) return <p role="status">Carregando publicação…</p>;
  if (result.error)
    return <LoadError message={result.error} retry={result.retry} />;
  const entry = result.value;
  if (!entry)
    return (
      <>
        <Header title="Publicação não encontrada" />
        <p>A entrada não existe ou não está publicada.</p>
        <Link className="text-link" to="/diario">
          ← Diário
        </Link>
      </>
    );
  return (
    <>
      <Link className="text-link" to="/diario">
        ← Diário
      </Link>
      <Header title={entry.title}>
        {labels[entry.kind]} · {diaryDate(entry.published_at)}
      </Header>
      <p className="diary-byline">
        Por {entry.author_name}
        {entry.character_name ? ` · ${entry.character_name}` : ""}
        {entry.session_ref ? ` · ${entry.session_ref}` : ""}
      </p>
      {entry.character_id && (
        <Link className="text-link" to={`/personagens/${entry.character_id}`}>
          Conhecer {entry.character_name} ↗
        </Link>
      )}
      <div className="reading diary-body">
        <p>{entry.body}</p>
      </div>
    </>
  );
}
export function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!supabase) return <Unavailable />;
  if (auth.loading) return <p role="status">Verificando sessão…</p>;
  if (auth.session)
    return (
      <PrivateDiary>
        <Header title="Você já está conectado" />
        <AccountLink />
      </PrivateDiary>
    );
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error } = await client().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setPassword("");
      navigate("/meu-diario", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header title="Entrar para escrever">
        Acesso para participantes autorizados pelo narrador.
      </Header>
      <form className="diary-form" onSubmit={submit}>
        <label>
          E-mail
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="button" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <p className="diary-help">
          Para receber acesso ou recuperar sua senha, procure o narrador.
        </p>
      </form>
    </>
  );
}
export function DiaryEditor() {
  const { entryId = "" } = useParams();
  return (
    <PrivateDiary>
      <EditorLoader key={entryId} id={entryId} />
    </PrivateDiary>
  );
}
function EditorLoader({ id }: { id: string }) {
  const { profile } = useAuth();
  const result = useLoad(`${id}:${profile?.user_id}`, async () => {
    const entry = id === "novo" ? null : await getEntry(id);
    const [characters, reviews] = await Promise.all([
      getCharacters(profile!),
      entry ? getReviews(entry.id) : Promise.resolve([]),
    ]);
    return { entry, characters, reviews };
  });
  if (result.loading) return <p role="status">Carregando editor…</p>;
  if (result.error)
    return <LoadError message={result.error} retry={result.retry} />;
  if (!result.value || (id !== "novo" && !result.value.entry))
    return (
      <>
        <Header title="Entrada não encontrada" />
        <Link to="/meu-diario">← Meu diário</Link>
      </>
    );
  return (
    <EditorForm
      initial={result.value.entry}
      characters={result.value.characters}
      reviews={result.value.reviews}
    />
  );
}
function toForm(entry: Entry | null): Form {
  return {
    kind: entry?.kind ?? "session",
    title: entry?.title ?? "",
    body: entry?.body ?? "",
    session_ref: entry?.session_ref ?? "",
    character_id: entry?.character_id ?? "",
  };
}
function EditorForm({
  initial,
  characters,
  reviews: initialReviews,
}: {
  initial: Entry | null;
  characters: Awaited<ReturnType<typeof getCharacters>>;
  reviews: Awaited<ReturnType<typeof getReviews>>;
}) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(initial);
  const [form, setForm] = useState(() => toForm(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(initial)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [reviews, setReviews] = useState(initialReviews);
  const formDirty = JSON.stringify(form) !== saved;
  const dirty = formDirty || !!note.trim();
  const allowLeave = useRef(false);
  const narrator = profile?.role === "narrator";
  const editable =
    !entry ||
    (entry.status !== "archived" &&
      (narrator ||
        (entry.author_id === profile?.user_id &&
          entry.status === "draft" &&
          !entry.published_at)));
  const blocker = useBlocker(() => !allowLeave.current && (dirty || busy));
  useEffect(() => {
    if (!dirty && !busy) return;
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty, busy]);
  function update<K extends keyof Form>(name: K, value: Form[K]) {
    setForm((v) => ({ ...v, [name]: value }));
    setMessage("");
  }
  async function action(actionName = "save") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let current = entry;
      if (editable && (formDirty || !current)) {
        current = await saveEntry(form, current);
        setEntry(current);
        setForm(toForm(current));
        setSaved(JSON.stringify(toForm(current)));
      }
      if (actionName !== "save" && current) {
        current = await transitionEntry(current, actionName, note);
        setEntry(current);
        setNote("");
        if (actionName === "request_changes")
          setReviews(await getReviews(current.id));
      }
      setMessage(
        actionName === "save"
          ? "Texto salvo."
          : "Estado da entrada atualizado.",
      );
      if (!initial && current) {
        allowLeave.current = true;
        navigate(`/meu-diario/${current.id}`, { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="text-link" to="/meu-diario">
        ← Escrita e revisão
      </Link>
      <Header title={entry ? entry.title : "Nova entrada"}>
        {entry
          ? `${labels[entry.status]} · Por ${entry.author_name}`
          : "O texto começa como rascunho e só será público após aprovação."}
      </Header>
      {entry && (
        <p className="diary-help">
          {entry.published_at && !narrator
            ? "Após a primeira publicação, somente o narrador pode editar este texto."
            : !editable
              ? "Este texto está disponível apenas para leitura neste estado."
              : "Salve as alterações antes de sair."}{" "}
          <Link to={`/meu-diario/${entry.id}`}>Endereço desta entrada ↗</Link>
        </p>
      )}
      {blocker.state === "blocked" && (
        <div
          className="diary-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="leave-title"
        >
          <h2 id="leave-title">Sair do editor?</h2>
          <p>
            {busy
              ? "Uma gravação está em andamento. Aguarde a conclusão."
              : "As alterações não salvas serão perdidas."}
          </p>
          <button autoFocus onClick={() => blocker.reset()}>
            Continuar escrevendo
          </button>
          <button disabled={busy} onClick={() => blocker.proceed()}>
            Descartar alterações e sair
          </button>
        </div>
      )}
      {error && (
        <p className="diary-error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <form
        className="diary-form"
        onSubmit={(e) => {
          e.preventDefault();
          void action();
        }}
      >
        <fieldset disabled={!editable || busy}>
          <label>
            Tipo de entrada
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value as Form["kind"],
                  character_id: "",
                }))
              }
            >
              <option value="session">Resumo de sessão</option>
              <option value="character">Relato de personagem</option>
            </select>
          </label>
          {form.kind === "character" && (
            <label>
              Personagem
              <select
                required
                value={form.character_id}
                onChange={(e) => update("character_id", e.target.value)}
              >
                <option value="">Selecione um personagem</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {entry?.character_id &&
                  !characters.some((c) => c.id === entry.character_id) && (
                    <option value={entry.character_id}>
                      {entry.character_name} (atribuição indisponível)
                    </option>
                  )}
              </select>
              {!characters.length && (
                <small>
                  Nenhum personagem atribuído. Solicite a atribuição ao
                  narrador.
                </small>
              )}
            </label>
          )}
          <label>
            Título
            <input
              required
              maxLength={180}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <label>
            Sessão (opcional)
            <input
              maxLength={120}
              placeholder="Ex.: Season 6 · Sessão 12"
              value={form.session_ref}
              onChange={(e) => update("session_ref", e.target.value)}
            />
          </label>
          <label>
            Texto
            <textarea
              required
              maxLength={50000}
              rows={18}
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
            />
          </label>
          <small>
            {form.body.length.toLocaleString("pt-BR")} / 50.000 caracteres ·
            Texto simples
          </small>
          <button className="button" disabled={!dirty && !!entry}>
            {busy ? "Salvando…" : "Salvar texto"}
          </button>
        </fieldset>
      </form>
      <div className="diary-actions">
        {(!entry || entry.status === "draft") && editable && (
          <button
            className="button"
            disabled={
              busy ||
              !form.title.trim() ||
              !form.body.trim() ||
              (form.kind === "character" && !form.character_id)
            }
            onClick={() => void action("submit")}
          >
            Enviar para revisão
          </button>
        )}
        {narrator && entry?.status === "review" && (
          <>
            <button
              className="button"
              disabled={busy}
              onClick={() => void action("publish")}
            >
              Publicar entrada
            </button>
            <label>
              Orientação para ajustes
              <textarea
                maxLength={2000}
                rows={3}
                value={note}
                disabled={busy}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button
              disabled={busy || !note.trim()}
              onClick={() => void action("request_changes")}
            >
              Solicitar ajustes
            </button>
          </>
        )}
        {narrator && entry?.status === "published" && (
          <button disabled={busy} onClick={() => void action("archive")}>
            Retirar do ar
          </button>
        )}
        {narrator && entry?.status === "archived" && (
          <button disabled={busy} onClick={() => void action("restore")}>
            Restaurar como rascunho
          </button>
        )}
        {entry?.status === "published" && (
          <Link className="text-link" to={`/diario/${entry.id}`}>
            Ver publicação ↗
          </Link>
        )}
      </div>
      {reviews.length > 0 && (
        <section className="diary-reviews">
          <h2>Orientações privadas de revisão</h2>
          {reviews.map((review) => (
            <article key={review.id}>
              <small>{diaryDate(review.created_at)}</small>
              <p>{review.note}</p>
            </article>
          ))}
        </section>
      )}
      {entry && !dirty && (
        <button
          type="button"
          className="text-link"
          onClick={() => navigate("/meu-diario")}
        >
          Voltar à lista
        </button>
      )}
    </>
  );
}
