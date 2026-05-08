# 온누리한의원 웹사이트

수원 권선동 온누리한의원 공식 홈페이지.

## 구성

- **프론트엔드**: 단일 HTML 파일 (`onnuri_clinic (3)_mobile.html`)
- **호스팅**: Vercel
- **챗봇 백엔드**: Supabase Edge Function (`supabase/functions/chat`)
- **DB(예약/문의)**: Supabase Postgres (`supabase/migrations/001_inquiries.sql`)
- **도메인**: onnuriclinic.com (가비아 등록)

## 라우팅

`vercel.json`에서 다음과 같이 라우팅됩니다:

- `/` → `onnuri_clinic (3)_mobile.html`
- `/api/chat` → Supabase Edge Function `chat` (Anthropic API 프록시)

## 배포 후 해야 할 것

1. `vercel.json` 안의 `YOUR_SUPABASE_PROJECT_REF` 자리를 본인 Supabase 프로젝트 ID로 교체
2. Supabase 환경변수에 `ANTHROPIC_API_KEY` 등록
3. `supabase/functions/chat/index.ts`의 `ALLOWED_ORIGINS`에 본인 도메인 등록 (이미 onnuriclinic.com 포함됨)
