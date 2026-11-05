begin;
select plan(6);

-- Isolate from any local data (rolled back at the end).
delete from public.tower_registrations;
delete from public.tower_events;

insert into public.tower_events (id, year, name, date, max_capacity, is_active, registration_open, price, venue, address)
values ('30000000-0000-0000-0000-000000000001', 2026, 'Tower Swing 2026', '2026-06-27 16:00+03', 1, true, true, 25, 'REDI', 'Hermannin rantatie 5');

set local role anon;

select is(
  (public.register_tower('{"first_name":"A","last_name":"A","email":"a@x.fi","phone":"1","experience":"beginner"}')).payment_status,
  'pending', 'first registration takes the last spot');
select is(
  (public.register_tower('{"first_name":"B","last_name":"B","email":"b@x.fi","phone":"1","experience":"advanced"}')).payment_status,
  'waiting', 'second registration goes to the waiting list');
select throws_ok(
  $$ select public.register_tower('{"first_name":"A","last_name":"A","email":"A@X.fi","phone":"1","experience":"beginner"}') $$,
  'P0001', 'duplicate_email', 'same email (any case) is rejected');
select is(
  (select count(*)::int from public.tower_registrations), 0,
  'anon still cannot read registrations');

reset role;
update public.tower_events set registration_open = false;
set local role anon;
select throws_ok(
  $$ select public.register_tower('{"first_name":"C","last_name":"C","email":"c@x.fi","phone":"1","experience":"beginner"}') $$,
  'P0001', 'registration_closed', 'closed registration is rejected');

reset role;
update public.tower_events set is_active = false;
set local role anon;
select throws_ok(
  $$ select public.register_tower('{"first_name":"C","last_name":"C","email":"c@x.fi","phone":"1","experience":"beginner"}') $$,
  'P0001', 'no_active_event', 'no active event is rejected');

select * from finish();
rollback;
