begin;
create table public.greenmond_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  contact text not null check (char_length(btrim(contact)) between 1 and 200),
  subject text not null check (char_length(btrim(subject)) between 1 and 150),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  status text not null default 'nova' check (status in ('nova','lida','resolvida')),
  created_at timestamptz not null default now()
);
create index greenmond_contacts_order on public.greenmond_contacts(created_at desc, id);
create index greenmond_contacts_new on public.greenmond_contacts(status) where status = 'nova';
create table public.greenmond_contact_limits (
  origin_hash text primary key check (origin_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  attempts integer not null check (attempts between 1 and 5)
);
alter table public.greenmond_contacts enable row level security;
alter table public.greenmond_contact_limits enable row level security;
revoke all on public.greenmond_contacts, public.greenmond_contact_limits from public, anon, authenticated;
grant select, update(status) on public.greenmond_contacts to authenticated;
create policy greenmond_contact_read on public.greenmond_contacts for select to authenticated using (public.greenmond_is_narrator());
create policy greenmond_contact_update on public.greenmond_contacts for update to authenticated using (public.greenmond_is_narrator()) with check (public.greenmond_is_narrator());
grant select, insert on public.greenmond_contacts to service_role;
grant select, insert, update on public.greenmond_contact_limits to service_role;
-- Somente o servidor pode executar esta função; SECURITY INVOKER preserva os privilégios do chamador.
create function public.greenmond_receive_contact(p_name text, p_contact text, p_subject text, p_message text, p_origin_hash text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare result uuid; used integer;
begin
  if p_origin_hash is null or p_origin_hash !~ '^[0-9a-f]{64}$' then raise exception 'GREENMOND_CONTACT_INVALID'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_origin_hash, 0));
  insert into public.greenmond_contact_limits(origin_hash, window_start, attempts)
    values (p_origin_hash, now(), 1)
    on conflict (origin_hash) do update set
      window_start = case when greenmond_contact_limits.window_start <= now() - interval '1 hour' then now() else greenmond_contact_limits.window_start end,
      attempts = case when greenmond_contact_limits.window_start <= now() - interval '1 hour' then 1 else greenmond_contact_limits.attempts + 1 end
    where greenmond_contact_limits.window_start <= now() - interval '1 hour' or greenmond_contact_limits.attempts < 5
    returning attempts into used;
  if used is null then raise exception 'GREENMOND_CONTACT_LIMIT'; end if;
  insert into public.greenmond_contacts(name, contact, subject, message)
    values (btrim(p_name), btrim(p_contact), btrim(p_subject), btrim(p_message)) returning id into result;
  return result;
end $$;
revoke all on function public.greenmond_receive_contact(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.greenmond_receive_contact(text,text,text,text,text) to service_role;
commit;
