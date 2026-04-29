-- 온누리한의원 문의/예약 테이블
-- 사용 방법: Supabase 대시보드 → SQL Editor에 이 파일 내용을 붙여넣고 실행
-- 또는 CLI: supabase db push

create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 50),
  phone       text not null check (char_length(phone) between 8 and 20),
  category    text,
  message     text check (char_length(message) <= 2000),
  source      text default 'web',
  created_at  timestamptz not null default now()
);

-- 인덱스
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);

-- RLS 활성화 (보안 핵심: 모든 테이블은 RLS 권장)
alter table public.inquiries enable row level security;

-- 익명 사용자가 INSERT만 가능하도록 정책 (조회는 관리자만)
drop policy if exists "anon_can_insert_inquiry" on public.inquiries;
create policy "anon_can_insert_inquiry"
  on public.inquiries
  for insert
  to anon
  with check (true);

-- 인증된 사용자(로그인한 관리자)는 조회 가능
drop policy if exists "auth_can_read_inquiry" on public.inquiries;
create policy "auth_can_read_inquiry"
  on public.inquiries
  for select
  to authenticated
  using (true);

-- 챗봇 대화 로그 (선택)
create table if not exists public.chat_logs (
  id          uuid primary key default gen_random_uuid(),
  session_id  text,
  role        text check (role in ('user','assistant')),
  content     text,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index if not exists chat_logs_session_idx on public.chat_logs (session_id, created_at);

alter table public.chat_logs enable row level security;
-- 관리자만 조회/입력 (Edge Function이 service_role 키로 입력하면 됨)
