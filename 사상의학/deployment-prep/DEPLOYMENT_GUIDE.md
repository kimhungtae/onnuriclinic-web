# 사상의학 플랫폼 — 웹앱 배포 준비 가이드

> **목적**: sasang-platform을 인터넷에 공개 배포하기 위한 모든 준비 사항. 누가 무엇을 언제 해야 하는지 명확히.
>
> **전제 결정사항** (이전 대화에서 확정):
> - 도메인: **sasang.onnuriclinic.com** (Cloudflare DNS)
> - 접근 제어: **사이트 비밀번호** (무료 대안으로 구현 — 원래 선택지인 Vercel Password Protection은 Pro 플랜 $20/월 필요)
> - 예산: **0원** (무료 티어만)
> - 초기 사용자: 운영자(원장) + 승인된 한의사 소수
>
> **버전**: v1.0 · **작성일**: 2026-05-18

---

## 0. TL;DR — 한눈 요약

| 항목 | 선택 | 비용 | 비고 |
|---|---|---|---|
| 호스팅 | **Vercel Hobby** | $0 | Next.js 14 최적, 자동 HTTPS·CI/CD |
| 데이터베이스 | **Turso (libSQL)** | $0 | SQLite 호환, Drizzle 그대로 사용 |
| 검색 엔진 | **Fly.io MeiliSearch** | $0 | 무료 VM에 자체 호스팅 (Phase 3) |
| 이메일 | **Resend** | $0 | 월 3,000건, magic link 인증용 |
| 파일 저장 | **Cloudflare R2** | $0 | PDF/HWP 원본 (10GB 무료) |
| 도메인 | **sasang.onnuriclinic.com** | $0 | 기존 도메인 서브 |
| 접근 제어 | **사이트 비밀번호 미들웨어** | $0 | 자체 구현 |
| 보안 | Cloudflare proxy + HTTPS | $0 | 자동 |
| **총 운영비** | | **$0/월** | MVP 단계 |

업그레이드 시점(나중에 결정):
- 사용자 100+ → Vercel Pro ($20)
- DB 10GB+ → Turso Scaler ($29)
- 이메일 3k+/월 → Resend Pro ($20)

---

## 1. 전체 배포 아키텍처

```
사용자 (브라우저)
     │ HTTPS
     ▼
sasang.onnuriclinic.com   ← Cloudflare DNS (proxy ON)
     │ CNAME → cname.vercel-dns.com
     ▼
Vercel Edge Network
 ├─ Next.js App (서버 컴포넌트·API)
 │    ├─ Auth.js (Resend SMTP)
 │    ├─ 미들웨어: 사이트 비밀번호 게이트
 │    └─ 환경변수: TURSO_URL, AUTH_SECRET, ...
 │
 ├─ Turso libSQL  ← DB (원격 SQLite, 다지역 복제)
 │    └─ Drizzle ORM (코드 그대로)
 │
 ├─ Fly.io MeiliSearch  ← 전문 검색 (Phase 3 도입)
 │
 ├─ Cloudflare R2  ← 강의록 PDF 원본
 │
 └─ Resend  ← 이메일 magic link 발송
```

### 1.1 왜 이 조합인가
- **Vercel + Next.js**: Vercel은 Next.js 자체 제작사. 빌드·캐싱·이미지 최적화 자동.
- **Turso**: SQLite의 wire protocol을 그대로 쓰면서 클라우드 호스팅. better-sqlite3 → libSQL 클라이언트 1줄 교체로 변환.
- **Cloudflare DNS**: 이미 사용 중. Vercel은 Cloudflare proxy(orange cloud)와 호환됨 (단, "Full strict" SSL 모드 권장).
- **모두 무료 티어**로 시작 가능. 트래픽 늘면 같은 서비스에서 유료로 업그레이드만 하면 됨.

---

## 2. 준비 항목 3분류

### A. 즉시 가능 (제가 처리한 것)
이미 작성됨 — `사상의학/deployment-prep/` 폴더 안:
- ✅ 본 가이드 (DEPLOYMENT_GUIDE.md)
- ✅ 사용자 액션 체크리스트 (USER_ACTION_CHECKLIST.md)
- ✅ vercel.json 템플릿
- ✅ .env.production.example
- ✅ middleware.ts 템플릿 (사이트 비밀번호)
- ✅ GitHub Actions CI 워크플로
- ✅ 면책·개인정보처리방침 한국어 초안

### B. 사용자 액션 필요 (당신이 해야 할 일)
계정 생성·결제수단 등록·DNS 변경 등 — `USER_ACTION_CHECKLIST.md` 참고. 핵심:
- Vercel · Turso · Resend · Cloudflare R2 계정 생성 (모두 무료, GitHub OAuth로 가입 가능)
- Cloudflare DNS에서 CNAME 추가
- 환경변수 값 채우기

### C. 코드 작성 후 가능 (Claude Code 작업 완료 후)
- 실제 `vercel deploy` 실행
- DB 마이그레이션 실행
- 검색 인덱스 빌드
- 도메인 연결

---

## 3. Phase별 배포 절차

### Phase A — 사전 준비 (코드 작성 전)
1. **계정 생성** — `USER_ACTION_CHECKLIST.md` §1 따라 진행. 약 30분.
2. **GitHub 저장소 생성** — `kimhungtae/sasang-platform` 빈 저장소.
3. **DNS 준비** — Cloudflare에서 `sasang` 서브도메인 CNAME 레코드 추가 (값은 Vercel 연결 후 받음, 일단 자리만 만들기).

### Phase B — 첫 배포 (T1 직후)
Claude Code가 Next.js 부트스트랩 끝내고 GitHub에 push하면:
1. **Vercel에서 Import**: github.com/kimhungtae/sasang-platform 임포트.
2. **Framework Preset**: Next.js (자동 감지).
3. **환경변수 추가**: `.env.production.example` 참고하여 Vercel 대시보드에 입력.
4. **Deploy 클릭** → 90초 후 `sasang-platform.vercel.app` 노출.
5. **도메인 연결**: Vercel 프로젝트 → Domains → `sasang.onnuriclinic.com` 추가 → Cloudflare DNS에 CNAME 입력.

### Phase C — 데이터 시드 (T8 완료 후)
처방 DB·체질설문지 ETL이 끝나면:
1. **Turso DB 생성**: `turso db create sasang-prod`
2. **마이그레이션**: `turso db shell sasang-prod < db/migrations/*.sql`
3. **시드**: 로컬에서 `TURSO_URL=... npm run db:seed` 실행

### Phase D — 검색 (Phase 3 시점)
1. Fly.io에 MeiliSearch 컨테이너 배포
2. `npm run search:reindex` 실행
3. Vercel 환경변수 `MEILI_HOST` 업데이트

### Phase E — 공개 (Phase 4 시점, 필요할 때)
1. 미들웨어 비밀번호 게이트 해제 (또는 일반인 영역만 통과시키도록 수정)
2. 로보츠 허용 (`robots.txt` 업데이트)
3. SEO 메타·OG 이미지 추가
4. 분석 도구 추가 (Vercel Analytics 무료 / Plausible 유료)

---

## 4. 도메인 연결 상세

### 4.1 Cloudflare DNS 설정
1. Cloudflare 로그인 → `onnuriclinic.com` 선택 → DNS → Records
2. **CNAME 추가**:
   - Name: `sasang`
   - Target: `cname.vercel-dns.com`
   - Proxy status: **Proxied** (오렌지 클라우드 ON)
   - TTL: Auto
3. SSL/TLS → Overview → **Full (strict)** 확인 (Flexible은 무한 리다이렉트 위험)

### 4.2 Vercel 도메인 추가
1. Vercel 프로젝트 → Settings → Domains
2. `sasang.onnuriclinic.com` 입력 → Add
3. Vercel이 검증 완료하면 자동 SSL 발급

### 4.3 검증
- `https://sasang.onnuriclinic.com` 접속 시 사이트 로딩
- HTTPS 자물쇠 아이콘 정상
- DNS 전파는 보통 1~5분, 최대 24시간

---

## 5. 환경변수 (Vercel 대시보드에 입력)

`.env.production.example` 파일에 모든 항목 정리됨. 주요:

| 변수 | 값 출처 | 필수? |
|---|---|---|
| `TURSO_DATABASE_URL` | Turso 대시보드 | ✅ |
| `TURSO_AUTH_TOKEN` | Turso 대시보드 | ✅ |
| `AUTH_SECRET` | `openssl rand -base64 32` | ✅ |
| `AUTH_URL` | `https://sasang.onnuriclinic.com` | ✅ |
| `RESEND_API_KEY` | Resend 대시보드 | ✅ |
| `RESEND_FROM` | `noreply@onnuriclinic.com` 또는 Resend 검증 도메인 | ✅ |
| `SITE_PASSWORD` | 임의로 정함 (강력한 문자열) | ✅ (게이트용) |
| `ADMIN_EMAIL` | `epaphrokim@gmail.com` | ✅ |
| `MEILI_HOST` | Fly.io URL | Phase 3부터 |
| `MEILI_KEY` | Fly.io 시작 시 생성 | Phase 3부터 |
| `R2_ENDPOINT` | Cloudflare R2 | Phase 3부터 |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 | Phase 3부터 |
| `R2_SECRET_KEY` | Cloudflare R2 | Phase 3부터 |

---

## 6. 보안 체크리스트

### 6.1 자동 적용 (Vercel)
- ✅ HTTPS (Let's Encrypt 자동)
- ✅ HTTP/2, Brotli 압축
- ✅ DDoS 기본 방어

### 6.2 코드로 추가 (Claude Code 작업)
- [ ] `next.config.mjs`에 보안 헤더 (CSP, X-Frame-Options, HSTS) — `configs/next-config-security.mjs` 참고
- [ ] 미들웨어 사이트 비밀번호 게이트 — `configs/middleware.ts`
- [ ] Rate limiting (Upstash Redis 무료 티어, 향후)
- [ ] RBAC: 라우트별 `requireRole()` 가드
- [ ] CSRF: Auth.js 기본 보호
- [ ] 입력 검증: 모든 API에 zod 스키마

### 6.3 수동 운영
- [ ] 환경변수에 민감한 값은 절대 코드에 커밋 X
- [ ] `.env.local`, `.env.production`은 `.gitignore`
- [ ] PAT·API 키는 Vercel·GitHub Secrets에만
- [ ] Cloudflare에서 "Always Use HTTPS" ON
- [ ] DB 백업: Turso는 자동 백업 (Hobby는 7일 보관)

---

## 7. 법적·정책 문서

배포 전 반드시 작성:
- ✅ **이용약관 (Terms of Service)** — `legal/terms.md` 초안 제공
- ✅ **개인정보처리방침 (Privacy Policy)** — `legal/privacy.md` 초안 제공
- ✅ **의료 면책 고지 (Medical Disclaimer)** — `legal/disclaimer.md` 초안 제공
- [ ] 자료 출처·저작권 명세 — 코드 작업 시 `docs/data-sources.md`에 누적 작성

면책 고지는 결과 페이지마다 노출되어야 하므로 `<Disclaimer />` 컴포넌트로 통일.

---

## 8. 모니터링 (선택, 무료)

- **Vercel Analytics**: 기본 활성화. 페이지뷰·웹 vitals 무료
- **Sentry** (선택): 에러 추적, 개발자 1인 무료
- **Plausible/Umami** (선택): 사생활 친화적 분석, 자체 호스팅 가능

Phase 1에선 Vercel Analytics만 충분.

---

## 9. 운영 비용 시뮬레이션

| 시나리오 | Vercel | Turso | Resend | Fly.io | R2 | 도메인 | 합계 |
|---|---|---|---|---|---|---|---|
| **MVP (사용자 ≤10)** | $0 | $0 | $0 | $0 | $0 | $0 | **$0/월** |
| 한의사 50명 + DB 5GB | $0 | $0 | $0 | $0 | $0 | $0 | **$0/월** |
| 일반 공개 + 트래픽 月 10만 | $0 | $0 | $0 | $0 | $0 | $0 | **$0/월** (한도 내) |
| 트래픽 月 100만 | $20 (Pro) | $0 | $0 | $0 | $0 | $0 | $20/월 |
| DB 9GB 초과 | $20 | $29 (Scaler) | $0 | $0 | $0 | $0 | $49/월 |
| 이메일 3k 초과 | $20 | $29 | $20 (Pro) | $0 | $0 | $0 | $69/월 |

Vercel Hobby의 한도(월 100GB 대역폭, 100GB-시간 함수)는 의외로 크다. 실제 한의사 1만 명이 매일 써도 무료로 충분한 경우가 많음.

---

## 10. 배포 전 최종 점검 (Go/No-Go 체크리스트)

배포 직전 모두 ✅인지 확인:

### 코드 품질
- [ ] `npm run build` 성공
- [ ] `npm run test` 통과
- [ ] `npm run lint` 통과
- [ ] Lighthouse 모바일 > 90

### 보안
- [ ] 모든 환경변수가 Vercel에 입력됨
- [ ] `.env*` 파일이 `.gitignore`에 있음
- [ ] 미들웨어 사이트 비밀번호 동작 확인
- [ ] RBAC 동작 확인 (일반 사용자가 처방 페이지 접근 시 403)

### 데이터
- [ ] 처방 DB 시드 완료 (352±α 개)
- [ ] 자가진단 28문항 정상 로드
- [ ] 4체질 섭생 가이드 페이지 노출

### 법적
- [ ] 면책 고지 컴포넌트 결과·공개 페이지 노출
- [ ] 이용약관·개인정보처리방침 페이지 존재
- [ ] 푸터에 운영자 정보·연락처

### 인프라
- [ ] sasang.onnuriclinic.com 정상 접속
- [ ] HTTPS 자물쇠 정상
- [ ] DB 백업 활성화 확인
- [ ] 운영자 본인 admin 계정 로그인 가능

---

## 11. 비상 대응

### 사이트 다운 시
1. Vercel 대시보드 → Deployments → 이전 배포로 Rollback (1 클릭)
2. GitHub에서 마지막 안정 커밋으로 revert
3. Cloudflare DNS는 그대로 두기 (DNS는 잘 안 깨짐)

### DB 손상 시
- Turso는 자동 백업 7일 보관 → `turso db restore` 명령으로 복원
- 로컬 SQLite 파일 백업본 보관 권장 (월 1회)

### 비용 폭발 방지
- Vercel: Settings → Usage → Spending Cap 설정 (예: $0 → 한도 초과 시 자동 중지)
- Turso: 무료 한도 도달 알림 이메일
- Resend: 무료 한도 초과 시 발송 중단

---

## 12. 다음 단계

1. **즉시**: `USER_ACTION_CHECKLIST.md` 첫 5개 항목(계정 생성) 진행
2. **Claude Code 작업 시작 후 T1 완료 시**: 첫 Vercel 배포
3. **T8 완료 시**: Turso 시드
4. **Phase 3 진입 시**: MeiliSearch + R2 활성화
5. **Phase 4 또는 외부 공개 결정 시**: 사이트 비밀번호 해제 + SEO 활성화

---

**문서 끝**. 첨부 파일: `USER_ACTION_CHECKLIST.md`, `configs/*`, `legal/*`
