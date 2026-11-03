import { describe, expect, it } from "vitest";
import { findCharacter, matches, personagens, cidade, relatedPeople } from "./content";
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

it("resolve todos os vínculos para registros existentes", () => {
  const people = cidade.flatMap((place) => relatedPeople(place.id));
  expect(people).toHaveLength(8);
  expect(relatedPeople("inexistente")).toEqual([]);
  for (const person of people) expect(person.name.length).toBeGreaterThan(0);
});
