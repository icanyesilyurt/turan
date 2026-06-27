create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text not null default '',
  country text,
  city text,
  app_language text not null default 'tr',
  avatar_url text,
  cover_url text,
  membership_status text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_app_language_check
    check (app_language in ('tr', 'az', 'kk', 'ky', 'uz', 'tk')),
  constraint profiles_membership_status_check
    check (membership_status in ('free', 'member', 'admin'))
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (
        char_length(username) between 3 and 20
        and username ~ '^[A-Za-z0-9_]+$'
      );
  end if;
end;
$$;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert (
  id,
  username,
  display_name,
  bio,
  country,
  city,
  app_language,
  avatar_url,
  cover_url
) on public.profiles to authenticated;
grant update (
  username,
  display_name,
  bio,
  country,
  city,
  app_language,
  avatar_url,
  cover_url
) on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profile_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_username text;
begin
  generated_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'user_' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (
    id,
    username,
    display_name,
    country,
    city,
    app_language
  )
  values (
    new.id,
    generated_username,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, generated_username), '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data ->> 'country'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'city'), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'app_language'), ''), 'tr')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

insert into public.profiles (
  id,
  username,
  display_name,
  country,
  city,
  app_language
)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'username'), ''),
    'user_' || substr(users.id::text, 1, 8)
  ),
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
    split_part(
      coalesce(users.email, 'user_' || substr(users.id::text, 1, 8)),
      '@',
      1
    )
  ),
  nullif(trim(users.raw_user_meta_data ->> 'country'), ''),
  nullif(trim(users.raw_user_meta_data ->> 'city'), ''),
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'app_language'), ''), 'tr')
from auth.users as users
where not exists (
  select 1
  from public.profiles
  where profiles.id = users.id
)
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can read their own avatar objects" on storage.objects;
create policy "Users can read their own avatar objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update their own avatars" on storage.objects;
create policy "Users can update their own avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own avatars" on storage.objects;
create policy "Users can delete their own avatars"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload their own covers" on storage.objects;
create policy "Users can upload their own covers"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can read their own cover objects" on storage.objects;
create policy "Users can read their own cover objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update their own covers" on storage.objects;
create policy "Users can update their own covers"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own covers" on storage.objects;
create policy "Users can delete their own covers"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create or replace function public.refresh_post_comment_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_post_ids uuid[];
  affected_comment_ids uuid[];
begin
  affected_post_ids := array_remove(array[
    case when tg_op in ('INSERT', 'UPDATE') then new.post_id end,
    case when tg_op in ('DELETE', 'UPDATE') then old.post_id end
  ], null);

  affected_comment_ids := array_remove(array[
    case when tg_op in ('INSERT', 'UPDATE') then new.parent_comment_id end,
    case when tg_op in ('DELETE', 'UPDATE') then old.parent_comment_id end
  ], null);

  update public.posts
  set comments_count = (
    select count(*)::integer
    from public.post_comments
    where post_comments.post_id = posts.id
      and post_comments.parent_comment_id is null
  )
  where id = any(affected_post_ids);

  update public.post_comments
  set replies_count = (
    select count(*)::integer
    from public.post_comments as replies
    where replies.parent_comment_id = post_comments.id
  )
  where id = any(affected_comment_ids);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists refresh_post_comment_counters_on_insert on public.post_comments;
drop trigger if exists refresh_post_comment_counters_on_delete on public.post_comments;
drop trigger if exists refresh_post_comment_counters_on_change on public.post_comments;
create constraint trigger refresh_post_comment_counters_on_change
  after insert or update or delete on public.post_comments
  deferrable initially deferred
  for each row
  execute function public.refresh_post_comment_counters();

update public.posts
set comments_count = counts.total
from (
  select posts.id, count(post_comments.id)::integer as total
  from public.posts
  left join public.post_comments
    on post_comments.post_id = posts.id
    and post_comments.parent_comment_id is null
  group by posts.id
) as counts
where posts.id = counts.id;

update public.post_comments
set replies_count = counts.total
from (
  select parent.id, count(reply.id)::integer as total
  from public.post_comments as parent
  left join public.post_comments as reply
    on reply.parent_comment_id = parent.id
  group by parent.id
) as counts
where post_comments.id = counts.id;
