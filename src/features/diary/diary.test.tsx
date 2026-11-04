// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { RouterProvider } from "react-router";
import { createAppRouter } from "../../App";
import type { Entry, Profile } from "./api";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listEntries: vi.fn(),
  getEntry: vi.fn(),
  getCharacters: vi.fn(),
  getReviews: vi.fn(),
  saveEntry: vi.fn(),
  transitionEntry: vi.fn(),
  searchDiary: vi.fn(),
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  listener: null as null | ((event: string, session: unknown) => void),
}));
vi.mock("./client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  },
}));
vi.mock("./api", async (original) => ({
  ...(await original<typeof import("./api")>()),
  getProfile: mocks.getProfile,
  listEntries: mocks.listEntries,
  getEntry: mocks.getEntry,
  getCharacters: mocks.getCharacters,
  getReviews: mocks.getReviews,
  saveEntry: mocks.saveEntry,
  transitionEntry: mocks.transitionEntry,
  searchDiary: mocks.searchDiary,
}));
const id = "10000000-0000-0000-0000-000000000001";
const session = { user: { id: "player-a" }, access_token: "test-only" };
const profile: Profile = {
  user_id: "player-a",
  display_name: "Jogador A",
  active: true,
  role: "player",
};
const entry: Entry = {
  id,
  author_id: "player-a",
  author_name: "Jogador A",
  kind: "session",
  character_id: null,
  character_name: null,
  title: "Uma noite",
  body: "Texto da sessão.",
  session_ref: "Sessão 1",
  status: "draft",
  version: 1,
  created_at: "2026-11-03T00:00:00Z",
  updated_at: "2026-11-03T00:00:00Z",
  published_at: null,
};
const routers: ReturnType<typeof createAppRouter>[] = [];
function visit(path: string) {
  window.history.replaceState({}, "", `/greenmond-new/#${path}`);
  const router = createAppRouter();
  routers.push(router);
  render(<RouterProvider router={router} />);
  return router;
}
beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
  mocks.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.onAuthStateChange.mockImplementation((listener) => {
    mocks.listener = listener;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getEntry.mockResolvedValue(entry);
  mocks.listEntries.mockResolvedValue({ entries: [entry], total: 1 });
  mocks.getCharacters.mockResolvedValue([{ id: "1", name: "Jason P. Adams" }]);
  mocks.getReviews.mockResolvedValue([]);
  mocks.searchDiary.mockResolvedValue([]);
  mocks.saveEntry.mockImplementation(async (form, original) => ({
    ...(original ?? entry),
    ...form,
    version: (original?.version ?? 0) + 1,
  }));
  mocks.transitionEntry.mockImplementation(async (e, action) => ({
    ...e,
    status: (
      {
        submit: "review",
        publish: "published",
        request_changes: "draft",
        archive: "archived",
        restore: "draft",
      } as Record<string, string>
    )[action],
    version: e.version + 1,
  }));
  mocks.signInWithPassword.mockResolvedValue({
    data: { session },
    error: null,
  });
  mocks.signOut.mockImplementation(async () => {
    mocks.listener?.("SIGNED_OUT", null);
    return { error: null };
  });
});
afterEach(() => {
  cleanup();
  routers.splice(0).forEach((r) => r.dispose());
});

describe("escrita e revisão do diário", () => {
  it("restaura a sessão e preserva o texto após falha de gravação e conflito", async () => {
    mocks.saveEntry
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("GREENMOND_CONFLICT"));
    visit(`/meu-diario/${id}`);
    const body = await screen.findByLabelText("Texto");
    fireEvent.change(body, { target: { value: "Minha alteração não salva." } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar texto" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((body as HTMLTextAreaElement).value).toBe(
      "Minha alteração não salva.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar texto" }));
    await screen.findByText(/atualizado em outra aba/);
    expect((body as HTMLTextAreaElement).value).toBe(
      "Minha alteração não salva.",
    );
  });
  it("bloqueia saída com alterações não salvas e permite continuar", async () => {
    visit(`/meu-diario/${id}`);
    fireEvent.change(await screen.findByLabelText("Texto"), {
      target: { value: "Ainda escrevendo" },
    });
    fireEvent.click(screen.getByRole("link", { name: "Escrita e revisão" }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar escrevendo" }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect((screen.getByLabelText("Texto") as HTMLTextAreaElement).value).toBe(
      "Ainda escrevendo",
    );
  });
  it("salva e envia um novo relato atribuído para revisão", async () => {
    visit("/meu-diario/novo");
    fireEvent.change(await screen.findByLabelText("Tipo de entrada"), {
      target: { value: "character" },
    });
    expect(screen.getByRole("option", { name: "Jason P. Adams" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Personagem"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Minha noite" },
    });
    fireEvent.change(screen.getByLabelText("Texto"), {
      target: { value: "Relato de Jason." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar para revisão" }),
    );
    await waitFor(() =>
      expect(mocks.transitionEntry).toHaveBeenCalledWith(
        expect.objectContaining({ id }),
        "submit",
        "",
      ),
    );
    await waitFor(() =>
      expect(window.location.hash).toBe(`#/meu-diario/${id}`),
    );
    expect(mocks.saveEntry).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "character", character_id: "1" }),
      null,
    );
  });
  it("jogador não edita publicação nem vê ações do narrador", async () => {
    mocks.getEntry.mockResolvedValue({
      ...entry,
      status: "published",
      published_at: "2026-11-03T00:00:00Z",
    });
    visit(`/meu-diario/${id}`);
    const body = await screen.findByLabelText("Texto");
    expect(body.matches(":disabled")).toBe(true);
    expect(
      screen.queryByRole("button", { name: "Publicar entrada" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Retirar do ar" })).toBeNull();
  });
  it("narrador devolve revisão com orientação privada", async () => {
    mocks.getProfile.mockResolvedValue({ ...profile, role: "narrator" });
    mocks.getEntry.mockResolvedValue({ ...entry, status: "review" });
    visit(`/meu-diario/${id}`);
    fireEvent.change(await screen.findByLabelText("Orientação para ajustes"), {
      target: { value: "Esclareça a cena final." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Solicitar ajustes" }));
    await waitFor(() =>
      expect(mocks.transitionEntry).toHaveBeenCalledWith(
        expect.objectContaining({ status: "review" }),
        "request_changes",
        "Esclareça a cena final.",
      ),
    );
    await screen.findByText(/Estado da entrada atualizado/);
  });
  it("narrador publica revisão e retira publicação do ar", async () => {
    mocks.getProfile.mockResolvedValue({ ...profile, role: "narrator" });
    mocks.getEntry.mockResolvedValue({ ...entry, status: "review" });
    visit(`/meu-diario/${id}`);
    fireEvent.click(
      await screen.findByRole("button", { name: "Publicar entrada" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Retirar do ar" }),
    );
    await screen.findByRole("button", { name: "Restaurar como rascunho" });
  });
  it("renovação do token não desmonta o editor nem descarta texto", async () => {
    visit(`/meu-diario/${id}`);
    fireEvent.change(await screen.findByLabelText("Texto"), {
      target: { value: "Texto em andamento" },
    });
    await act(async () => {
      mocks.listener?.("TOKEN_REFRESHED", {
        ...session,
        access_token: "renewed",
      });
    });
    expect((screen.getByLabelText("Texto") as HTMLTextAreaElement).value).toBe(
      "Texto em andamento",
    );
    expect(mocks.getProfile).toHaveBeenCalledTimes(1);
  });
});
describe("consulta e autenticação", () => {
  it("lista publicações com paginação e filtro", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mocks.listEntries.mockResolvedValue({
      entries: [{ ...entry, status: "published" }],
      total: 21,
    });
    visit("/diario");
    fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    await waitFor(() =>
      expect(mocks.listEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ publicOnly: true, page: 1 }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Tipo de entrada"), {
      target: { value: "character" },
    });
    await waitFor(() =>
      expect(mocks.listEntries).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: "character", page: 0 }),
      ),
    );
  });
  it("abre publicação direta sem consultar revisões privadas e renderiza texto sem HTML", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mocks.getEntry.mockResolvedValue({
      ...entry,
      status: "published",
      body: "<script>texto</script>",
      published_at: "2026-11-03T00:00:00Z",
    });
    visit(`/diario/${id}`);
    expect(await screen.findByText("<script>texto</script>")).toBeTruthy();
    expect(mocks.getEntry).toHaveBeenCalledWith(id, true);
    expect(mocks.getReviews).not.toHaveBeenCalled();
  });
  it("nega acesso editorial a conta sem perfil Greenmond", async () => {
    mocks.getProfile.mockResolvedValue(null);
    visit("/meu-diario");
    expect(
      await screen.findByRole("heading", { name: "Acesso não autorizado" }),
    ).toBeTruthy();
    expect(mocks.listEntries).not.toHaveBeenCalled();
  });
  it("faz login por senha e encerra apenas a sessão local", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.listener?.("SIGNED_IN", session);
      return { error: null };
    });
    visit("/entrar");
    fireEvent.change(await screen.findByLabelText("E-mail"), {
      target: { value: "user@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "test-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await screen.findByRole("heading", { name: "Meu diário" });
    fireEvent.click(
      await screen.findByRole("button", { name: "Sair da conta" }),
    );
    await screen.findByRole("heading", { name: "Entre para escrever" });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("mantém resultados locais quando a busca remota falha", async () => {
    mocks.searchDiary.mockRejectedValue(new Error("offline"));
    visit("/busca?q=Alice");
    expect(screen.getByRole("link", { name: /^Alice Monteir/ })).toBeTruthy();
    expect(
      await screen.findByText(/A busca local continua disponível/),
    ).toBeTruthy();
  });
});
