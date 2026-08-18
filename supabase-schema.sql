-- 브랜드 카드뉴스 자동화 — 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

-- 회원 (이 서비스 전용. 다른 앱과 공유하지 않는다)
create table if not exists app_users (
  key         text primary key,            -- `${provider}:${providerUserId}`
  provider    text not null,
  name        text not null,
  email       text,
  picture     text,
  joined_at   timestamptz not null default now()
);

-- 로그인 세션
create table if not exists app_sessions (
  id          text primary key,            -- 세션 쿠키 값
  user_key    text not null references app_users(key) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists app_sessions_user_key_idx on app_sessions(user_key);

-- 사용자별 작업 공간 (브랜드·캐릭터·카드뉴스). 문서 통째로 보관한다.
create table if not exists workspaces (
  key         text primary key,            -- 회원 key 또는 'guest:<익명ID>'
  data        jsonb not null default '{"characterSheetsUsed":0,"decks":[]}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- 서버 전역 설정 (Gemini 키, OAuth 자격증명). 단일 행.
create table if not exists app_config (
  id          int primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  check (id = 1)
);
insert into app_config (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- 서버(service role)에서만 접근한다. 익명 클라이언트 접근은 막는다.
alter table app_users    enable row level security;
alter table app_sessions enable row level security;
alter table workspaces   enable row level security;
alter table app_config   enable row level security;

-- 생성 이미지 보관용 버킷 (공개 읽기)
insert into storage.buckets (id, name, public)
values ('generated', 'generated', true)
on conflict (id) do nothing;
