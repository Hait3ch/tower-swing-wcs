-- Add matched count so the partner list can show success stories.
create or replace view public.event_queue_counts as
  select event_id,
         count(*) filter (where status = 'looking' and role = 'leader')::int as leaders,
         count(*) filter (where status = 'looking' and role = 'follower')::int as followers,
         count(*) filter (where status = 'matched')::int as matched
  from public.partner_entries
  where status in ('looking', 'matched')
  group by event_id;
