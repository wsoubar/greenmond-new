import { describe, expect, it } from "vitest";
import { findCharacter, matches, personagens, cidade, relatedPeople, relatedPlaces, searchContent } from "./content";
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

it("deriva os vínculos inversos sem criar relações por clã", () => {
  expect(relatedPlaces("personagem", "1").map((p) => p.href)).toEqual(["/cidade/sunset-garden"]);
  expect(relatedPlaces("npc", "norman-brown")[0].href).toBe("/cidade/palacio-das-aguas");
  expect(relatedPlaces("personagem", "3")).toEqual([]);
  expect(relatedPlaces("npc", "inexistente")).toEqual([]);
  for (const place of cidade) {
    for (const person of relatedPeople(place.id)) {
      const [type, id] = person.href.slice(1).split("/");
      expect(relatedPlaces(type === "npcs" ? "npc" : "personagem", id).some((p) => p.href === `/cidade/${place.id}`)).toBe(true);
    }
  }
});
it("busca nomes, clãs e histórias sem acentos e combina palavras", () => {
  expect(searchContent("  PANTANO  ").some((p) => p.href === "/cidade/o-pantano")).toBe(true);
  expect(searchContent("SchreckNet").some((p) => p.href === "/personagens/3")).toBe(true);
  expect(searchContent("ALICE BRUJAH").some((p) => p.href === "/npcs/alice-monteir")).toBe(true);
  expect(searchContent("alice ventrue")).toEqual([]);
  expect(searchContent("   ")).toEqual([]);
  expect(searchContent("zzzzinexistente")).toEqual([]);
});
