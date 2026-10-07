-- =====================================================================
-- Migration: fix organizations SELECT policy so a freshly-created org
-- can be read back immediately by its owner, before any membership row
-- exists yet.
--
-- Run this once in the Supabase SQL editor if your project already ran
-- an earlier version of schema.sql. Safe to re-run.
--
-- Without this, INSERT ... RETURNING on `organizations` (which is what
-- Supabase's `.insert().select()` does) gets filtered to zero rows by
-- RLS, because the SELECT policy required org membership — which the
-- owner doesn't have yet at that exact moment (their membership row is
-- created in a separate, later step). This makes every workspace-
-- creation attempt fail, and can leave orphaned organization rows with
-- no membership attached at all, since the failure happens before the
-- membership insert ever runs.
-- =====================================================================

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations for select
  using (public.is_org_member(id) or owner_id = auth.uid());

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin" on public.organizations for update
  using (public.has_org_role(id, array['owner','admin']::org_role[]) or owner_id = auth.uid());
