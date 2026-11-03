import relacoesLocais from "../data/relacoes-locais.json";
import cidade from "../data/cidade.json";
import criacao from "../data/criacao.json";
import npcs from "../data/npcs.json";
import personagens from "../data/personagens.json";
import fichas from "../data/fichas.json";
export { cidade, criacao, npcs, personagens, fichas };
export type Section = (typeof cidade)[number];
export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}
export function matches(text: string, query: string) {
  return normalize(text).includes(normalize(query.trim()));
}
export function findCharacter(id: string | undefined) {
  return personagens.find((p) => p.id === id);
}
export function asset(path: string) {
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}

export function relatedPeople(placeId: string) {
  const relations = (relacoesLocais as Record<string, { tipo: string; id: string; vinculo: string }[]>)[placeId] ?? [];
  return relations.map((relation) => {
    if (relation.tipo === "personagem") {
      const person = findCharacter(relation.id);
      if (!person) throw new Error(`Personagem relacionado inexistente: ${relation.id}`);
      return { name: person.nome, clan: person.cla, href: `/personagens/${person.id}`, role: relation.vinculo };
    }
    const group = npcs.find((g) => g.people.some((p) => p.id === relation.id));
    const person = group?.people.find((p) => p.id === relation.id);
    if (!person || !group) throw new Error(`NPC relacionado inexistente: ${relation.id}`);
    return { name: person.name, clan: group.title, href: `/npcs/${person.id}`, role: relation.vinculo };
  });
}
