# 사상의학 플랫폼 — 사용자 액션 체크리스트

> **당신(운영자)이 직접 해야 할 일** 목록. 위에서 아래로 순서대로 진행.
> 각 항목 옆 박스에 체크(`[x]`)하며 진행 상황 추적.

---

## 1. 계정 생성 (약 30분)

모두 **GitHub OAuth로 가입 가능** → 별도 비밀번호 안 만들어도 됨.

### 1.1 GitHub 저장소 생성
- [ ] github.com 로그인 (kimhungtae)
- [ ] "New repository" → 이름: **sasang-platform**
- [ ] **Private**으로 설정 (공개해도 무방하나, 초기에는 비공개 권장)
- [ ] Description: "사상의학 디지털 플랫폼"
- [ ] **Initialize 옵션 모두 OFF** (README/.gitignore 생성 X — Claude Code가 만들 것)
- [ ] Create 클릭
- [ ] 생성된 저장소 URL 메모: `https://github.com/kimhungtae/sasang-platform`

### 1.2 Vercel 가입
- [ ] vercel.com 접속 → "Sign Up" → **Continue with GitHub**
- [ ] 권한 승인 (Vercel이 GitHub 저장소 접근)
- [ ] 플랜 선택: **Hobby (Free)**
- [ ] (지금은 import 안 함 — Claude Code가 첫 배포 준비 끝나면 그때 import)

### 1.3 Turso 가입 (데이터베이스)
- [ ] turso.tech 접속 → "Get started" → **Continue with GitHub**
- [ ] 무료 플랜 자동 적용 (Starter)
- [ ] CLI 설치 (운영자 PC, 1회):
  ```powershell
  # Windows PowerShell (관리자)
  irm get.tur.so/install.ps1 | iex
  ```
- [ ] `turso auth login` 실행 → 브라우저 인증
- [ ] `turso db create sasang-prod` 실행 (DB 생성)
- [ ] 발급된 정보 메모 (Claude Code에 전달용):
  - `TURSO_DATABASE_URL`: `libsql://sasang-prod-kimhungtae.turso.io`
  - `TURSO_AUTH_TOKEN`: `turso db tokens create sasang-prod` 명령으로 발급
- [ ] **두 값을 안전한 곳에 저장** (1Password, Bitwarden 등)

### 1.4 Resend 가입 (이메일 발송)
- [ ] resend.com 접속 → "Sign up" → **Continue with GitHub**
- [ ] 무료 플랜 자동 적용 (월 3,000건)
- [ ] **Domains** 메뉴 → "Add Domain"
- [ ] `onnuriclinic.com` 입력
- [ ] Resend가 제공하는 DNS 레코드 (TXT/MX/DKIM) 메모
- [ ] **Cloudflare DNS** 가서 위 레코드들을 추가 (CNAME/TXT)
  - 이미 onnuriclinic.com이 Cloudflare에 있으므로 DNS Records에서 Add
- [ ] Resend 대시보드에서 "Verify" 클릭 → 검증 완료까지 5~30분 대기
- [ ] **API Keys** → "Create API Key" → Permission: Sending → 이름: "sasang-prod"
- [ ] 발급된 키(`re_...`) 안전한 곳에 저장 → `RESEND_API_KEY` 값
- [ ] 발신자 주소 결정: `noreply@onnuriclinic.com` 또는 `사상온누리 <noreply@onnuriclinic.com>` 권장

### 1.5 Cloudflare 계정 (이미 있음)
- [ ] cloudflare.com 로그인 (onnuriclinic.com 관리하는 계정)
- [ ] R2 활성화 필요 (강의록 PDF 저장용, Phase 3에서) — 지금은 SKIP
- [ ] DNS Records 페이지 미리 열어두기 (다음 단계에서 사용)

### 1.6 (선택) Fly.io 가입 (검색 서버용, Phase 3에서)
- [ ] **지금은 SKIP**. Phase 3 진입 시 진행.

---

## 2. DNS 준비 (약 5분)

Vercel 첫 배포가 끝난 다음에 진행. **지금은 §3 먼저**.

체크리스트 (나중에 사용):
- [ ] Cloudflare 로그인 → onnuriclinic.com → DNS → Records
- [ ] **Add record**:
  - Type: **CNAME**
  - Name: **sasang**
  - Target: **cname.vercel-dns.com**
  - Proxy status: **Proxied** (오렌지 클라우드 ON)
  - TTL: Auto
- [ ] Save
- [ ] **SSL/TLS** 메뉴 → Overview → **Full (strict)** 선택 확인
- [ ] 5분 후 `https://sasang.onnuriclinic.com`이 Vercel을 가리키는지 확인

---

## 3. 비밀번호·시크릿 생성 (약 5분)

배포 환경변수에 들어갈 값들. **모두 한 곳에 모아두기** (예: 메모장, 1Password Secure Note).

### 3.1 AUTH_SECRET
Auth.js 세션 암호화 키.
- [ ] PowerShell에서 실행:
  ```powershell
  [Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
  ```
- [ ] 결과 문자열 저장 → `AUTH_SECRET` 값

### 3.2 SITE_PASSWORD
사이트 전체에 1차 비밀번호 게이트 — 운영자가 한의사들에게만 알려주는 비밀번호.
- [ ] 강력한 문자열 생성 (예: `sasang-2026-onnuri-secure-AB7q`)
- [ ] 저장 → `SITE_PASSWORD` 값
- [ ] 한의사들에게 안전한 채널로만 공유

### 3.3 ADMIN_EMAIL
운영자 자동 admin 권한 부여용.
- [ ] 값: `epaphrokim@gmail.com`

---

## 4. 환경변수 정리 (요약)

`.env.production.example` 파일의 모든 값을 채워서 별도 보관:

```
TURSO_DATABASE_URL=libsql://sasang-prod-kimhungtae.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJ...
AUTH_SECRET=<§3.1 결과>
AUTH_URL=https://sasang.onnuriclinic.com
RESEND_API_KEY=re_<§1.4 결과>
RESEND_FROM=noreply@onnuriclinic.com
SITE_PASSWORD=<§3.2 결과>
ADMIN_EMAIL=epaphrokim@gmail.com
```

이 값들을 **Vercel 대시보드 → Settings → Environment Variables**에 하나씩 입력 (첫 배포 시점).

---

## 5. Claude Code 시작 준비

다음 정보를 Claude Code 첫 세션에 제공:
- [ ] DEVELOPMENT_GUIDE.md 위치 알려주기
- [ ] PLATFORM_DESIGN.md 위치 알려주기
- [ ] 빈 GitHub 저장소 URL: `https://github.com/kimhungtae/sasang-platform.git`
- [ ] "T1부터 시작해줘" 또는 "DEVELOPMENT_GUIDE 따라서 진행해줘"

---

## 6. 첫 배포 (Claude Code T1 완료 후 — 같이 할 일)

Claude Code가 첫 push를 끝내면 즉시:

### 6.1 Vercel Import
- [ ] vercel.com/new → **Import Git Repository**
- [ ] kimhungtae/sasang-platform 선택 → Import
- [ ] **Framework Preset**: Next.js (자동 감지)
- [ ] **Root Directory**: ./ (기본)
- [ ] **Environment Variables**: §4의 모든 값 한 번에 입력
  - 각 변수에 대해 Add → 이름·값 입력
  - Environment: **Production**, **Preview**, **Development** 모두 체크
- [ ] **Deploy** 클릭
- [ ] 90초 후 임시 URL(`sasang-platform-xxx.vercel.app`) 노출 확인

### 6.2 도메인 연결
- [ ] Vercel 프로젝트 → Settings → Domains
- [ ] **Add** → `sasang.onnuriclinic.com` 입력
- [ ] Vercel이 DNS 확인 안내 → §2의 CNAME 레코드 추가 (이미 했으면 자동 검증)
- [ ] "Valid Configuration" 표시 확인
- [ ] `https://sasang.onnuriclinic.com` 접속 → 사이트 비밀번호 입력 페이지 노출 확인

---

## 7. Phase별 추가 액션 (나중에)

### Phase B (T8 완료, 처방 데이터 시드 후)
- [ ] 로컬에서 `TURSO_DATABASE_URL=... npm run db:seed` 실행
- [ ] Turso 대시보드에서 처방 row 수 확인 (352개 ±α)

### Phase 3 진입 시
- [ ] Fly.io 계정 생성 (`fly auth signup`)
- [ ] `fly launch --image getmeili/meilisearch:latest` 실행
- [ ] Cloudflare R2 활성화 → 버킷 생성 → API 토큰 발급
- [ ] 강의록 PDF를 R2에 업로드

### Phase 4 또는 외부 공개 결정 시
- [ ] 미들웨어 비밀번호 게이트 수정 또는 해제
- [ ] robots.txt 공개 모드
- [ ] OG 이미지·메타 추가
- [ ] (선택) Vercel Pro 업그레이드 검토

---

## 8. 정기 운영 점검 (월 1회 권장)

- [ ] Vercel 대시보드 Usage 확인 (대역폭·함수 시간)
- [ ] Turso 대시보드 DB 크기 확인
- [ ] Resend 발송 건수 확인 (월 3k 한도)
- [ ] 로컬 DB 백업: `turso db shell sasang-prod ".dump" > backup-YYYYMMDD.sql`
- [ ] 보안 업데이트: `npm audit fix`
- [ ] PAT 만료일 점검 (현재 2027-05-07)

---

## 체크리스트 진행 상황

총 6개 섹션:
- [ ] §1 계정 생성 (5~6개 서비스)
- [ ] §2 DNS 준비
- [ ] §3 비밀번호·시크릿 생성
- [ ] §4 환경변수 정리
- [ ] §5 Claude Code 시작 준비
- [ ] §6 첫 배포

§1~§5까지 끝나면 코드 작업 시작 가능 상태.
§6은 Claude Code의 T1 완료 시점에 진행.

---

**막히면**: 본 문서 + DEPLOYMENT_GUIDE.md 들고 Claude(Cowork)에게 물어보면 됩니다.
