begin;
select plan(4);
delete from public.tower_registrations;
delete from public.tower_events;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin1@example.com'),
  ('00000000-0000-0000-0000-0000000000a2', 'user1@example.com');
insert into public.admins (email) values ('admin1@example.com');
insert into public.tower_events (id, year, name, date, max_capacity, is_active, price, venue, address) values
  ('40000000-0000-0000-0000-000000000001', 2025, 'TS 2025', '2025-06-28', 10, true, 15, 'v', 'a'),
  ('40000000-0000-0000-0000-000000000002', 2026, 'TS 2026', '2026-06-27', 10, false, 15, 'v', 'a');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","email":"user1@example.com","role":"authenticated"}', true);
select throws_ok($$ select public.activate_tower_event('40000000-0000-0000-0000-000000000002') $$, '42501', 'not_admin', 'non-admin cannot switch events');
select is(public.is_admin(), false, 'is_admin false for normal user');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","email":"ADMIN1@example.com","role":"authenticated"}', true);
select public.activate_tower_event('40000000-0000-0000-0000-000000000002');
select results_eq($$ select name from public.tower_events where is_active $$, $$ values ('TS 2026'::text) $$, 'admin switches the active event');
select is(public.is_admin(), true, 'admin email match is case-insensitive');
select * from finish();
rollback;
