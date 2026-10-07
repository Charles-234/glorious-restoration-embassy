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

create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cms_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_cms_admin() from public;
grant execute on function public.is_cms_admin() to anon, authenticated;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (
    kind in ('sermon', 'event', 'announcement', 'gallery', 'setting')
  ),
  slug text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);

create index if not exists site_content_publication_idx
  on public.site_content (kind, published, updated_at desc);

alter table public.site_content enable row level security;
revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.site_content to authenticated;

drop policy if exists "Published site content is publicly readable" on public.site_content;
drop policy if exists "CMS admins can create site content" on public.site_content;
drop policy if exists "CMS admins can update site content" on public.site_content;
drop policy if exists "CMS admins can delete site content" on public.site_content;
create policy "Published site content is publicly readable"
  on public.site_content
  for select
  to anon, authenticated
  using (published or (select public.is_cms_admin()));

create policy "CMS admins can create site content"
  on public.site_content
  for insert
  to authenticated
  with check ((select public.is_cms_admin()));

create policy "CMS admins can update site content"
  on public.site_content
  for update
  to authenticated
  using ((select public.is_cms_admin()))
  with check ((select public.is_cms_admin()));

create policy "CMS admins can delete site content"
  on public.site_content
  for delete
  to authenticated
  using ((select public.is_cms_admin()));

insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read published CMS media" on storage.objects;
drop policy if exists "CMS admins can upload CMS media" on storage.objects;
drop policy if exists "CMS admins can update CMS media" on storage.objects;
drop policy if exists "CMS admins can delete CMS media" on storage.objects;
create policy "Public can read published CMS media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'cms-media');

create policy "CMS admins can upload CMS media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'cms-media' and (select public.is_cms_admin()));

create policy "CMS admins can update CMS media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'cms-media' and (select public.is_cms_admin()))
  with check (bucket_id = 'cms-media' and (select public.is_cms_admin()));

create policy "CMS admins can delete CMS media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'cms-media' and (select public.is_cms_admin()));
