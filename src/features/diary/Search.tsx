import { Icon } from "../../components/Icon";
import { ActionButton } from "../../components/Actions";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "./client";
import { errorMessage, searchDiary, type SearchEntry } from "./api";
export function DiarySearch({ query }: { query: string }) {
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    query: string;
    page: number;
    results: SearchEntry[];
    loading: boolean;
    error: string;
  }>({ query: "", page: 0, results: [], loading: false, error: "" });
  useEffect(() => {
    if (!supabase || !query.trim()) return;
    let live = true;
    setState({ query, page, results: [], loading: true, error: "" });
    const timer = window.setTimeout(() => {
      searchDiary(query, page)
        .then((results) => {
          if (live)
            setState({ query, page, results, loading: false, error: "" });
        })
        .catch((err) => {
          if (live)
            setState({
              query,
              page,
              results: [],
              loading: false,
              error: errorMessage(err),
            });
        });
    }, 300);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query, page, attempt]);
  if (!query.trim()) return null;
  if (!supabase)
    return (
      <p className="diary-help">
        Busca no diário indisponível: conexão ainda não configurada. Os
        resultados do acervo local continuam disponíveis.
      </p>
    );
  const current = state.query === query && state.page === page;
  return (
    <section className="search-results">
      <h2>Diário publicado</h2>
      {!current || state.loading ? (
        <p role="status">Buscando no diário…</p>
      ) : state.error ? (
        <div role="alert">
          <p>{state.error} A busca local continua disponível.</p>
          <ActionButton icon="refresh" onClick={() => setAttempt((v) => v + 1)}>
            Tentar novamente
          </ActionButton>
        </div>
      ) : (
        <>
          <p role="status">
            {state.results[0]?.total_count ?? 0} publicação(ões) encontrada(s).
          </p>
          <ul>
            {state.results.map((entry) => (
              <li key={entry.id}>
                <Link to={`/diario/${entry.id}`}>
                  <h3>{entry.title} <Icon name="arrowUpRight" /></h3>
                  <p>
                    {entry.body}
                    {entry.body.length >= 220 ? "…" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {(page > 0 || (state.results[0]?.total_count ?? 0) > 20) && (
            <div className="diary-pagination">
              <ActionButton
                icon="arrowLeft"
                disabled={!page}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </ActionButton>
              <span>Página {page + 1}</span>
              <ActionButton
                icon="arrowRight"
                disabled={
                  (page + 1) * 20 >= (state.results[0]?.total_count ?? 0)
                }
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </ActionButton>
            </div>
          )}
        </>
      )}
    </section>
  );
}
