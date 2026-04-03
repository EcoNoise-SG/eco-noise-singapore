create extension if not exists pgcrypto;

create table if not exists public.workspace_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'My workspace thread',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.workspace_threads(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'user' check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  details text null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspace_threads_user_id on public.workspace_threads(user_id);
create index if not exists idx_workspace_messages_user_id on public.workspace_messages(user_id);
create index if not exists idx_workspace_messages_thread_id on public.workspace_messages(thread_id);
create index if not exists idx_workspace_tasks_user_id on public.workspace_tasks(user_id);

alter table public.workspace_threads enable row level security;
alter table public.workspace_messages enable row level security;
alter table public.workspace_tasks enable row level security;

create policy "workspace threads own select"
on public.workspace_threads
for select
to authenticated
using (auth.uid() = user_id);

create policy "workspace threads own insert"
on public.workspace_threads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "workspace threads own update"
on public.workspace_threads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workspace messages own select"
on public.workspace_messages
for select
to authenticated
using (auth.uid() = user_id);

create policy "workspace messages own insert"
on public.workspace_messages
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "workspace tasks own select"
on public.workspace_tasks
for select
to authenticated
using (auth.uid() = user_id);

create policy "workspace tasks own insert"
on public.workspace_tasks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "workspace tasks own update"
on public.workspace_tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
