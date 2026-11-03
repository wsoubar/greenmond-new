import { describe, expect, it } from "vitest";
import { findCharacter, matches, personagens } from "./content";
describe("consultas do cenário", () => {
  it("busca ignora acentos, espaços externos e capitalização", () => {
    expect(matches("O Pântano", "  PANTANO ")).toBe(true);
    expect(matches("O Centro", "pântano")).toBe(false);
  });
  it("resolve IDs para acesso direto ao detalhe", () => {
    for (const character of personagens)
      expect(findCharacter(character.id)?.nome).toBe(character.nome);
    expect(findCharacter("inexistente")).toBeUndefined();
  });
});
