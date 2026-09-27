-- Optional demo data loader. Never runs automatically.
--   select public.load_demo_data('<your-organization-id>');

create or replace function public.load_demo_data(org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_user uuid := auth.uid();
  new_client_id uuid;
  new_property_id uuid;
begin
  if not exists (
    select 1 from public.memberships
    where organization_id = org_id and user_id = requesting_user
  ) then
    raise exception 'Not a member of this organization';
  end if;

  insert into public.leads (organization_id, name, email, phone, status, source, budget_min, budget_max, interest, created_by)
  values
    (org_id, 'Amira Haddad', 'amira.haddad@example.com', '+971501234567', 'qualified', 'website', 800000, 1200000, '3BR villa, Palm Jumeirah', requesting_user),
    (org_id, 'Karim El-Sayed', 'karim.elsayed@example.com', '+971502345678', 'new', 'referral', 400000, 600000, 'Downtown apartment', requesting_user),
    (org_id, 'Layla Nasser', 'layla.nasser@example.com', '+971503456789', 'contacted', 'campaign', 1500000, 2500000, 'Waterfront penthouse', requesting_user);

  insert into public.clients (organization_id, name, email, phone, status, tags, created_by)
  values (org_id, 'Omar Fathi', 'omar.fathi@example.com', '+971504567890', 'active', array['investor'], requesting_user)
  returning id into new_client_id;

  insert into public.properties (organization_id, listed_by, title, address, city, price, property_type, status, bedrooms, bathrooms, area_sqft, description)
  values (org_id, requesting_user, 'Frond K Signature Villa', 'Palm Jumeirah, Frond K', 'Dubai', 12500000, 'villa', 'active', 7, 9, 11400, 'Beachfront signature villa with private dock.')
  returning id into new_property_id;

  insert into public.deals (organization_id, property_id, client_id, owner_id, title, value, status, probability, closing_date)
  values (org_id, new_property_id, new_client_id, requesting_user, 'Frond K Villa — Omar Fathi', 12500000, 'negotiation', 60, current_date + interval '30 days');

  insert into public.tasks (organization_id, title, description, status, priority, due_date, assigned_to, created_by)
  values (org_id, 'Follow up with Amira Haddad', 'Send updated Palm Jumeirah listings.', 'todo', 'high', now() + interval '2 days', requesting_user, requesting_user);
end;
$$;

revoke all on function public.load_demo_data(uuid) from public;
grant execute on function public.load_demo_data(uuid) to authenticated;
