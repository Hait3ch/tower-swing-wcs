-- WhatsApp usernames let dancers connect without sharing their phone number.
alter table public.profiles
  add column whatsapp_username text check (whatsapp_username is null or whatsapp_username ~ '^[a-z0-9._]{3,35}$');
