import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
const read = (name) =>
  JSON.parse(readFileSync(`src/data/${name}.json`, "utf8"));
const chars = read("personagens");
for (const name of ["cidade", "criacao", "npcs", "personagens"]) {
  const data = read(name);
  assert.equal(
    new Set(data.map((x) => x.id)).size,
    data.length,
    `IDs duplicados: ${name}`,
  );
  assert.ok(data.length);
}
function inspect(value) {
  if (Array.isArray(value)) return value.forEach(inspect);
  if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      assert.ok(
        !/^(senha|password)$/i.test(key),
        "Credencial nos dados migrados",
      );
      if (
        key === "image" ||
        key === "claImage" ||
        (value.type === "image" && key === "value")
      )
        assert.ok(existsSync(`public/${v}`), `Imagem ausente: ${v}`);
      inspect(v);
    }
  }
}
for (const file of readdirSync("src/data"))
  inspect(JSON.parse(readFileSync(`src/data/${file}`, "utf8")));
for (const sheet of read("fichas")) {
  assert.ok(chars.some((p) => p.id === sheet.personagemId));
  assert.ok(sheet.text.trim());
}
assert.equal(
  chars.length,
  JSON.parse(
    readFileSync("old-versions/greenmond/www/personagens.json", "utf8"),
  ).length,
);
console.log(
  `Dados válidos: ${chars.length} personagens, ${read("cidade").length} locais, ${read("npcs").flatMap((g) => g.people).length} NPCs e ${read("fichas").length} fichas.`,
);
const { createHash } = await import("node:crypto");
const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
for (const folder of ["cidade", "clanlogos"])
  for (const file of readdirSync(`old-versions/greenmond/www/img/${folder}`))
    assert.equal(
      hash(`old-versions/greenmond/www/img/${folder}/${file}`),
      hash(`public/images/${folder}/${file}`),
      `Imagem alterada: ${file}`,
    );
assert.equal(
  hash("old-versions/greenmond/www/img/ionic.png"),
  hash("public/images/ionic.png"),
);
console.log("33 imagens conferidas por SHA-256.");
