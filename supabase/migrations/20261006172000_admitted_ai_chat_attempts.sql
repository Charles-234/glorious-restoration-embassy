create table if not exists public.ai_chat_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  calls_used integer not null default 0 check (calls_used >= 0 and calls_used <= 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_chat_daily_usage enable row level security;
revoke all on table public.ai_chat_daily_usage from anon, authenticated;

create or replace function public.admit_ai_chat_call()
returns table (
  admitted boolean,
  quota_used integer,
  quota_limit integer,
  remaining_calls integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  local_usage_date date;
  current_calls_used integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  local_usage_date := (now() at time zone 'Africa/Nairobi')::date;

  insert into public.ai_chat_daily_usage (user_id, usage_date)
  values (current_user_id, local_usage_date)
  on conflict (user_id, usage_date) do nothing;

  update public.ai_chat_daily_usage as usage
    set calls_used = usage.calls_used + 1,
        updated_at = now()
    where usage.user_id = current_user_id
      and usage.usage_date = local_usage_date
      and usage.calls_used < 10
    returning usage.calls_used into current_calls_used;

  if not found then
    select usage.calls_used
      into current_calls_used
      from public.ai_chat_daily_usage as usage
      where usage.user_id = current_user_id
        and usage.usage_date = local_usage_date;

    return query
      select false, current_calls_used, 10, greatest(10 - current_calls_used, 0);
    return;
  end if;

  return query
    select true, current_calls_used, 10, greatest(10 - current_calls_used, 0);
end;
$$;

revoke all on function public.admit_ai_chat_call() from public, anon;
grant execute on function public.admit_ai_chat_call() to authenticated;
