import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

// PostgreSQL real em WASM. auth.uid() é simulado; não substitui teste do Auth remoto.
const db = new PGlite();
let checks = 0;
const playerA = "00000000-0000-0000-0000-000000000001";
const playerB = "00000000-0000-0000-0000-000000000002";
const narrator = "00000000-0000-0000-0000-000000000003";
const outsider = "00000000-0000-0000-0000-000000000004";
async function as(user = null) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    user ?? "",
  ]);
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
}
function equal(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  checks++;
}
async function denied(
  sql,
  params = [],
  pattern = /permission denied|GREENMOND_/,
) {
  await assert.rejects(db.query(sql, params), pattern);
  checks++;
}
async function save(entry = null, changes = {}) {
  const data = {
    kind: "session",
    title: "Uma noite em Greenmond",
    body: "O relato da sessão no Palácio.",
    character: null,
    ...changes,
  };
  return (
    await db.query(
      "select * from public.greenmond_save_diary($1,$2,$3,$4,$5,$6,$7)",
      [
        entry?.id ?? null,
        entry?.version ?? null,
        data.kind,
        data.title,
        data.body,
        "Sessão 1",
        data.character,
      ],
    )
  ).rows[0];
}
async function transition(entry, action, note = null) {
  return (
    await db.query(
      "select * from public.greenmond_transition_diary($1,$2,$3,$4)",
      [entry.id, entry.version, action, note],
    )
  ).rows[0];
}
async function count(table) {
  return Number(
    (await db.query(`select count(*) n from public.${table}`)).rows[0].n,
  );
}
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    insert into auth.users values ('${playerA}'),('${playerB}'),('${narrator}'),('${outsider}');
  `);
  await db.exec(
    readFileSync(
      new URL(
        "../supabase/migrations/202611030001_greenmond_diary.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`
    insert into public.greenmond_profiles values
      ('${playerA}','Jogador A','player',true),('${playerB}','Jogador B','player',true),('${narrator}','Narrador','narrator',true);
    insert into public.greenmond_character_assignments values ('${playerA}','1'),('${playerB}','2');
  `);
  await as(playerA);
  equal(await count("greenmond_profiles"), 1, "somente o próprio perfil");
  let entry = await save();
  equal(entry.author_id, playerA, "autor vem da sessão");
  equal(entry.status, "draft");
  await denied("update public.greenmond_profiles set role = $1", ["narrator"]);
  await denied(
    "insert into public.greenmond_character_assignments values ($1,$2)",
    [playerA, "2"],
  );
  await denied(
    "update public.greenmond_diary_entries set status = $1 where id = $2",
    ["published", entry.id],
  );
  await denied("delete from public.greenmond_diary_entries where id=$1", [
    entry.id,
  ]);
  await assert.rejects(
    save(null, { kind: "character", character: "2" }),
    /GREENMOND_CHARACTER/,
  );
  checks++;
  await assert.rejects(save(null, { title: "   " }), /GREENMOND_INVALID/);
  checks++;
  const characterEntry = await save(null, {
    kind: "character",
    character: "1",
  });
  equal(characterEntry.character_name, "Jason P. Adams");
  equal(await count("greenmond_diary_entries"), 2);
  await as(playerB);
  equal(
    await count("greenmond_diary_entries"),
    0,
    "outro jogador não vê rascunhos",
  );
  await assert.rejects(save(entry), /GREENMOND_FORBIDDEN/);
  checks++;
  await assert.rejects(transition(entry, "submit"), /GREENMOND_FORBIDDEN/);
  checks++;
  await as(outsider);
  equal(await count("greenmond_profiles"), 0);
  equal(await count("greenmond_diary_entries"), 0);
  await assert.rejects(save(), /GREENMOND_FORBIDDEN/);
  checks++;
  await as();
  equal(await count("greenmond_diary_entries"), 0, "anônimo não vê rascunhos");
  await denied("select * from public.greenmond_diary_reviews");
  await denied("select * from public.greenmond_profiles");
  await denied(
    "select * from public.greenmond_save_diary(null,null,$1,$2,$3,null,null)",
    ["session", "Invasão", "Texto"],
  );
  await as(playerA);
  const previous = entry;
  entry = await save(entry, { body: "Primeira atualização" });
  equal(entry.version, 2);
  await assert.rejects(save(previous), /GREENMOND_CONFLICT/);
  checks++;
  await assert.rejects(transition(entry, "publish"), /GREENMOND_FORBIDDEN/);
  checks++;
  entry = await transition(entry, "submit");
  equal(entry.status, "review");
  await assert.rejects(save(entry), /GREENMOND_FORBIDDEN/);
  checks++;
  await as(narrator);
  equal(await count("greenmond_diary_entries"), 2);
  await assert.rejects(
    transition(entry, "request_changes", " "),
    /GREENMOND_NOTE/,
  );
  checks++;
  entry = await transition(
    entry,
    "request_changes",
    "Observação privada: esclareça o encontro.",
  );
  equal(entry.status, "draft");
  await as(playerA);
  equal(await count("greenmond_diary_reviews"), 1);
  entry = await save(entry, {
    title: "PÂNTANO e máscaras",
    body: "Uma descrição da noite úmida.",
  });
  entry = await transition(entry, "submit");
  await as(narrator);
  entry = await transition(entry, "publish");
  equal(entry.status, "published");
  assert.ok(entry.published_at);
  checks++;
  await as();
  equal(await count("greenmond_diary_entries"), 1);
  const results = (
    await db.query("select * from public.greenmond_search_diary($1,0)", [
      "PANTANO MASCARAS",
    ])
  ).rows;
  equal(results.length, 1, "busca ignora caixa e acentos");
  equal(results[0].title, entry.title);
  equal(
    (
      await db.query("select * from public.greenmond_search_diary($1,0)", [
        "Observação privada",
      ])
    ).rows.length,
    0,
  );
  equal(
    (await db.query("select * from public.greenmond_search_diary($1,0)", [""]))
      .rows.length,
    0,
  );
  await as(playerB);
  equal(
    await count("greenmond_diary_reviews"),
    0,
    "publicação não expõe observações a outro jogador",
  );
  await assert.rejects(save(entry), /GREENMOND_FORBIDDEN/);
  checks++;
  await as(outsider);
  equal(
    await count("greenmond_diary_entries"),
    1,
    "conta externa só lê o público",
  );
  await assert.rejects(transition(entry, "archive"), /GREENMOND_FORBIDDEN/);
  checks++;
  await as(playerA);
  await assert.rejects(save(entry), /GREENMOND_FORBIDDEN/);
  checks++;
  await as(narrator);
  entry = await save(entry, { title: "Texto revisado pelo narrador" });
  equal(entry.author_id, playerA, "revisão preserva autoria");
  entry = await transition(entry, "archive");
  await as();
  equal(
    await count("greenmond_diary_entries"),
    0,
    "arquivado sai da leitura pública",
  );
  await as(playerA);
  equal(
    await count("greenmond_diary_entries"),
    2,
    "autor ainda pode ler arquivado",
  );
  await as(narrator);
  entry = await transition(entry, "restore");
  await as(playerA);
  await assert.rejects(save(entry), /GREENMOND_FORBIDDEN/);
  checks++;
  await assert.rejects(transition(entry, "submit"), /GREENMOND_FORBIDDEN/);
  checks++;
  await as(narrator);
  let arbitrary = await save(null, { kind: "character", character: "4" });
  equal(arbitrary.character_id, "4", "narrador pode usar qualquer personagem");
  arbitrary = await transition(arbitrary, "submit");
  await transition(arbitrary, "publish");
  // Paginação da busca pública, inclusive quando o chamador é narrador.
  for (let i = 0; i < 21; i++) {
    let pageEntry = await save(null, {
      title: `Registro de paginação ${i}`,
      body: "Conteúdo público para teste.",
    });
    pageEntry = await transition(pageEntry, "submit");
    await transition(pageEntry, "publish");
  }
  const firstPage = (
    await db.query("select * from public.greenmond_search_diary($1,0)", [
      "PAGINACAO",
    ])
  ).rows;
  const secondPage = (
    await db.query("select * from public.greenmond_search_diary($1,1)", [
      "PAGINACAO",
    ])
  ).rows;
  equal(firstPage.length, 20);
  equal(secondPage.length, 1);
  equal(Number(firstPage[0].total_count), 21);
  equal(
    firstPage.some((r) => r.id === secondPage[0].id),
    false,
  );
  equal(
    (await db.query("select * from public.greenmond_search_diary($1,0)", ["%"]))
      .rows.length,
    0,
    "percentual não é curinga",
  );
  // Retirar atribuição impede enviar rascunho antigo.
  await db.exec("reset role");
  await db.query(
    "delete from public.greenmond_character_assignments where user_id=$1",
    [playerA],
  );
  await as(playerA);
  await assert.rejects(
    transition(characterEntry, "submit"),
    /GREENMOND_CHARACTER/,
  );
  checks++;
  // Desativação é verificada no banco a cada chamada, mesmo com JWT ainda válido.
  await db.exec("reset role");
  await db.query(
    "update public.greenmond_profiles set active=false where user_id=$1",
    [playerA],
  );
  await as(playerA);
  equal(await count("greenmond_diary_reviews"), 0);
  await assert.rejects(save(), /GREENMOND_FORBIDDEN/);
  checks++;
  console.log(
    `Diário PostgreSQL: ${checks} verificações passaram (RLS, papéis, transições, concorrência, autoria e busca).`,
  );
} finally {
  await db.close();
}
