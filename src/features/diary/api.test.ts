import { beforeEach, expect, it, vi } from "vitest";
import {
  errorMessage,
  getEntry,
  listEntries,
  saveEntry,
  searchDiary,
  transitionEntry,
  type Entry,
} from "./api";
const mock = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("./client", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return {
    supabase: createClient("https://example.test", "sb_publishable_test", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: mock.fetch },
    }),
  };
});
const entry = {
  id: "10000000-0000-0000-0000-000000000001",
  version: 2,
  title: "Noite",
  body: "Texto",
  status: "draft",
} as Entry;
beforeEach(() => {
  mock.fetch.mockReset();
  mock.fetch.mockImplementation(async (_url, init) => {
    const headers = new Headers(init?.headers);
    return new Response(
      JSON.stringify(
        headers.get("Accept")?.includes("object") ? entry : [entry],
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Range": "0-19/21",
        },
      },
    );
  });
});
it("negocia retorno de uma única entrada e envia autoria apenas pelo banco", async () => {
  const result = await saveEntry(
    {
      kind: "session",
      title: "Noite",
      body: "Texto",
      character_id: "1",
      session_ref: "",
    },
    null,
  );
  expect(result.id).toBe(entry.id);
  const [url, init] = mock.fetch.mock.calls[0];
  expect(String(url)).toContain("/rpc/greenmond_save_diary");
  expect(new Headers(init.headers).get("Accept")).toContain("object");
  const body = JSON.parse(init.body);
  expect(body).toMatchObject({
    p_id: null,
    p_version: null,
    p_character_id: null,
  });
  expect(body).not.toHaveProperty("author_id");
});
it("envia a versão atual ao alterar estado e retorna um objeto", async () => {
  expect((await transitionEntry(entry, "submit")).id).toBe(entry.id);
  expect(JSON.parse(mock.fetch.mock.calls[0][1].body)).toMatchObject({
    p_id: entry.id,
    p_version: 2,
    p_action: "submit",
  });
});
it("consulta pública exige estado publicado e paginação exata", async () => {
  const result = await listEntries({
    publicOnly: true,
    page: 1,
    kind: "character",
  });
  expect(result.total).toBe(21);
  const url = new URL(mock.fetch.mock.calls[0][0]);
  expect(url.searchParams.get("status")).toBe("eq.published");
  expect(url.searchParams.get("kind")).toBe("eq.character");
  expect(url.searchParams.get("offset")).toBe("20");
  expect(url.searchParams.get("limit")).toBe("20");
});
it("não consulta UUID inválido e restringe acesso público direto", async () => {
  expect(await getEntry("inexistente", true)).toBeNull();
  expect(mock.fetch).not.toHaveBeenCalled();
  // maybeSingle negocia uma lista e converte a única linha em objeto.
  expect((await getEntry(entry.id, true))?.id).toBe(entry.id);
  expect(new URL(mock.fetch.mock.calls[0][0]).searchParams.get("status")).toBe(
    "eq.published",
  );
});
it("propaga conflito sem transformá-lo em sucesso", async () => {
  mock.fetch.mockResolvedValue(
    new Response(
      JSON.stringify({ code: "P0001", message: "GREENMOND_CONFLICT" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    ),
  );
  await expect(
    saveEntry(
      {
        kind: "session",
        title: "Noite",
        body: "Texto",
        character_id: "",
        session_ref: "",
      },
      entry,
    ),
  ).rejects.toMatchObject({ message: "GREENMOND_CONFLICT" });
  expect(errorMessage({ message: "GREENMOND_CONFLICT" })).toContain(
    "outra aba",
  );
});
it("busca remota usa função pública com termo limitado, sem curinga SQL do cliente", async () => {
  await searchDiary(" a".repeat(300), 1);
  const [url, init] = mock.fetch.mock.calls[0];
  expect(String(url)).toContain("/rpc/greenmond_search_diary");
  expect(JSON.parse(init.body).p_query).toHaveLength(200);
  expect(JSON.parse(init.body).p_page).toBe(1);
});
