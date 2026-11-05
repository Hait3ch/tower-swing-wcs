begin;
select plan(17);

-- ---------- fixtures (as postgres, bypassing RLS) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.invalid'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@test.invalid'),
  ('00000000-0000-0000-0000-0000000000ad', 'rls-admin@test.invalid');
insert into public.admins (email) values ('rls-admin@test.invalid');
insert into public.profiles (user_id, display_name, phone) values
  ('00000000-0000-0000-0000-00000000000a', 'Alice', '+358401111111'),
  ('00000000-0000-0000-0000-00000000000b', 'Bob', '+358402222222');

insert into public.dance_events (id, slug, name, start_date, end_date, source, country_code) values
  ('10000000-0000-0000-0000-000000000001', 'future-fest-2027', 'Future Fest', current_date + 30, current_date + 32, 'wsdc', 'FIN'),
  ('10000000-0000-0000-0000-000000000002', 'old-31', 'Old 31', current_date - 33, current_date - 31, 'wsdc', 'FIN'),
  ('10000000-0000-0000-0000-000000000003', 'old-29', 'Old 29', current_date - 31, current_date - 29, 'wsdc', 'FIN');

insert into public.partner_entries (id, event_id, user_id, role) values
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'follower'),
  ('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'follower'),
  ('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000b', 'follower');

-- ---------- anonymous visitor ----------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select isnt_empty($$ select 1 from public.dance_events $$, 'anon can read events');
select results_eq(
  $$ select display_name from public.partner_queue where event_id = '10000000-0000-0000-0000-000000000001' $$,
  $$ values ('Bob'::text) $$,
  'anon sees queue names via partner_queue');
select is_empty($$ select 1 from public.profiles $$, 'anon cannot read profiles (phones)');
select throws_ok(
  $$ insert into public.dance_events (slug, name, start_date, end_date, source) values ('x', 'X', current_date, current_date, 'user') $$,
  '42501', null, 'anon cannot add events');
select is_empty($$ select 1 from public.tower_registrations $$, 'anon cannot read tower registrations');

-- ---------- user A ----------
reset role;
insert into public.tower_registrations (first_name, last_name, email, phone, experience, event_date, price)
  values ('T', 'T', 't@test.invalid', '1', 'beginner', now(), 0);
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","email":"rls-a@test.invalid","role":"authenticated"}', true);

select is_empty($$ select 1 from public.tower_registrations $$, 'non-admin cannot read tower registrations');
select is_empty(
  $$ update public.partner_entries set note = 'hacked' where id = '20000000-0000-0000-0000-00000000000b' returning id $$,
  'A cannot update B''s entry');

insert into public.partner_entries (event_id, user_id, role)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'leader');
select throws_ok(
  $$ insert into public.partner_entries (event_id, user_id, role) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'leader') $$,
  '23505', null, 'second looking entry for same event is rejected');
select throws_ok(
  $$ insert into public.partner_entries (event_id, user_id, role, created_at) values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'leader', '2000-01-01') $$,
  '42501', null, 'cannot backdate created_at on insert');
select throws_ok(
  $$ update public.partner_entries set created_at = '2000-01-01' where user_id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'cannot change created_at on update');
select throws_ok(
  $$ insert into public.partner_entries (event_id, user_id, role) values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'leader') $$,
  '42501', null, 'cannot insert an entry for someone else');

update public.partner_entries set status = 'withdrawn'
  where user_id = '00000000-0000-0000-0000-00000000000a' and event_id = '10000000-0000-0000-0000-000000000001';
select throws_ok(
  $$ update public.partner_entries set status = 'looking' where user_id = '00000000-0000-0000-0000-00000000000a' and event_id = '10000000-0000-0000-0000-000000000001' $$,
  'P0001', 'entry_closed', 'withdrawn entry cannot be reopened to keep its old place');
select lives_ok(
  $$ insert into public.partner_entries (event_id, user_id, role) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'leader') $$,
  'after withdrawing, A can rejoin (at the back)');

select is_empty(
  $$ delete from public.dance_events where id = '10000000-0000-0000-0000-000000000001' returning id $$,
  'non-admin cannot delete events');
select results_eq(
  $$ select display_name from public.partner_queue where event_id = '10000000-0000-0000-0000-000000000001' order by created_at, id $$,
  $$ values ('Bob'::text), ('Alice'::text) $$,
  'queue keeps join order: rejoin goes to the back');

-- ---------- admin ----------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000ad","email":"rls-admin@test.invalid","role":"authenticated"}', true);
select isnt_empty(
  $$ delete from public.dance_events where id = '10000000-0000-0000-0000-000000000001' returning id $$,
  'admin can delete events');

-- ---------- purge (service role) ----------
reset role;
select public.purge_old_events();
select results_eq(
  $$ select slug from public.dance_events where slug like 'old-%' order by slug $$,
  $$ values ('old-29'::text) $$,
  'purge deletes events ended >30 days ago and keeps newer ones');

select * from finish();
rollback;
