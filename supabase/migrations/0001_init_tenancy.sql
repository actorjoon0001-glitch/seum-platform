-- 0001_init_tenancy.sql
-- 멀티테넌시 기반: organizations / profiles / members + RLS 헬퍼 함수
-- 설계 근거: docs/03-erd.md (2.1 테넌시 & 인증, 4. RLS)
--
-- 원칙
--  - 모든 비즈니스 테이블은 org_id 로 격리하고 RLS 로 강제한다.
--  - 멤버 추가/역할 변경 등 민감 작업은 service_role(admin client)에서 수행한다.
--  - 헬퍼 함수는 security definer 로 members 를 조회해 RLS 무한 재귀를 피한다.

-- ──────────────────────────────────────────────────────────────
-- 확장
-- ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ──────────────────────────────────────────────────────────────
-- organizations — 테넌트(업체)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique,
  business_type text check (
    business_type in ('building', 'mobile_house', 'country_house', 'interior')
  ),
  plan          text not null default 'free',
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- profiles — 사용자 프로필 (auth.users 1:1)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  phone      text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- members — Org ↔ User (N:M) + 역할
-- ──────────────────────────────────────────────────────────────
create table if not exists public.members (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null check (
    role in ('master', 'admin', 'sales', 'designer', 'construction', 'finance')
  ),
  status        text not null default 'active' check (
    status in ('active', 'invited', 'disabled')
  ),
  invited_email text,
  created_at    timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists members_org_user_idx on public.members (org_id, user_id);
create index if not exists members_user_idx on public.members (user_id);

-- ──────────────────────────────────────────────────────────────
-- RLS 헬퍼 함수 (security definer → members RLS 우회로 재귀 방지)
-- ──────────────────────────────────────────────────────────────

-- 현재 사용자가 active 로 속한 org 목록
create or replace function public.auth_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.members
  where user_id = auth.uid()
    and status = 'active'
$$;

-- 현재 사용자가 특정 org 에서 가진 역할
create or replace function public.auth_role(p_org uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.members
  where user_id = auth.uid()
    and org_id = p_org
    and status = 'active'
  limit 1
$$;

-- ──────────────────────────────────────────────────────────────
-- 신규 가입 시 profiles 자동 생성 트리거
-- ──────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────────────────────
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.members       enable row level security;

-- organizations: 내가 속한 org 만 조회.
-- 생성/수정은 온보딩 서버 액션(admin client)에서 처리 → 쓰기 정책 없음.
drop policy if exists "org members read organizations" on public.organizations;
create policy "org members read organizations" on public.organizations
  for select using (id in (select public.auth_org_ids()));

-- profiles: 본인 + 같은 org 멤버의 프로필 조회, 본인 프로필만 수정.
drop policy if exists "read own and co-member profiles" on public.profiles;
create policy "read own and co-member profiles" on public.profiles
  for select using (
    id = auth.uid()
    or id in (
      select user_id from public.members
      where org_id in (select public.auth_org_ids())
    )
  );

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid());

-- members: 내가 속한 org 의 멤버 목록만 조회.
-- 멤버 추가/역할 변경/제거는 master/admin 권한으로 admin client 에서 처리 → 쓰기 정책 없음.
drop policy if exists "see members of my orgs" on public.members;
create policy "see members of my orgs" on public.members
  for select using (org_id in (select public.auth_org_ids()));
