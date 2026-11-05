-- Queue order must follow the real join moment. now() is fixed per transaction,
-- so two joins in one transaction would tie; clock_timestamp() never does.
alter table public.partner_entries alter column created_at set default clock_timestamp();
