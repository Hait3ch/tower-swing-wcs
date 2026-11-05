begin;
select plan(8);
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c1', 'ce-user@test.invalid');
insert into public.profiles (user_id, display_name) values ('00000000-0000-0000-0000-0000000000c1', 'Cee');
insert into public.dance_events (id, slug, name, start_date, end_date, source) values
  ('50000000-0000-0000-0000-000000000001', 'ce-past', 'Past', current_date - 10, current_date - 8, 'user');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","email":"ce-user@test.invalid","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.dance_events (slug, name, url, start_date, end_date, source, created_by)
     values ('ce-ok-2027-01-01', 'OK', 'https://ok.example.com', current_date + 5, current_date + 6, 'user', auth.uid()) $$,
  'a valid community event can be added');
select throws_ok(
  $$ insert into public.dance_events (slug, name, start_date, end_date, source, created_by, wsdc_key)
     values ('ce-a', 'A', current_date + 5, current_date + 6, 'user', auth.uid(), 'winter-coast-swing-2027') $$,
  '42501', null, 'users cannot claim a WSDC key');
select throws_ok(
  $$ insert into public.dance_events (slug, name, url, start_date, end_date, source, created_by)
     values ('ce-b', 'B', 'javascript:alert(1)', current_date + 5, current_date + 6, 'user', auth.uid()) $$,
  '23514', null, 'non-http urls are rejected');
select throws_ok(
  $$ insert into public.dance_events (slug, name, start_date, end_date, source, created_by)
     values ('x/../evil', 'C', current_date + 5, current_date + 6, 'user', auth.uid()) $$,
  '23514', null, 'slugs must be url-safe');
select throws_ok(
  $$ insert into public.dance_events (slug, name, start_date, end_date, source, created_by)
     values ('ce-d', 'D', current_date - 5, current_date - 4, 'user', auth.uid()) $$,
  '42501', null, 'users cannot add events that are over');
select throws_ok(
  $$ insert into public.dance_events (slug, name, start_date, end_date, source, created_by, created_at)
     values ('ce-e', 'E', current_date + 5, current_date + 6, 'user', auth.uid(), '1999-01-01') $$,
  '42501', null, 'users cannot set created_at');
select throws_ok(
  $$ insert into public.dance_events (slug, name, location, start_date, end_date, source, created_by)
     values ('ce-f', 'F', repeat('x', 500), current_date + 5, current_date + 6, 'user', auth.uid()) $$,
  '23514', null, 'location length is limited');
select throws_ok(
  $$ insert into public.partner_entries (event_id, user_id, role)
     values ('50000000-0000-0000-0000-000000000001', auth.uid(), 'leader') $$,
  '42501', null, 'cannot join the queue of an event that is over');
select * from finish();
rollback;
