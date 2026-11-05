-- Switch the active Tower Swing event atomically (only one may be active).
-- Runs as the caller, so tower_events RLS still requires an admin.
create or replace function public.activate_tower_event(event_id uuid) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.tower_events set is_active = false where is_active and id <> event_id;
  update public.tower_events set is_active = true where id = event_id;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
end $$;
revoke execute on function public.activate_tower_event(uuid) from public, anon;
grant execute on function public.activate_tower_event(uuid) to authenticated;
