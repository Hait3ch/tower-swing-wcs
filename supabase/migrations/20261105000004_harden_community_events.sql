-- Community-added events: users may only set the fields the form offers,
-- only for events that are not over, and values must be safe to render.
alter table public.dance_events
  add constraint dance_events_url_http check (url is null or url ~* '^https?://[^\s]+$'),
  add constraint dance_events_slug_safe check (slug ~ '^[a-z0-9-]{1,120}$'),
  add constraint dance_events_location_len check (location is null or length(location) <= 150),
  add constraint dance_events_event_type_len check (event_type is null or length(event_type) <= 50);

revoke insert on public.dance_events from anon, authenticated;
grant insert (slug, name, url, location, country_code, start_date, end_date, source, created_by)
  on public.dance_events to authenticated;

drop policy "signed-in users add community events" on public.dance_events;
create policy "signed-in users add community events" on public.dance_events
  for insert to authenticated
  with check (source = 'user' and created_by = auth.uid() and wsdc_key is null and end_date >= current_date);

-- Queues of events that are over are closed.
drop policy "users join as themselves" on public.partner_entries;
create policy "users join as themselves" on public.partner_entries
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'looking'
    and exists (select 1 from public.dance_events d where d.id = event_id and d.end_date >= current_date)
  );
