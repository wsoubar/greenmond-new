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

export function relatedPlaces(type: "personagem" | "npc", id: string) {
  return Object.entries(relacoesLocais).flatMap(([placeId, relations]) => {
    const relation = relations.find((r) => r.tipo === type && r.id === id);
    if (!relation) return [];
    const place = cidade.find((p) => p.id === placeId);
    if (!place) throw new Error(`Local relacionado inexistente: ${placeId}`);
    return [{ title: place.title, href: `/cidade/${place.id}`, role: relation.vinculo }];
  });
}

const searchEntries = [
  ...cidade.map((p) => ({ title: p.title, category: "Locais", href: `/cidade/${p.id}`, text: p.blocks.filter((b) => b.type === "text").map((b) => b.value).join(" ") })),
  ...personagens.map((p) => ({ title: p.nome, category: "Personagens", href: `/personagens/${p.id}`, text: `${p.cla} · ${p.jogador} · ${p.apelido}. ${p.historia}` })),
  ...npcs.flatMap((g) => g.people.map((p) => ({ title: p.name, category: "NPCs", href: `/npcs/${p.id}`, text: `${g.title}. ${p.description}` }))),
];
export function searchContent(query: string) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return searchEntries.filter((entry) => {
    const text = normalize(`${entry.title} ${entry.text}`);
    return terms.every((term) => text.includes(term));
  }).map((entry) => {
    const text = entry.text.replace(/\s+/g, " ");
    const matchIndex = normalize(text).indexOf(terms[0]);
    const start = Math.max(0, matchIndex - 50);
    return { ...entry, excerpt: `${start ? "…" : ""}${text.slice(start, start + 220)}${text.length > start + 220 ? "…" : ""}` };
  });
}
