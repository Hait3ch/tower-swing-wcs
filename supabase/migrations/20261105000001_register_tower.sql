-- Public Tower Swing registration. Runs as definer so anonymous visitors can
-- register without being able to read anyone's registration. The active event
-- row is locked so two people can't both take the last spot.
create or replace function public.register_tower(p jsonb)
returns public.tower_registrations
language plpgsql security definer set search_path = public as $$
declare
  ev public.tower_events;
  taken integer;
  reg public.tower_registrations;
  status text;
begin
  select * into ev from public.tower_events where is_active for update;
  if not found then
    raise exception 'no_active_event' using errcode = 'P0001';
  end if;
  if not ev.registration_open then
    raise exception 'registration_closed' using errcode = 'P0001';
  end if;

  select count(*) into taken from public.tower_registrations
    where event_id = ev.id and payment_status not in ('cancelled', 'waiting');
  status := case when ev.waiting_list_enabled and taken >= ev.max_capacity then 'waiting' else 'pending' end;

  begin
    insert into public.tower_registrations
      (first_name, last_name, email, phone, experience, dietary_restrictions, notes,
       payment_status, event_id, event_year, event_date, price)
    values
      (btrim(p ->> 'first_name'), btrim(p ->> 'last_name'), lower(btrim(p ->> 'email')), btrim(p ->> 'phone'),
       p ->> 'experience', nullif(btrim(p ->> 'dietary_restrictions'), ''), nullif(btrim(p ->> 'notes'), ''),
       status, ev.id, ev.year, ev.date, ev.price)
    returning * into reg;
  exception when unique_violation then
    raise exception 'duplicate_email' using errcode = 'P0001';
  end;
  return reg;
end $$;

revoke execute on function public.register_tower(jsonb) from public;
grant execute on function public.register_tower(jsonb) to anon, authenticated, service_role;
