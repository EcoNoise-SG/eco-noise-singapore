create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  resource_type text null,
  resource_id text null,
  details jsonb null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit logs own select" on public.audit_logs;
create policy "audit logs own select"
on public.audit_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "audit logs own insert" on public.audit_logs;
create policy "audit logs own insert"
on public.audit_logs
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  department text not null,
  email text not null,
  reference_code text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enquiries
  add column if not exists reference_code text,
  add column if not exists status text default 'submitted',
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_enquiries_reference_code on public.enquiries(reference_code);
create index if not exists idx_enquiries_email on public.enquiries(email);

alter table public.enquiries enable row level security;

drop policy if exists "enquiries public insert" on public.enquiries;
create policy "enquiries public insert"
on public.enquiries
for insert
to anon, authenticated
with check (true);

drop policy if exists "enquiries authenticated select" on public.enquiries;
create policy "enquiries authenticated select"
on public.enquiries
for select
to authenticated
using (true);
