-- Executar uma vez no projeto Supabase. Não altera objetos dos outros aplicativos.
begin;
create table public.greenmond_profiles (
  user_id uuid primary key references auth.users(id),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  role text not null check (role in ('player', 'narrator')),
  active boolean not null default true
);
create table public.greenmond_characters (
  id text primary key,
  name text not null
);
insert into public.greenmond_characters (id, name) values
 ('1','Jason P. Adams'), ('2','Hannibal Trautmam'), ('3','0DOZ3'), ('4','Nicholai Itchenko');
create table public.greenmond_character_assignments (
  user_id uuid references public.greenmond_profiles(user_id),
  character_id text references public.greenmond_characters(id),
  primary key(user_id, character_id)
);
create table public.greenmond_diary_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.greenmond_profiles(user_id),
  author_name text not null,
  kind text not null check (kind in ('character', 'session')),
  character_id text references public.greenmond_characters(id),
  character_name text,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  body text not null check (char_length(btrim(body)) between 1 and 50000),
  session_ref text check (char_length(session_ref) <= 120),
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint greenmond_diary_character_required check (
    (kind = 'character' and character_id is not null and character_name is not null)
    or (kind = 'session' and character_id is null and character_name is null)
  ),
  constraint greenmond_diary_publication_date check (status <> 'published' or published_at is not null)
);
create index greenmond_diary_public_order on public.greenmond_diary_entries(published_at desc, id) where status = 'published';
create index greenmond_diary_author on public.greenmond_diary_entries(author_id, updated_at desc);
create table public.greenmond_diary_reviews (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.greenmond_diary_entries(id),
  reviewer_id uuid not null references public.greenmond_profiles(user_id),
  note text not null check (char_length(btrim(note)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index greenmond_reviews_entry on public.greenmond_diary_reviews(entry_id, created_at desc);

create function public.greenmond_is_narrator() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.greenmond_profiles where user_id = auth.uid() and active and role = 'narrator');
$$;
create function public.greenmond_is_member() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.greenmond_profiles where user_id = auth.uid() and active);
$$;
revoke all on function public.greenmond_is_narrator() from public, anon, authenticated;
revoke all on function public.greenmond_is_member() from public, anon, authenticated;
grant execute on function public.greenmond_is_narrator(), public.greenmond_is_member() to anon, authenticated;

alter table public.greenmond_profiles enable row level security;
alter table public.greenmond_characters enable row level security;
alter table public.greenmond_character_assignments enable row level security;
alter table public.greenmond_diary_entries enable row level security;
alter table public.greenmond_diary_reviews enable row level security;
create policy greenmond_profile_read on public.greenmond_profiles for select to authenticated
 using ((user_id = auth.uid() and active) or public.greenmond_is_narrator());
create policy greenmond_characters_read on public.greenmond_characters for select to authenticated
 using (public.greenmond_is_member());
create policy greenmond_assignments_read on public.greenmond_character_assignments for select to authenticated
 using (public.greenmond_is_member() and (user_id = auth.uid() or public.greenmond_is_narrator()));
create policy greenmond_entries_read on public.greenmond_diary_entries for select to anon, authenticated
 using (status = 'published' or (public.greenmond_is_member() and (author_id = auth.uid() or public.greenmond_is_narrator())));
create policy greenmond_reviews_read on public.greenmond_diary_reviews for select to authenticated
 using (public.greenmond_is_member() and exists(select 1 from public.greenmond_diary_entries e
   where e.id = entry_id and (e.author_id = auth.uid() or public.greenmond_is_narrator())));
-- Gravação é permitida apenas pelas funções abaixo, não por INSERT/UPDATE via REST.
revoke all on public.greenmond_profiles, public.greenmond_characters, public.greenmond_character_assignments,
 public.greenmond_diary_entries, public.greenmond_diary_reviews from public, anon, authenticated;
grant select on public.greenmond_diary_entries to anon, authenticated;
grant select on public.greenmond_profiles, public.greenmond_characters, public.greenmond_character_assignments,
 public.greenmond_diary_reviews to authenticated;

create function public.greenmond_save_diary(
 p_id uuid, p_version integer, p_kind text, p_title text, p_body text,
 p_session_ref text, p_character_id text
) returns public.greenmond_diary_entries
language plpgsql security definer set search_path = '' as $$
declare
 actor public.greenmond_profiles;
 entry public.greenmond_diary_entries;
 character_label text;
begin
 select * into actor from public.greenmond_profiles where user_id = auth.uid() and active;
 if actor.user_id is null then raise exception 'GREENMOND_FORBIDDEN'; end if;
 if p_kind not in ('character','session') or p_kind is null then raise exception 'GREENMOND_INVALID'; end if;
 if char_length(btrim(p_title)) not between 1 and 180 or p_title is null
   or char_length(btrim(p_body)) not between 1 and 50000 or p_body is null
   or char_length(coalesce(p_session_ref,'')) > 120 then raise exception 'GREENMOND_INVALID'; end if;
 if p_kind = 'character' then
   select name into character_label from public.greenmond_characters where id = p_character_id;
   if character_label is null then raise exception 'GREENMOND_CHARACTER'; end if;
   if actor.role <> 'narrator' and not exists(select 1 from public.greenmond_character_assignments
     where user_id = actor.user_id and character_id = p_character_id) then raise exception 'GREENMOND_CHARACTER'; end if;
 elsif p_character_id is not null then raise exception 'GREENMOND_INVALID'; end if;
 if p_id is null then
   insert into public.greenmond_diary_entries(author_id, author_name, kind, character_id, character_name, title, body, session_ref)
   values(actor.user_id, actor.display_name, p_kind, p_character_id, character_label, btrim(p_title), btrim(p_body), nullif(btrim(p_session_ref),''))
   returning * into entry;
 else
   select * into entry from public.greenmond_diary_entries where id = p_id for update;
   if entry.id is null then raise exception 'GREENMOND_NOT_FOUND'; end if;
   if actor.role <> 'narrator' and (entry.author_id <> actor.user_id or entry.status <> 'draft' or entry.published_at is not null)
     then raise exception 'GREENMOND_FORBIDDEN'; end if;
   if entry.status = 'archived' then raise exception 'GREENMOND_TRANSITION'; end if;
   if p_version is distinct from entry.version then raise exception 'GREENMOND_CONFLICT'; end if;
   update public.greenmond_diary_entries set kind = p_kind, title = btrim(p_title), body = btrim(p_body),
    session_ref = nullif(btrim(p_session_ref),''), character_id = p_character_id, character_name = character_label,
    version = version + 1, updated_at = now() where id = p_id returning * into entry;
 end if;
 return entry;
end;
$$;
create function public.greenmond_transition_diary(p_id uuid, p_version integer, p_action text, p_note text default null)
returns public.greenmond_diary_entries
language plpgsql security definer set search_path = '' as $$
declare
 actor public.greenmond_profiles;
 entry public.greenmond_diary_entries;
 next_status text;
begin
 select * into actor from public.greenmond_profiles where user_id = auth.uid() and active;
 if actor.user_id is null then raise exception 'GREENMOND_FORBIDDEN'; end if;
 select * into entry from public.greenmond_diary_entries where id = p_id for update;
 if entry.id is null then raise exception 'GREENMOND_NOT_FOUND'; end if;
 if actor.role <> 'narrator' and (entry.author_id <> actor.user_id or p_action <> 'submit' or entry.published_at is not null)
   then raise exception 'GREENMOND_FORBIDDEN'; end if;
 if p_version is distinct from entry.version then raise exception 'GREENMOND_CONFLICT'; end if;
 if p_action = 'submit' and entry.status = 'draft' then
   if entry.kind = 'character' and actor.role <> 'narrator' and not exists(select 1 from public.greenmond_character_assignments
      where user_id = actor.user_id and character_id = entry.character_id) then raise exception 'GREENMOND_CHARACTER'; end if;
   next_status := 'review';
 elsif p_action = 'publish' and actor.role = 'narrator' and entry.status = 'review' then next_status := 'published';
 elsif p_action = 'request_changes' and actor.role = 'narrator' and entry.status = 'review' then
   if p_note is null or char_length(btrim(p_note)) not between 1 and 2000 then raise exception 'GREENMOND_NOTE'; end if;
   insert into public.greenmond_diary_reviews(entry_id, reviewer_id, note) values(entry.id, actor.user_id, btrim(p_note));
   next_status := 'draft';
 elsif p_action = 'archive' and actor.role = 'narrator' and entry.status = 'published' then next_status := 'archived';
 elsif p_action = 'restore' and actor.role = 'narrator' and entry.status = 'archived' then next_status := 'draft';
 else raise exception 'GREENMOND_TRANSITION'; end if;
 update public.greenmond_diary_entries set status = next_status, version = version + 1, updated_at = now(),
   published_at = case when next_status = 'published' then now() else published_at end
 where id = entry.id returning * into entry;
 return entry;
end;
$$;
revoke all on function public.greenmond_save_diary(uuid,integer,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.greenmond_transition_diary(uuid,integer,text,text) from public, anon, authenticated;
grant execute on function public.greenmond_save_diary(uuid,integer,text,text,text,text,text),
 public.greenmond_transition_diary(uuid,integer,text,text) to authenticated;

-- Busca somente publicações, mesmo para narradores; texto simples, termos combinados.
create function public.greenmond_search_diary(p_query text, p_page integer default 0)
returns table(id uuid, title text, body text, kind text, author_name text, character_name text, published_at timestamptz, total_count bigint)
language sql stable security invoker set search_path = '' as $$
 select e.id, e.title, left(e.body,220), e.kind, e.author_name, e.character_name, e.published_at, count(*) over()
 from public.greenmond_diary_entries e
 where e.status = 'published' and char_length(btrim(p_query)) between 1 and 200
 and not exists (
  select 1 from regexp_split_to_table(lower(translate(btrim(p_query), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')), '\s+') term
  where position(term in lower(translate(concat_ws(' ',e.title,e.body,e.author_name,e.character_name,e.session_ref),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))) = 0
 )
 order by e.published_at desc, e.id limit 20 offset greatest(0,least(coalesce(p_page,0),10000))*20;
$$;
revoke all on function public.greenmond_search_diary(text,integer) from public, anon, authenticated;
grant execute on function public.greenmond_search_diary(text,integer) to anon, authenticated;
commit;
