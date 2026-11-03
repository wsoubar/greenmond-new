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
