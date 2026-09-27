-- =====================================================================
-- RealtyPulse AI — Database Schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a
-- fresh project. It is idempotent-ish (uses IF NOT EXISTS / OR REPLACE)
-- so it can be re-run safely during development.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
do $$ begin
  create type org_role as enum ('owner', 'admin', 'agent', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_source as enum ('website', 'referral', 'campaign', 'walk_in', 'portal', 'whatsapp', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_status as enum ('active', 'past', 'prospect');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_status as enum ('draft', 'active', 'under_offer', 'sold', 'rented', 'off_market');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_type as enum ('apartment', 'villa', 'townhouse', 'penthouse', 'office', 'retail', 'land', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deal_status as enum ('open', 'negotiation', 'under_contract', 'closed_won', 'closed_lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('todo', 'in_progress', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status as enum ('draft', 'active', 'paused', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_channel as enum ('email', 'whatsapp', 'sms', 'social', 'ads', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type agent_status as enum ('idle', 'working', 'analyzing', 'waiting', 'error', 'disabled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- CORE TABLES
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  language text not null default 'en' check (language in ('en', 'ar')),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  plan text not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role org_role not null default 'agent',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assigned_to uuid references public.profiles (id) on delete set null,
  name text not null,
  email text,
  phone text,
  status lead_status not null default 'new',
  source lead_source not null default 'other',
  budget_min numeric,
  budget_max numeric,
  interest text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assigned_to uuid references public.profiles (id) on delete set null,
  name text not null,
  email text,
  phone text,
  status client_status not null default 'prospect',
  tags text[] not null default '{}',
  notes text,
  converted_from_lead_id uuid references public.leads (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  listed_by uuid references public.profiles (id) on delete set null,
  title text not null,
  address text,
  city text,
  price numeric,
  property_type property_type not null default 'apartment',
  status property_status not null default 'draft',
  bedrooms int,
  bathrooms int,
  area_sqft numeric,
  description text,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  owner_id uuid references public.profiles (id) on delete set null,
  title text not null,
  value numeric not null default 0,
  status deal_status not null default 'open',
  probability int not null default 50 check (probability between 0 and 100),
  closing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  due_date timestamptz,
  assigned_to uuid references public.profiles (id) on delete set null,
  related_lead_id uuid references public.leads (id) on delete set null,
  related_deal_id uuid references public.deals (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  agent_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  type text not null default 'viewing',
  status appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  status campaign_status not null default 'draft',
  channel campaign_channel not null default 'email',
  budget numeric,
  spend numeric not null default 0,
  leads_generated int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  type text not null default 'general',
  title text not null,
  message text,
  read boolean not null default false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  channel campaign_channel not null default 'whatsapp',
  subject text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sender_type text not null check (sender_type in ('agent_user', 'contact', 'ai_agent')),
  sender_id uuid,
  language text default 'en',
  body text not null,
  translated_body text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_agents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  status agent_status not null default 'idle',
  icon text,
  capabilities text[] not null default '{}',
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

create table if not exists public.ai_agent_runs (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references public.ai_agents (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  triggered_by uuid references public.profiles (id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  input jsonb not null default '{}',
  output jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
create index if not exists idx_leads_org on public.leads (organization_id);
create index if not exists idx_clients_org on public.clients (organization_id);
create index if not exists idx_properties_org on public.properties (organization_id);
create index if not exists idx_deals_org on public.deals (organization_id);
create index if not exists idx_tasks_org on public.tasks (organization_id);
create index if not exists idx_appointments_org on public.appointments (organization_id);
create index if not exists idx_campaigns_org on public.campaigns (organization_id);
create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_activity_org on public.activity_log (organization_id, created_at desc);
create index if not exists idx_conversations_org on public.conversations (organization_id);
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);
create index if not exists idx_memberships_user on public.memberships (user_id);
create index if not exists idx_organizations_owner on public.organizations (owner_id);

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS (security definer, used inside RLS policies)
-- ---------------------------------------------------------------------

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, roles org_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role = any (roles)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles','organizations','leads','clients','properties','deals','tasks','appointments','campaigns','ai_agents']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.properties enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.appointments enable row level security;
alter table public.campaigns enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_agents enable row level security;
alter table public.ai_agent_runs enable row level security;

drop policy if exists "profiles_select_self_or_orgmate" on public.profiles;
create policy "profiles_select_self_or_orgmate" on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid() and m2.user_id = public.profiles.id
    )
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid());

-- organizations: members can read; the OWNER can also always read their
-- own org even before any membership row exists yet. This matters
-- specifically for the moment right after creating an organization: the
-- app inserts the org row and immediately reads it back (INSERT ...
-- RETURNING, which Postgres RLS filters through the SELECT policy just
-- like a normal SELECT), but the owner's membership row is only created
-- in a following step. Without the owner_id clause here, that
-- read-back is silently filtered to zero rows even though the insert
-- itself succeeded — which breaks workspace creation on every attempt
-- and can leave orphaned organization rows with no membership at all.
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations for select
  using (public.is_org_member(id) or owner_id = auth.uid());

drop policy if exists "organizations_insert_self" on public.organizations;
create policy "organizations_insert_self" on public.organizations for insert
  with check (owner_id = auth.uid());

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin" on public.organizations for update
  using (public.has_org_role(id, array['owner','admin']::org_role[]) or owner_id = auth.uid());

drop policy if exists "memberships_select_orgmate" on public.memberships;
create policy "memberships_select_orgmate" on public.memberships for select
  using (public.is_org_member(organization_id));

drop policy if exists "memberships_insert_self_or_admin" on public.memberships;
create policy "memberships_insert_self_or_admin" on public.memberships for insert
  with check (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner','admin']::org_role[])
  );

drop policy if exists "memberships_update_admin" on public.memberships;
create policy "memberships_update_admin" on public.memberships for update
  using (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

drop policy if exists "memberships_delete_admin" on public.memberships;
create policy "memberships_delete_admin" on public.memberships for delete
  using (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

-- Role-based CRUD policy, applied per table below.
-- Read: any member.
-- Create/Update: owner, admin, agent (staff is read-only).
-- Delete: owner, admin only.
do $$
declare
  t text;
begin
  foreach t in array array[
    'leads','clients','properties','deals','tasks','appointments',
    'campaigns','conversations','messages','ai_agents'
  ]
  loop
    execute format('drop policy if exists "%1$s_select_member" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_select_member" on public.%1$s for select using (public.is_org_member(organization_id));',
      t
    );

    execute format('drop policy if exists "%1$s_insert_member" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_insert_member" on public.%1$s for insert with check (public.has_org_role(organization_id, array[''owner'',''admin'',''agent'']::org_role[]));',
      t
    );

    execute format('drop policy if exists "%1$s_update_member" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_update_member" on public.%1$s for update using (public.has_org_role(organization_id, array[''owner'',''admin'',''agent'']::org_role[]));',
      t
    );

    execute format('drop policy if exists "%1$s_delete_admin" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_delete_admin" on public.%1$s for delete using (public.has_org_role(organization_id, array[''owner'',''admin'']::org_role[]));',
      t
    );
  end loop;
end $$;

drop policy if exists "ai_agent_runs_select_member" on public.ai_agent_runs;
create policy "ai_agent_runs_select_member" on public.ai_agent_runs for select
  using (public.is_org_member(organization_id));

drop policy if exists "ai_agent_runs_insert_member" on public.ai_agent_runs;
create policy "ai_agent_runs_insert_member" on public.ai_agent_runs for insert
  with check (public.is_org_member(organization_id));

drop policy if exists "notifications_select_owner" on public.notifications;
create policy "notifications_select_owner" on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications_update_owner" on public.notifications;
create policy "notifications_update_owner" on public.notifications for update
  using (user_id = auth.uid());

drop policy if exists "notifications_insert_member" on public.notifications;
create policy "notifications_insert_member" on public.notifications for insert
  with check (organization_id is null or public.is_org_member(organization_id));

drop policy if exists "activity_select_member" on public.activity_log;
create policy "activity_select_member" on public.activity_log for select
  using (public.is_org_member(organization_id));

drop policy if exists "activity_insert_member" on public.activity_log;
create policy "activity_insert_member" on public.activity_log for insert
  with check (public.is_org_member(organization_id));

-- =====================================================================
-- End of schema
-- =====================================================================
