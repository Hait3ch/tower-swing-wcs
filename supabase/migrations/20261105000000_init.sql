-- Partner queue + Tower Swing schema.
-- Every table has RLS enabled; anon can never write.

create extension if not exists citext;

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- admins
create table public.admins (
  email citext primary key
);
alter table public.admins enable row level security;
-- no policies: only security-definer functions read it.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email')::citext)
$$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 60),
  phone text check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create policy "signed-in users read profiles" on public.profiles
  for select to authenticated using (true);
create policy "users create own profile" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "users update own profile" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- dance events
create table public.dance_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (length(btrim(name)) between 1 and 150),
  url text,
  event_type text,
  location text,
  country_code char(3),
  start_date date not null,
  end_date date not null,
  source text not null check (source in ('wsdc', 'user')),
  wsdc_key text unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index dance_events_dates on public.dance_events (end_date, start_date);
alter table public.dance_events enable row level security;
create trigger dance_events_updated_at before update on public.dance_events
  for each row execute function public.set_updated_at();

create policy "everyone reads events" on public.dance_events
  for select using (true);
create policy "signed-in users add community events" on public.dance_events
  for insert to authenticated with check (source = 'user' and created_by = auth.uid());
create policy "admins update events" on public.dance_events
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete events" on public.dance_events
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- partner entries
create table public.partner_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dance_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('leader', 'follower')),
  note text check (note is null or length(note) <= 200),
  status text not null default 'looking' check (status in ('looking', 'matched', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index partner_entries_one_active
  on public.partner_entries (event_id, user_id) where status = 'looking';
create index partner_entries_queue on public.partner_entries (event_id, role, created_at, id)
  where status = 'looking';
alter table public.partner_entries enable row level security;
create trigger partner_entries_updated_at before update on public.partner_entries
  for each row execute function public.set_updated_at();

-- Queue fairness: nobody may choose their own join time, and a closed entry
-- (matched / withdrawn) cannot be reopened to reclaim its old place.
revoke insert, update on public.partner_entries from anon, authenticated;
grant insert (event_id, user_id, role, note) on public.partner_entries to authenticated;
grant update (note, status) on public.partner_entries to authenticated;

create or replace function public.partner_entries_no_reopen() returns trigger
language plpgsql as $$
begin
  if old.status <> 'looking' and new.status = 'looking' then
    raise exception 'entry_closed' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger partner_entries_no_reopen before update on public.partner_entries
  for each row execute function public.partner_entries_no_reopen();

create policy "everyone reads entries" on public.partner_entries
  for select using (true);
create policy "users join as themselves" on public.partner_entries
  for insert to authenticated with check (user_id = auth.uid() and status = 'looking');
create policy "users update own entries" on public.partner_entries
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users or admins delete entries" on public.partner_entries
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Public queue: deliberately a definer view (not security_invoker) so anonymous
-- visitors see display names without being able to read profiles (phones).
create view public.partner_queue as
  select e.id, e.event_id, e.user_id, e.role, e.note, e.created_at, p.display_name
  from public.partner_entries e
  join public.profiles p on p.user_id = e.user_id
  where e.status = 'looking';
grant select on public.partner_queue to anon, authenticated;

create view public.event_queue_counts as
  select event_id,
         count(*) filter (where role = 'leader')::int as leaders,
         count(*) filter (where role = 'follower')::int as followers
  from public.partner_entries
  where status = 'looking'
  group by event_id;
grant select on public.event_queue_counts to anon, authenticated;

-- Events (and their entries, via cascade) disappear 30 days after they end.
create or replace function public.purge_old_events() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.dance_events where end_date < current_date - 30;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.purge_old_events() from public, anon, authenticated;
grant execute on function public.purge_old_events() to service_role;

-- ---------------------------------------------------------------- Tower Swing
create table public.tower_events (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year >= 2020),
  name text not null check (length(name) <= 100),
  date timestamptz not null,
  max_capacity integer not null check (max_capacity >= 1),
  is_active boolean not null default false,
  registration_open boolean not null default true,
  waiting_list_enabled boolean not null default true,
  price numeric(10, 2) not null check (price >= 0),
  venue text not null check (length(venue) <= 200),
  address text not null check (length(address) <= 200),
  description text check (description is null or length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, name)
);
create unique index tower_events_one_active on public.tower_events (is_active) where is_active;
alter table public.tower_events enable row level security;
create trigger tower_events_updated_at before update on public.tower_events
  for each row execute function public.set_updated_at();

create policy "everyone reads tower events" on public.tower_events
  for select using (true);
create policy "admins manage tower events" on public.tower_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.tower_registrations (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(first_name) <= 50),
  last_name text not null check (length(last_name) <= 50),
  email citext not null unique,
  phone text not null,
  experience text not null check (experience in ('beginner', 'intermediate', 'advanced')),
  dietary_restrictions text check (dietary_restrictions is null or length(dietary_restrictions) <= 200),
  emergency_contact jsonb,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'cancelled', 'waiting')),
  event_id uuid references public.tower_events (id) on delete set null,
  event_year integer,
  registration_date timestamptz not null default now(),
  event_date timestamptz not null,
  price numeric(10, 2) not null check (price >= 0),
  notes text check (notes is null or length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tower_registrations_date on public.tower_registrations (registration_date desc);
create index tower_registrations_status on public.tower_registrations (payment_status);
alter table public.tower_registrations enable row level security;
create trigger tower_registrations_updated_at before update on public.tower_registrations
  for each row execute function public.set_updated_at();

create policy "admins manage tower registrations" on public.tower_registrations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
