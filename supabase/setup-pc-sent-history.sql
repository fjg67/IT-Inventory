-- Historique des PC envoyes avec EDS destination
-- A executer une fois dans Supabase SQL Editor

create table if not exists public."PCSentHistory" (
  "id" text primary key,
  "articleId" text,
  "hostname" text not null,
  "asset" text,
  "model" text,
  "brand" text,
  "sourceSiteId" text not null,
  "sourceSiteName" text,
  "sourceAgencyEds" text,
  "destinationAgencyEds" text not null,
  "recipientName" text,
  "sentByUserId" text,
  "sentByName" text,
  "sentAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);

alter table public."PCSentHistory"
  add column if not exists "recipientName" text;

create index if not exists "idx_pc_sent_source_site" on public."PCSentHistory" ("sourceSiteId");
create index if not exists "idx_pc_sent_sent_at" on public."PCSentHistory" ("sentAt" desc);
create index if not exists "idx_pc_sent_destination_eds" on public."PCSentHistory" ("destinationAgencyEds");
