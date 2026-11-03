// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { personagens } from "./lib/content";
beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(cleanup);
function visit(path: string) {
  window.history.replaceState({}, "", path);
  render(<App />);
}
describe("navegação do cenário", () => {
  it("abre detalhe por URL direta e navega até a ficha", () => {
    const p = personagens[0];
    visit(`/personagens/${p.id}`);
    expect(screen.getByRole("heading", { name: p.nome })).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: /Consultar ficha/ }));
    expect(window.location.pathname).toBe(`/fichas/${p.id}`);
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
    expect(window.location.pathname).toBe("/npcs/lucius-wilber-smith");
    expect(screen.getByRole("heading", { name: "Lucius Wilber Smith" })).toBeTruthy();
    expect(screen.getByText(/colecionou mais inimigos/)).toBeTruthy();
  });
  it("abre Jason pelo Sunset Garden", () => {
    visit("/cidade/sunset-garden");
    fireEvent.click(screen.getByRole("link", { name: /Jason P. Adams/ }));
    expect(window.location.pathname).toBe("/personagens/1");
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
