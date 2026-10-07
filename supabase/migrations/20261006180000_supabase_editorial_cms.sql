create table if not exists public.cms_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.cms_admins enable row level security;
revoke all on table public.cms_admins from anon, authenticated;
grant select on table public.cms_admins to authenticated;

drop policy if exists "CMS admins can read their own membership" on public.cms_admins;
create policy "CMS admins can read their own membership"
  on public.cms_admins
  for select
  to authenticated
  using (user_id = (select auth.uid()));