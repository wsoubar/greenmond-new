import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
const narrator = "00000000-0000-0000-0000-000000000001";
const player = "00000000-0000-0000-0000-000000000002";
async function as(role, user = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec(`set role ${role}`);
}
const receive =
  "select public.greenmond_receive_contact('Nome','contato','Assunto','Mensagem',$1) id";
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated;
    alter default privileges in schema public grant execute on functions to anon,authenticated;
    insert into auth.users values ('${narrator}'),('${player}');`);
  for (const path of [
    "202611030001_greenmond_diary.sql",
    "20261116215956_greenmond_contacts.sql",
  ])
    await db.exec(
      readFileSync(
        new URL(`../supabase/migrations/${path}`, import.meta.url),
        "utf8",
      ),
    );
  await db.exec(
    `insert into public.greenmond_profiles values ('${narrator}','Narrador','narrator',true),('${player}','Jogador','player',true)`,
  );
  await as("service_role");
  const hash = "a".repeat(64);
  const {
    rows: [{ id }],
  } = await db.query(receive, [hash]);
  for (let i = 0; i < 4; i++) await db.query(receive, [hash]);
  await assert.rejects(db.query(receive, [hash]), /GREENMOND_CONTACT_LIMIT/);
  assert.equal(
    Number(
      (await db.query("select count(*) n from public.greenmond_contacts"))
        .rows[0].n,
    ),
    5,
  );
  await db.query(
    "update public.greenmond_contact_limits set window_start = now() - interval '61 minutes'",
  );
  await db.query(receive, [hash]);
  await assert.rejects(
    db.query(receive, ["invalid"]),
    /GREENMOND_CONTACT_INVALID/,
  );
  for (const [role, user] of [
    ["anon", ""],
    ["authenticated", player],
  ]) {
    await as(role, user);
    await assert.rejects(db.query(receive, [hash]), /permission denied/);
    await assert.rejects(
      db.query(
        "insert into public.greenmond_contacts(name,contact,subject,message) values ('N','C','S','M')",
      ),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from public.greenmond_contact_limits"),
      /permission denied/,
    );
    if (role === "anon")
      await assert.rejects(
        db.query("select * from public.greenmond_contacts"),
        /permission denied/,
      );
    else {
      assert.equal(
        (await db.query("select * from public.greenmond_contacts")).rows.length,
        0,
      );
      assert.equal(
        (
          await db.query(
            "update public.greenmond_contacts set status = 'resolvida' returning id",
          )
        ).rows.length,
        0,
      );
    }
  }
  await as("service_role");
  const submissionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const insert =
    "insert into public.greenmond_contacts(id,name,contact,subject,message) values ($1,'Visitante','Contato','Turnstile','Mensagem')";
  await db.query(insert, [submissionId]);
  await assert.rejects(db.query(insert, [submissionId]), /duplicate key/);
  await as("authenticated", narrator);
  assert.equal(
    (await db.query("select * from public.greenmond_contacts")).rows.length,
    7,
  );
  for (const status of ["lida", "resolvida", "nova"])
    assert.equal(
      (
        await db.query(
          "update public.greenmond_contacts set status = $1 where id = $2 returning status",
          [status, id],
        )
      ).rows[0].status,
      status,
    );
  await assert.rejects(
    db.query("update public.greenmond_contacts set message = 'alterada'"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("delete from public.greenmond_contacts"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("update public.greenmond_contacts set status = 'published'"),
    /check constraint/,
  );
  await as("postgres");
  await db.query(
    "update public.greenmond_profiles set active = false where user_id = $1",
    [narrator],
  );
  await as("authenticated", narrator);
  assert.equal(
    (await db.query("select * from public.greenmond_contacts")).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query(
        "update public.greenmond_contacts set status = 'lida' returning id",
      )
    ).rows.length,
    0,
  );
  console.log(
    "Contatos: permissões, estados, limite persistente e renovação da janela validados em PostgreSQL/PGlite.",
  );
} finally {
  await db.close();
}
