import { supabase } from "./client";
export type Kind = "character" | "session";
export type Status = "draft" | "review" | "published" | "archived";
export type Profile = {
  user_id: string;
  display_name: string;
  role: "player" | "narrator";
  active: boolean;
};
export type Entry = {
  id: string;
  author_id: string;
  author_name: string;
  kind: Kind;
  character_id: string | null;
  character_name: string | null;
  title: string;
  body: string;
  session_ref: string | null;
  status: Status;
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
export type Review = { id: string; note: string; created_at: string };
export type Character = { id: string; name: string };
export type SearchEntry = Pick<
  Entry,
  | "id"
  | "title"
  | "body"
  | "kind"
  | "author_name"
  | "character_name"
  | "published_at"
> & { total_count: number };
export type Form = {
  kind: Kind;
  title: string;
  body: string;
  session_ref: string;
  character_id: string;
};
export const labels: Record<Status | Kind, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  published: "Publicado",
  archived: "Arquivado",
  character: "Relato de personagem",
  session: "Resumo de sessão",
};
export function client() {
  if (!supabase)
    throw new Error("Diário indisponível: conexão não configurada.");
  return supabase;
}
export function errorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message ?? "");
  const codes: Record<string, string> = {
    GREENMOND_CONFLICT:
      "Este texto foi atualizado em outra aba. Copie suas alterações e recarregue a entrada antes de tentar novamente.",
    GREENMOND_FORBIDDEN:
      "Sua conta não tem permissão para esta ação. Verifique se o acesso continua ativo.",
    GREENMOND_CHARACTER: "Este personagem não está disponível para sua conta.",
    GREENMOND_TRANSITION:
      "O estado da entrada mudou ou não permite esta ação. Recarregue para conferir.",
    GREENMOND_NOTE:
      "Escreva uma orientação de revisão com até 2.000 caracteres.",
    GREENMOND_INVALID: "Confira o título, o texto e os limites dos campos.",
    GREENMOND_NOT_FOUND: "Entrada não encontrada ou indisponível.",
  };
  for (const [code, text] of Object.entries(codes))
    if (message.includes(code)) return text;
  if (message.includes("Invalid login credentials"))
    return "E-mail ou senha inválidos.";
  if (message.includes("Email not confirmed"))
    return "Confirme sua conta com o responsável pelo diário.";
  return "Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.";
}
export async function getProfile(userId: string) {
  const { data, error } = await client()
    .from("greenmond_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
export async function listEntries(options: {
  publicOnly?: boolean;
  status?: string;
  kind?: string;
  page: number;
}) {
  let query = client()
    .from("greenmond_diary_entries")
    .select("*", { count: "exact" });
  if (options.publicOnly) query = query.eq("status", "published");
  else if (options.status) query = query.eq("status", options.status);
  if (options.kind) query = query.eq("kind", options.kind);
  const { data, error, count } = await query
    .order(options.publicOnly ? "published_at" : "updated_at", {
      ascending: false,
    })
    .order("id")
    .range(options.page * 20, options.page * 20 + 19);
  if (error) throw error;
  return { entries: data as Entry[], total: count ?? 0 };
}
export async function getEntry(id: string, publicOnly = false) {
  // IDs arbitrários devem resultar em "não encontrado", sem erro de UUID do servidor.
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  let query = client().from("greenmond_diary_entries").select("*").eq("id", id);
  if (publicOnly) query = query.eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as Entry | null;
}
export async function getCharacters(profile: Profile) {
  let query = client()
    .from("greenmond_characters")
    .select("id,name")
    .order("name");
  if (profile.role !== "narrator") {
    const { data, error } = await client()
      .from("greenmond_character_assignments")
      .select("character_id")
      .eq("user_id", profile.user_id);
    if (error) throw error;
    const ids = (data ?? []).map((r) => r.character_id as string);
    if (!ids.length) return [];
    query = query.in("id", ids);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Character[];
}
export async function getReviews(id: string) {
  const { data, error } = await client()
    .from("greenmond_diary_reviews")
    .select("id,note,created_at")
    .eq("entry_id", id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Review[];
}
export async function saveEntry(form: Form, entry: Entry | null) {
  const { data, error } = await client()
    .rpc("greenmond_save_diary", {
      p_id: entry?.id ?? null,
      p_version: entry?.version ?? null,
      p_kind: form.kind,
      p_title: form.title,
      p_body: form.body,
      p_session_ref: form.session_ref,
      p_character_id:
        form.kind === "character" ? form.character_id || null : null,
    })
    .single();
  if (error) throw error;
  return data as Entry;
}
export async function transitionEntry(entry: Entry, action: string, note = "") {
  const { data, error } = await client()
    .rpc("greenmond_transition_diary", {
      p_id: entry.id,
      p_version: entry.version,
      p_action: action,
      p_note: note,
    })
    .single();
  if (error) throw error;
  return data as Entry;
}
export async function searchDiary(query: string, page = 0) {
  if (!supabase || !query.trim()) return [];
  const { data, error } = await supabase.rpc("greenmond_search_diary", {
    p_query: query.trim().slice(0, 200),
    p_page: page,
  });
  if (error) throw error;
  return data as SearchEntry[];
}
