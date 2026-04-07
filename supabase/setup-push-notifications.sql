-- ============================================
-- SETUP PUSH NOTIFICATIONS (FCM)
-- IT-Inventory
-- ============================================

-- 1) Table des tokens appareils
create table if not exists public."PushDeviceToken" (
  id text primary key, -- deviceId généré côté mobile
  "userId" text references public."User"(id) on delete set null,
  token text not null unique,
  platform text not null default 'android',
  enabled boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public."PushDeviceToken"
  add column if not exists enabled boolean not null default true;

create index if not exists idx_push_device_user_id
  on public."PushDeviceToken" ("userId");

-- 1.b) Autoriser l'app mobile (anon/authenticated) a lire/ecrire les tokens
alter table public."PushDeviceToken" disable row level security;
grant select, insert, update, delete on table public."PushDeviceToken" to anon;
grant select, insert, update, delete on table public."PushDeviceToken" to authenticated;

-- 1.c) Compatibilite schema existant: rendre userId nullable + FK ON DELETE SET NULL
alter table public."PushDeviceToken"
  alter column "userId" drop not null;

do $$
declare
  fk_name text;
begin
  select c.conname
  into fk_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'PushDeviceToken'
    and c.contype = 'f'
    and c.conname ilike '%userId%';

  if fk_name is not null then
    execute format('alter table public."PushDeviceToken" drop constraint %I', fk_name);
  end if;

  alter table public."PushDeviceToken"
    add constraint "PushDeviceToken_userId_fkey"
    foreign key ("userId") references public."User"(id) on delete set null;
exception
  when duplicate_object then
    null;
end
$$;

-- 2) Trigger updatedAt
create or replace function public.set_push_device_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_push_device_updated_at on public."PushDeviceToken";
create trigger trg_push_device_updated_at
before update on public."PushDeviceToken"
for each row
execute function public.set_push_device_updated_at();

-- 3) Realtime pour les mouvements (si pas déjà fait)
do $$
begin
  alter publication supabase_realtime add table public."StockMovement";
exception
  when duplicate_object then
    null;
end
$$;

