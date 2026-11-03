// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createAppRouter } from "./App";
import { RouterProvider } from "react-router";
import { personagens } from "./lib/content";
// Estes cenários validam o acervo sem depender da configuração local do diário.
vi.mock("./features/diary/client", () => ({ supabase: null }));
beforeEach(() => {
  window.scrollTo = vi.fn();
});
const routers: ReturnType<typeof createAppRouter>[] = [];
afterEach(() => { cleanup(); routers.splice(0).forEach((router) => router.dispose()); });
function renderApp() { const router = createAppRouter(); routers.push(router); render(<RouterProvider router={router} />); }
function visit(path: string) {
  window.history.replaceState({}, "", `/greenmond-new/#${path}`);
  renderApp();
}
describe("navegação do cenário", () => {
  it("abre detalhe por URL direta e navega até a ficha", () => {
    const p = personagens[0];
    visit(`/personagens/${p.id}`);
    expect(screen.getByRole("heading", { name: p.nome })).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: /Consultar ficha/ }));
    expect(window.location.hash.slice(1)).toBe(`/fichas/${p.id}`);
    expect(screen.getByText("Ficha do personagem")).toBeTruthy();
  });
  it("filtra personagens e informa busca vazia", () => {
    visit("/personagens");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "registro inexistente" },
    });
    expect(screen.getByText(/Nenhum personagem encontrado/)).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: personagens[0].nome },
    });
    expect(
      screen.getByRole("link", {
        name: new RegExp(
          personagens[0].nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ),
      }),
    ).toBeTruthy();
  });
  it("trata ID inexistente com retorno à entrada", () => {
    visit("/personagens/nao-existe");
    expect(screen.getByRole("heading", { name: /Este caminho/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Voltar ao início/ })).toBeTruthy();
  });
});

describe("relações dos locais", () => {
  it("abre a história do NPC ligado ao Palácio", () => {
    visit("/cidade/palacio-das-aguas");
    fireEvent.click(screen.getByRole("link", { name: /Lucius Wilber Smith/ }));
    expect(window.location.hash.slice(1)).toBe("/npcs/lucius-wilber-smith");
    expect(screen.getByRole("heading", { name: "Lucius Wilber Smith" })).toBeTruthy();
    expect(screen.getByText(/colecionou mais inimigos/)).toBeTruthy();
  });
  it("abre Jason pelo Sunset Garden", () => {
    visit("/cidade/sunset-garden");
    fireEvent.click(screen.getByRole("link", { name: /Jason P. Adams/ }));
    expect(window.location.hash.slice(1)).toBe("/personagens/1");
  });
  it("resolve NPC por URL direta e trata ID inválido", () => {
    visit("/npcs/alice-monteir");
    expect(screen.getByRole("heading", { name: "Alice Monteir" })).toBeTruthy();
    cleanup();
    visit("/npcs/inexistente");
    expect(screen.getByRole("heading", { name: /Este caminho/ })).toBeTruthy();
  });
  it("não mostra relações em locais sem vínculo aprovado", () => {
    visit("/cidade/o-centro");
    expect(screen.queryByRole("heading", { name: /Quem se relaciona/ })).toBeNull();
  });
});

it("mantém o endereço ao usar o atalho de conteúdo", () => {
  visit("/cidade/sunset-garden");
  fireEvent.click(screen.getByRole("link", { name: "Ir para o conteúdo" }));
  expect(window.location.hash).toBe("#/cidade/sunset-garden");
  expect(document.activeElement?.id).toBe("conteudo");
});
it("reabre a rota pelo endereço com hash", () => {
  visit("/cidade/sunset-garden");
  expect(screen.getByRole("link", { name: /Jason P. Adams/ }).getAttribute("href")).toBe("#/personagens/1");
  cleanup();
  renderApp();
  expect(screen.getByRole("heading", { name: "Sunset Garden" })).toBeTruthy();
});

it("navega da pessoa ao local e volta pelo histórico", async () => {
  visit("/personagens/1");
  fireEvent.click(screen.getByRole("link", { name: /Sunset Garden/ }));
  expect(window.location.hash).toBe("#/cidade/sunset-garden");
  window.history.back();
  expect(await screen.findByRole("heading", { name: "Locais relacionados" })).toBeTruthy();
  expect(window.location.hash).toBe("#/personagens/1");
});
it("mostra local relacionado em NPC e omite seção sem vínculos", () => {
  visit("/npcs/alice-monteir");
  expect(screen.getByRole("link", { name: /The Skull Pub/ }).getAttribute("href")).toBe("#/cidade/the-skull-pub");
  cleanup();
  visit("/personagens/3");
  expect(screen.queryByRole("heading", { name: "Locais relacionados" })).toBeNull();
});
it("busca global preserva termo na URL e navega ao resultado", () => {
  visit("/busca?q=SchreckNet");
  expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("SchreckNet");
  fireEvent.click(screen.getByRole("link", { name: /0DOZ3/ }));
  expect(window.location.hash).toBe("#/personagens/3");
});
it("busca global trata pesquisa vazia e sem resultados", () => {
  visit("/busca");
  expect(screen.getByRole("status").textContent).toContain("Digite um termo");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzzinexistente" } });
  expect(window.location.hash).toContain("q=zzzzinexistente");
  expect(screen.getByText(/Nenhum resultado encontrado/)).toBeTruthy();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Alice" } });
  expect(screen.getByRole("heading", { name: /Locais/ })).toBeTruthy();
  expect(screen.getByRole("heading", { name: /NPCs/ })).toBeTruthy();
});

it("mantém o acervo disponível quando o diário não está configurado", () => {
  visit("/diario");
  expect(screen.getByRole("heading", { name: "Diário indisponível" })).toBeTruthy();
  fireEvent.click(screen.getByRole("link", { name: /Explorar Greenmond/ }));
  expect(screen.getByRole("heading", { name: "Greenmond." })).toBeTruthy();
});
