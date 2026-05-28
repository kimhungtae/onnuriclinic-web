# 사상의학 플랫폼 — Claude Code 개발지침서 (v2)

> **이 문서의 정체**: Claude Code가 새 프로젝트 폴더에서 작업을 시작할 때 가장 먼저 읽는 마스터 가이드. 코딩에 필요한 모든 결정사항·관례·작업 큐가 들어있다.
>
> **버전**: **v2.0** · **개정일**: 2026-05-18

---

## 🆕 v2 개정 공지 — 진행 중인 Claude Code 작업에 영향 있음

**v1 대비 변경된 핵심 사항** (Claude Code가 작업 중이면 다음을 즉시 확인):

### 변경 1 — 사용자 역할: 5계층 → **3계층**
| v1 | v2 |
|---|---|
| guest / public / student / clinician / admin | **shared (게이트만, 비로그인 가능)** / **manager (카운터·원장실 통합)** / **admin (운영자)** |

### 변경 2 — 실시간 동기화 요건 추가
- 환자가 **공유사이트(키오스크)** 에서 설문 제출 → **카운터·원장실의 매니저 화면이 동시에 결과 노출**
- 구현: 폴링(3초 간격) 기반 라이브 큐. 향후 Pusher/SSE로 업그레이드 가능

### 변경 3 — 데이터 영구 보관
- 환자 설문 응답·결과를 **영구 저장** (개인정보 동의 후)
- 환자 식별: 이름·성별·연령(+선택 전화번호)으로 동일인 누적 이력 추적
- 자동 삭제 로직 **제거**. PIPA 권리에 따른 명시적 요청 시에만 삭제.

### 변경 4 — 네트워크 접근 제어
- **공유사이트**: 한의원 내부 IP만 접근 (Cloudflare IP allowlist 또는 미들웨어 검증)
- **매니저·어드민**: 어디서든 로그인 후 접근 (재택·외출 시 차트 조회 가능)

### 이미 작업된 항목에 대한 영향
| v1 작업 단계 | v2 영향 | 조치 |
|---|---|---|
| T1 부트스트랩 | 영향 없음 | 그대로 사용 |
| T2 DB 스키마 | **테이블 추가·수정 필요** | §5.2 신규 스키마 적용 |
| T3 설문 ETL | 영향 없음 | 그대로 사용 |
| T4 자가진단 UI | **환자 정보 입력·동의 화면 추가** | §8 T4 수정사항 참조 |
| T5 결과 API | **DB 영구 저장으로 변경 + broadcast 호출 추가** | §8 T5 수정사항 참조 |
| T6 섭생 가이드 | 영향 없음 | 그대로 사용 |
| T7 인증 | **역할 5종 → 2종(manager·admin)** | §8 T7 수정사항 참조 |
| T8 처방 ETL | 영향 없음 | 그대로 사용 |
| T9 처방 검색 | **`(clinician)` 라우트 → `(manager)`로 이름 변경** | §5 폴더 구조 참조 |
| T10~T12 | 부분 수정 | 각 항목 참조 |

**Claude Code 진행 중인 작업자에게**: 이 v2 문서를 그대로 읽고, 위 영향표에 따라 코드 수정 후 진행. 의문점은 §19 변경 이력 + §16~§18 새 섹션 참조.

---

## 0. TL;DR — Claude Code가 한눈에 알아야 할 것

| 항목 | 값 |
|---|---|
| 프로젝트명 | **sasang-platform** (사상의학 + 한의원 진료 보조 플랫폼) |
| 운영자 | kim (epaphrokim@gmail.com, GitHub: kimhungtae) |
| 한의원 | 온누리한의원 (경기 수원시 권선구) |
| 새 프로젝트 폴더 | `C:\Users\ADmiN\Downloads\sasang-platform\` |
| GitHub | `kimhungtae/sasang-platform` |
| 호스팅 | Vercel + Turso libSQL + Resend (모두 무료 티어) |
| 도메인 | `sasang.onnuriclinic.com` |
| **사용자 3계층** | **shared(키오스크) · manager(카운터+원장실) · admin(운영자)** |
| **실시간 동기화** | 폴링 3초 간격 (Phase 1) → Pusher 옵션 (Phase 3) |
| **데이터 보관** | 영구 (환자 동의 후, PIPA 권리 요청 시만 삭제) |
| **공유사이트 접근** | 한의원 내부 IP만 |
| **매니저·어드민 접근** | 로그인 후 어디서든 |
| 기술 스택 | Next.js 14 + TypeScript + Drizzle(libSQL) + Tailwind/shadcn + Auth.js |
| 마스터 설계 | `사상의학\PLATFORM_DESIGN.md` (참고, 일부 v2와 차이) |
| 배포 준비 | `사상의학\deployment-prep\` 폴더 일체 |
| 첫 세션 진입점 | §13 → §8 작업 큐 |

---

## 1. 프로젝트 정체성 (v2 개정)

### 1.1 실제 사용 시나리오 — 한의원 진료 워크플로

```
[1] 환자 도착 → 카운터에서 태블릿/PC(키오스크) 안내
[2] 환자가 공유사이트에서 자가진단 시작
    └─ 동의 화면 → 인적 정보(이름·성별·나이) → 28문항 응답
[3] 환자가 제출하는 순간:
    ├─ 환자 화면: 결과 + 면책 + 섭생 가이드 안내
    ├─ 카운터 매니저 화면: 라이브 큐에 환자 추가 (실시간)
    └─ 원장실 매니저 화면: 동일 큐에 환자 추가 (실시간)
[4] 원장이 진료 시작 → 매니저 화면에서 해당 환자 클릭
    └─ 자가진단 결과 + 한의사용 부가 정보(처방 후보·변증 가이드) 표시
[5] 진료 종료 후 원장이 진료 메모 입력 → 환자 이력에 누적 저장
[6] 같은 환자 재방문 시:
    └─ 매니저가 이름·생년월일 등으로 검색 → 과거 자가진단·진료 이력 확인
```

### 1.2 사용자 3계층
- **shared (공유사이트, 비로그인)**:
  - 한의원 키오스크 또는 환자 본인 휴대폰
  - 자가진단·결과 보기·섭생 안내까지 가능
  - 처방·본초·진료 메모 접근 불가
  - 한의원 내부 IP 또는 일회용 환자 토큰으로만 접근 (외부 무단 접근 차단)
- **manager (매니저, 로그인 필수)**:
  - 카운터 직원·원장 모두 같은 역할
  - 라이브 큐 보기, 환자 이력 조회, 처방·본초·변증 가이드 접근
  - 진료 메모 작성·환자 정보 수정
  - 한의사 자격은 manager 안의 sub-permission으로 (v2.1에서 분리 검토)
- **admin (어드민, 로그인 필수)**:
  - 모든 manager 권한 +
  - 사용자(매니저) 추가·삭제·권한 변경
  - 콘텐츠(처방·본초·변증·강의록) 편집
  - 시스템 설정·환경변수 관리
  - 데이터 백업·내보내기
  - 운영자(kim) 본인이 admin

### 1.3 학생·일반인은?
- **v1의 student / public 역할은 v2에서 제외**. 사상의학 학습용 외부 사이트는 별도 프로젝트로 분리하거나 v2.1 이후 다시 검토.
- 현재 목표는 **한의원 진료 보조 도구**로 좁힘.

### 1.4 기존 onnuri-site와의 관계
- 별개 프로젝트. 같은 도메인의 서브(`sasang.onnuriclinic.com`)지만 다른 코드베이스.
- onnuri-site의 v23.html은 참고 자료(채점 알고리즘·UX 패턴).

---

## 2. 참조 문서 맵

| 문서 | 위치 | 용도 |
|---|---|---|
| **PLATFORM_DESIGN.md** | `onnuri-site\사상의학\PLATFORM_DESIGN.md` | 마스터 설계 (단, 역할 모델은 v2와 차이 — 본 문서가 우선) |
| **DEVELOPMENT_GUIDE.md** | **본 문서 v2** | 실행 지침. 작업 시작점. |
| 배포 가이드 | `onnuri-site\사상의학\deployment-prep\` | Vercel/Turso/도메인 설정 |
| 체질설문지 원본 | `onnuri-site\사상의학\체질설문지.txt` (CP949) | 28문항 시드 |
| 류주열 처방 | `onnuri-site\사상의학\류주열사상처방개정판.xlsx` | 처방 DB 시드 |
| 장부변증 5종 | `onnuri-site\사상의학\새로 쓴 사상의학 장부변증 [폐비간신심]병.hwp` | 변증 트리 시드 |
| 본초 자료 | `onnuri-site\사상의학\안준철 원장님 자료.zip\사상본초...` | 본초 사전 시드 |
| 섭생법 4종 | `onnuri-site\사상의학\[태양/태음/소양/소음]인 섭생법.hwp` | 결과 페이지 섭생 안내 |
| v23.html 참고 | `onnuri-site\온누리_사상체질_감별설문지_v23.html` | 채점·UX 참조 |

---

## 3. 기술 스택

### 3.1 핵심 의존성 (v2 그대로 + 실시간 추가)

```json
{
  "node": ">=20.10",
  "packages": {
    "next": "14.2.x",
    "react": "18.3.x",
    "typescript": "5.4.x",
    "tailwindcss": "3.4.x",
    "drizzle-orm": "latest",
    "@libsql/client": "latest",
    "next-auth": "5.x (Auth.js)",
    "@auth/drizzle-adapter": "latest",
    "zod": "latest",
    "recharts": "latest",
    "resend": "latest",
    "swr": "latest (v2: 라이브 큐 폴링용)"
  },
  "devTools": {
    "drizzle-kit": "latest",
    "vitest": "latest",
    "@playwright/test": "latest",
    "eslint": "latest",
    "prettier": "latest"
  }
}
```

### 3.2 변경점 (v1 대비)
- ❌ `better-sqlite3` → **`@libsql/client`** (Turso 호환)
- ✅ `swr` 추가 (라이브 큐 폴링)
- ⏳ `meilisearch` 의존성은 Phase 3에서 추가 (지금 설치할 필요 없음)
- ⏳ `pusher-js` 등 실시간 라이브러리는 Phase 3 옵션

### 3.3 실시간 동기화 전략 (Phase 1: 폴링)

```
┌─── 환자 키오스크 ───┐         ┌─── 매니저 화면(카운터+원장실) ───┐
│ POST /api/quiz/score │ ─────▶ │ GET /api/manager/queue (3초마다)  │
│   (응답 저장+broadcast│        │   ← 최근 N분 내 신규 응답 반환    │
└─────────────────────┘         └───────────────────────────────────┘
                                          ↑
                          SWR 자동 갱신 (refreshInterval: 3000)
```

- 첫 단계는 **단순 폴링**. Vercel Hobby의 함수 호출 한도(100k/일) 내에서 충분.
- 매니저 화면 3대 × 3초 폴링 × 8시간 영업 = 28,800 req/일 → 한도의 28%
- 한 명이 5명 이상 동시 폴링하면 Pusher 등으로 이전 고려 (Phase 3)

---

## 4. 초기 셋업 (One-Time Bootstrap)

### 4.1 첫 실행 명령 시퀀스

```powershell
cd C:\Users\ADmiN\Downloads
mkdir sasang-platform
cd sasang-platform

# 1. Next.js 스캐폴드
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbo

# 2. shadcn/ui
npx shadcn-ui@latest init -y

# 3. 핵심 의존성 (v2)
npm i drizzle-orm @libsql/client zod recharts next-auth@beta @auth/drizzle-adapter resend swr
npm i -D drizzle-kit vitest @playwright/test prettier

# 4. shadcn 컴포넌트
npx shadcn-ui@latest add button card input label select tabs dialog alert form badge progress table avatar

# 5. Git
git init
git add -A
git commit -m "chore: bootstrap Next.js + shadcn + drizzle (v2)"
git remote add origin https://github.com/kimhungtae/sasang-platform.git
git branch -M main
git push -u origin main
```

### 4.2 환경 변수 (`.env.local`)

```env
# DB (Turso) — 운영자가 turso CLI로 발급한 값
TURSO_DATABASE_URL=libsql://sasang-prod-kimhungtae.turso.io
TURSO_AUTH_TOKEN=eyJ...

# 로컬 개발 시: file:./db/sasang.db 도 사용 가능 (Drizzle libSQL이 둘 다 지원)

# Auth.js
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Resend (이메일 magic link)
RESEND_API_KEY=re_xxx
RESEND_FROM="사상온누리 <noreply@onnuriclinic.com>"

# 사이트 게이트 (공유사이트 IP 제한 보조)
SITE_PASSWORD=optional-extra-gate-password
SITE_GATE_DAYS=30

# 한의원 IP 화이트리스트 (콤마 구분, 공유사이트 보호용)
# 운영자가 한의원 공인 IP 확인 후 입력 (예: whatismyip.com 에서 확인)
CLINIC_ALLOWED_IPS=

# 운영자
ADMIN_EMAIL=epaphrokim@gmail.com

# 운영 모드
SITE_MODE=internal
```

---

## 5. 폴더 구조 (v2)

```
sasang-platform/
├── CLAUDE.md                          ← 본 문서 v2 사본
├── app/
│   ├── (shared)/                      🆕 키오스크·공개 영역 (역할: shared)
│   │   ├── page.tsx                   # 키오스크 홈
│   │   ├── consent/page.tsx           # 개인정보 동의
│   │   ├── intake/page.tsx            # 환자 정보 입력
│   │   ├── quiz/
│   │   │   ├── page.tsx               # 자가진단 안내
│   │   │   └── [step]/page.tsx        # 문항 진행
│   │   ├── result/[sessionId]/page.tsx  # 환자 본인 결과
│   │   └── guide/[constitution]/page.tsx # 섭생 안내
│   │
│   ├── (manager)/                     🆕 카운터·원장실 통합 대시보드
│   │   ├── layout.tsx                 # 인증 가드 (role=manager 이상)
│   │   ├── page.tsx                   # 대시보드 홈 (라이브 큐)
│   │   ├── queue/page.tsx             # 라이브 큐 전체
│   │   ├── patients/
│   │   │   ├── page.tsx               # 환자 검색·목록
│   │   │   └── [patientId]/
│   │   │       ├── page.tsx           # 환자 상세 (이력)
│   │   │       └── session/[sessionId]/page.tsx  # 특정 진료 세션
│   │   ├── prescriptions/page.tsx     # 처방 검색
│   │   ├── herbs/page.tsx             # 본초 사전
│   │   ├── organ-syndromes/page.tsx   # 장부변증 가이드
│   │   └── notes/[sessionId]/page.tsx # 진료 메모 작성
│   │
│   ├── (admin)/                       어드민 전용
│   │   ├── layout.tsx                 # 인증 가드 (role=admin)
│   │   ├── page.tsx                   # 어드민 홈
│   │   ├── users/page.tsx             # 매니저 계정 관리
│   │   ├── content/
│   │   │   ├── prescriptions/page.tsx
│   │   │   ├── herbs/page.tsx
│   │   │   └── syndromes/page.tsx
│   │   ├── settings/page.tsx          # 시스템 설정
│   │   └── backup/page.tsx            # DB 백업·내보내기
│   │
│   ├── _gate/page.tsx                 # 사이트 비밀번호 (선택, 추가 보호)
│   ├── auth/
│   │   ├── signin/page.tsx            # 매니저·어드민 로그인
│   │   └── error/page.tsx
│   ├── legal/
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── disclaimer/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── quiz/
│   │   │   ├── score/route.ts         # 채점·저장 + 라이브 큐 broadcast
│   │   │   └── consent/route.ts
│   │   ├── manager/
│   │   │   ├── queue/route.ts         # 🆕 라이브 큐 폴링 엔드포인트
│   │   │   ├── patients/route.ts
│   │   │   └── notes/route.ts
│   │   ├── admin/
│   │   │   └── users/route.ts
│   │   ├── prescriptions/route.ts
│   │   ├── herbs/route.ts
│   │   └── gate/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                            # shadcn
│   ├── quiz/
│   │   ├── question-card.tsx
│   │   ├── progress-bar.tsx
│   │   ├── result-chart.tsx
│   │   └── consent-form.tsx           🆕
│   ├── manager/
│   │   ├── live-queue.tsx             🆕 SWR 폴링 큐
│   │   ├── patient-card.tsx
│   │   └── session-detail.tsx
│   ├── prescription/
│   ├── disclaimer.tsx
│   └── role-gate.tsx
│
├── db/
│   ├── schema.ts                      🆕 v2 스키마 (§5.2)
│   ├── client.ts                      # libSQL + drizzle
│   ├── migrations/
│   └── sasang.db                      # 로컬 개발용 (.gitignore)
│
├── lib/
│   ├── auth.ts
│   ├── rbac.ts                        # requireRole('manager'|'admin')
│   ├── scoring.ts
│   ├── network.ts                     🆕 한의원 IP 검증
│   ├── broadcast.ts                   🆕 라이브 큐 푸시
│   └── encoding.ts
│
├── data/                              # ETL 산출물
├── scripts/                           # ETL 스크립트
├── public/
├── tests/
├── docs/
├── middleware.ts                      🆕 IP allowlist + 게이트
├── drizzle.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

### 5.1 라우트 그룹 컨벤션
- `(shared)` — 비로그인. 미들웨어가 IP 검증.
- `(manager)` — Auth.js 세션 + `role >= manager` 필수.
- `(admin)` — Auth.js 세션 + `role === admin` 필수.
- 셋 모두 같은 도메인(`sasang.onnuriclinic.com`)에서 라우트로만 분리.

### 5.2 데이터베이스 스키마 (v2, Drizzle)

```typescript
// db/schema.ts
import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

export type Constitution = "ty" | "te" | "sy" | "se";
export type Role = "manager" | "admin";  // shared는 비로그인이라 role 없음

// --- 사용자 (매니저·어드민만, 환자 X) ---
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  role: text("role").$type<Role>().notNull().default("manager"),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Auth.js 표준 테이블 (accounts, sessions, verification_tokens)
// → @auth/drizzle-adapter 기본 스키마 사용

// --- 환자 (지속 보관) 🆕 ---
export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),           // cuid()
  name: text("name").notNull(),
  gender: text("gender").$type<"M" | "F">(),
  birthYear: integer("birth_year"),       // 1985
  phoneLast4: text("phone_last4"),         // 식별 보조 (선택)
  notes: text("notes"),                    // 자유 메모
  consentVersion: text("consent_version").notNull(), // 동의서 버전
  consentedAt: integer("consented_at", { mode: "timestamp" }).notNull(),
  firstVisitAt: integer("first_visit_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastVisitAt: integer("last_visit_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// --- 설문지·문항 (변경 없음) ---
export const questionnaires = sqliteTable("questionnaires", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),  // 'adult28' | 'pediatric'
  version: text("version").notNull(),
  weightsJson: text("weights_json"),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  questionnaireId: text("questionnaire_id").notNull(),
  order: integer("order").notNull(),
  text: text("text").notNull(),
  isCore: integer("is_core", { mode: "boolean" }).notNull().default(false),
});

export const choices = sqliteTable("choices", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull(),
  order: integer("order").notNull(),
  label: text("label").notNull(),
  constitutionKey: text("constitution_key").$type<Constitution>().notNull(),
});

// --- 세션 (환자 1회 방문 = 1 세션) 🆕 ---
export const clinicSessions = sqliteTable("clinic_sessions", {
  id: text("id").primaryKey(),           // cuid()
  patientId: text("patient_id").notNull().references(() => patients.id),
  questionnaireId: text("questionnaire_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  // 라이브 큐 상태
  status: text("status").$type<"in_progress" | "submitted" | "reviewed" | "closed">().notNull().default("in_progress"),
  // 채점 결과 (제출 후 채워짐)
  resultTop: text("result_top").$type<Constitution>(),
  resultScoresJson: text("result_scores_json"),
  resultConfidence: real("result_confidence"),
  // 진료 메모 (매니저가 입력)
  reviewedBy: text("reviewed_by").references(() => users.id),
  clinicNote: text("clinic_note"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  // 메타
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// --- 응답 (개별 문항 답) ---
export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => clinicSessions.id),
  questionId: text("question_id").notNull(),
  choiceId: text("choice_id").notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// --- 처방 (변경 없음) ---
export const prescriptions = sqliteTable("prescriptions", {
  id: text("id").primaryKey(),              // L001, H001, ...
  constitution: text("constitution").$type<Constitution>().notNull(),
  name: text("name").notNull(),
  compositionCurrent: text("composition_current"),
  compositionLegacy: text("composition_legacy"),
  source: text("source"),
  indications: text("indications"),          // JSON 배열 문자열
  notes: text("notes"),
});

export const herbs = sqliteTable("herbs", {
  id: text("id").primaryKey(),              // HB-001
  name: text("name").notNull(),
  aliases: text("aliases"),                  // JSON
  constitutions: text("constitutions"),
  strengthClass: text("strength_class"),
  meridians: text("meridians"),
  natureFlavor: text("nature_flavor"),
  effects: text("effects"),
  commentary: text("commentary"),
});

export const prescriptionIngredients = sqliteTable("prescription_ingredients", {
  id: text("id").primaryKey(),
  prescriptionId: text("prescription_id").notNull().references(() => prescriptions.id),
  herbId: text("herb_id").references(() => herbs.id),
  herbNameRaw: text("herb_name_raw").notNull(), // 정규화 전 원본
  doseDon: real("dose_don"),
  version: text("version").$type<"current" | "legacy">().notNull().default("current"),
  order: integer("order").notNull(),
});

// --- 장부변증 (변경 없음, 추후 구현) ---
export const organs = sqliteTable("organs", { /* ... */ } as any);
export const syndromes = sqliteTable("syndromes", { /* ... */ } as any);

// --- 동의서 버전 (PIPA 준수) 🆕 ---
export const consentVersions = sqliteTable("consent_versions", {
  version: text("version").primaryKey(),    // 'v1-2026-05'
  text: text("text").notNull(),
  effectiveFrom: integer("effective_from", { mode: "timestamp" }).notNull(),
});

// --- 감사 로그 🆕 ---
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),         // 'patient.view' | 'session.review' | ...
  targetType: text("target_type"),
  targetId: text("target_id"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

---

## 6. 코딩 컨벤션 (변경 없음, 일부 추가)

### 6.1 RBAC 헬퍼 패턴 (v2)
```typescript
// lib/rbac.ts
export type Role = "manager" | "admin";

export async function requireRole(min: Role) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const roleOrder = { manager: 1, admin: 2 };
  if (roleOrder[session.user.role] < roleOrder[min]) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
```

### 6.2 환자 식별 정책 🆕
- 같은 이름의 다른 환자 구분: 이름 + 생년 + (선택) 전화 뒷 4자리
- 매니저가 새 환자 등록 시 중복 검색 강제
- 환자 ID는 cuid() (UUID v4보다 짧고 정렬 가능)

### 6.3 라이브 큐 정책 🆕
- `clinicSessions.status === "submitted"` 인 항목만 큐에 노출
- `status === "reviewed"` 또는 24시간 이상 지난 항목은 큐에서 제거 (필터)
- 매니저가 클릭하여 진료 시작 시 → `status="reviewed"`, `reviewedBy=user.id`

---

## 7. 데이터 마이그레이션 가이드 (변경 없음, §7 v1 그대로 사용)

[ETL 절은 v1과 동일. xlsx-to-prescriptions·txt-to-questionnaire 등.]

---

## 8. Phase 1 작업 큐 (v2 개정)

### T1 — 프로젝트 부트스트랩 ✅ (v1과 동일)
- §4.1 명령 시퀀스 실행
- 빈 Next.js 페이지 노출 확인

### T2 — DB 스키마 & 마이그레이션 ⚠️ v2 수정
- [ ] `db/schema.ts` → **§5.2 v2 스키마** 그대로 입력
- [ ] `db/client.ts` → libSQL 클라이언트 (not better-sqlite3):
  ```typescript
  import { drizzle } from "drizzle-orm/libsql";
  import { createClient } from "@libsql/client";
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  export const db = drizzle(client);
  ```
- [ ] `drizzle.config.ts` 설정 (dialect: "turso")
- [ ] `npm run db:generate` → `db:migrate`
- [ ] 신규 테이블 확인: users, patients, clinicSessions, answers, prescriptions, ...

### T3 — 체질설문지 ETL (v1과 동일)

### T4 — 자가진단 UI ⚠️ v2 수정 (공유사이트)
- [ ] 모든 라우트를 `app/(shared)/` 그룹에 배치
- [ ] **🆕 동의 화면 (`/consent`)**: 개인정보 수집·이용 동의 체크박스, 동의서 버전 표시
- [ ] **🆕 환자 정보 입력 (`/intake`)**: 이름·성별·연령·(선택)전화 뒷 4자리
  - 중복 환자 검색 (이름+생년) → 있으면 "이전 기록이 있습니다" 안내
  - 없으면 신규 patient row 생성
- [ ] 자가진단 라우트 (`/quiz/[step]`): 1문항/페이지, 진행률, 이전·다음
- [ ] 응답을 클라이언트 상태에 보관 (마지막에 일괄 전송)
- [ ] 모바일 반응형 (키오스크 태블릿 우선)

### T5 — 채점 API & 결과 페이지 ⚠️ v2 수정
- [ ] `POST /api/quiz/score`:
  - 입력: patientId, answers[], questionnaireId, consentVersion
  - 처리:
    1. clinicSession 생성 (status=submitted, submittedAt=now)
    2. answers 개별 저장
    3. 채점 → resultTop, resultScoresJson, resultConfidence 업데이트
    4. **broadcast** 호출 (lib/broadcast.ts) — Phase 1엔 단순히 DB 업데이트만, 매니저 화면은 풀로 폴링
- [ ] `/result/[sessionId]` 페이지 (shared 영역):
  - 환자 본인이 보는 결과 화면
  - Recharts 막대그래프 + 신뢰도 + 면책 고지
  - "원장님께 진료받으세요" 안내 (큐에 들어갔음을 확인)
- [ ] 면책 고지 컴포넌트 결과 페이지 상·하단 필수

### T6 — 4체질 섭생 가이드 페이지 (v1과 동일, shared 그룹에 배치)

### T7 — 인증 시스템 ⚠️ v2 수정 (역할 단순화)
- [ ] Auth.js v5 + Drizzle Adapter + Resend Magic Link
- [ ] 역할: `manager` | `admin` 두 종류만
- [ ] `ADMIN_EMAIL` 환경변수와 일치하는 가입자는 자동 admin
- [ ] 처음 가입한 매니저는 admin이 승인 (`users.role` 직접 변경)
- [ ] `(manager)/layout.tsx`: `requireRole("manager")`
- [ ] `(admin)/layout.tsx`: `requireRole("admin")`
- [ ] `/auth/signin` 페이지: 이메일 입력 → magic link → 인증

### T7.5 — 🆕 매니저 대시보드 (라이브 큐)
- [ ] `(manager)/page.tsx` = 대시보드 홈
- [ ] `components/manager/live-queue.tsx`:
  - SWR로 `/api/manager/queue` 3초마다 폴링
  - 최근 24시간 내 `status='submitted'` 세션 목록
  - 환자 이름, 시간, 추정 체질, 신뢰도, 액션 버튼
- [ ] `GET /api/manager/queue`:
  - 인증된 매니저만
  - 최근 N시간 내 미진료 세션 반환 (JOIN patients)
  - 응답 크기 작게 (id, name, time, top, confidence)
- [ ] 큐 항목 클릭 → `/patients/[patientId]/session/[sessionId]` 이동

### T8 — 류주열 처방 ETL (v1과 동일)

### T9 — seed + 처방 검색 페이지 ⚠️ v2 수정 (라우트만 변경)
- [ ] seed 스크립트는 동일
- [ ] **`(manager)/prescriptions/page.tsx`** (v1에선 (clinician)였음)
- [ ] 검색 API는 동일

### T10 — 환자 이력 & 진료 메모 🆕
- [ ] `(manager)/patients/page.tsx`: 환자 검색 (이름·생년·전화 뒷 4자리)
- [ ] `(manager)/patients/[patientId]/page.tsx`: 환자 카드 + 과거 세션 리스트
- [ ] `(manager)/patients/[patientId]/session/[sessionId]/page.tsx`:
  - 자가진단 결과 (시각화)
  - 28문항 응답 전체 (펼치기)
  - 처방·변증 가이드 추천 (체질 기반)
  - 진료 메모 입력란 (textarea)
  - 메모 저장 시 `clinicSessions.clinicNote` 업데이트 + `status='reviewed'`
- [ ] `POST /api/manager/notes`: 메모 저장 API

### T11 — 면책·법적 페이지 ⚠️ v2 수정
- [ ] `legal/disclaimer/page.tsx` — 의료 면책 (deployment-prep/legal/disclaimer.md 사용)
- [ ] `legal/privacy/page.tsx` — 개인정보 (영구 보관·환자 권리 명시 포함, deployment-prep/legal/privacy.md 사용, **다만 보유기간을 "환자 요청 시까지 영구 보관"으로 수정 필요**)
- [ ] `legal/terms/page.tsx`
- [ ] 동의 페이지(`/consent`)에서 privacy/terms 링크 노출

### T12 — 🆕 네트워크 접근 제어
- [ ] `middleware.ts`:
  - `(shared)` 그룹 라우트: `CLINIC_ALLOWED_IPS`에 포함된 IP만 통과
  - 한의원 외부에서 접근 시 안내 페이지로 리다이렉트
  - 운영자(admin role)는 어디서든 우회 가능 (테스트 목적)
- [ ] `lib/network.ts`: IP 추출 헬퍼 (Vercel의 x-forwarded-for 사용)
- [ ] 운영자가 환경변수에 한의원 공인 IP 입력 (whatismyip.com 확인)
- [ ] 환경변수 미설정 시: 경고만 표시 + 모두 허용 (개발 편의)

### T13 — 어드민 화면 🆕 (최소)
- [ ] `(admin)/users/page.tsx`: 매니저 목록 + 역할 변경·삭제
- [ ] `(admin)/settings/page.tsx`: CLINIC_ALLOWED_IPS 확인, 사이트 모드 표시
- [ ] `(admin)/backup/page.tsx`: DB 백업 다운로드 (CSV 또는 SQLite dump)

### T14 — Phase 1 검증
- [ ] E2E: 동의 → 환자 정보 → 28문항 → 결과 → 매니저 큐에 등장
- [ ] 매니저가 큐에서 클릭 → 환자 세션 상세 → 메모 저장 → 큐에서 사라짐
- [ ] 같은 환자 재방문 → 중복 검색에서 발견 → 과거 세션 노출
- [ ] 한의원 외부 IP에서 `(shared)` 접근 시 차단
- [ ] 매니저는 외부 IP에서도 정상 로그인·접근
- [ ] 어드민 계정 1개 생성, 매니저 계정 2개 생성·승인

**Phase 1 v2 완료 기준**:
- 환자가 키오스크에서 자가진단 → 결과 즉시 화면에 노출
- 카운터·원장실 매니저 화면에 라이브 큐로 환자 추가됨 (3초 이내)
- 원장이 메모 작성 → 환자 이력에 영구 저장
- 재방문 환자 검색 가능
- 공유사이트는 한의원 IP만 접근

---

## 9~10. Phase 2~4 개요 / 테스트 전략 (v1과 동일)

---

## 11. Git 워크플로 (v1과 동일)

---

## 12. 의료·법적 가이드라인 ⚠️ v2 추가

### 12.1 면책 고지 (v1과 동일)

### 12.2 개인정보 — 영구 보관 추가 고지 🆕
환자 동의 화면(`/consent`)에 명시:
> 입력하신 개인정보(이름·성별·연령·자가진단 응답·진료 메모)는
> 진료 이력 보관을 목적으로 **삭제 요청 시까지 영구 보관**됩니다.
> 언제든 운영자에게 요청하여 본인 정보의 열람·정정·삭제를 요구할 수 있습니다.

### 12.3 PIPA 준수
- 동의 버전 트래킹 (`consentVersions` 테이블)
- 환자 데이터 열람 요청 → admin의 환자 상세 페이지에서 "내보내기" 버튼
- 삭제 요청 → `patients` row + 관련 `clinicSessions`·`answers` 모두 cascade 삭제
- 감사 로그 (`auditLogs`) — 누가 언제 어떤 환자 데이터를 보았는지

---

## 13. 첫 세션 Claude Code 체크리스트

### 13.1 새 세션이 따라할 순서
1. **본 v2 문서 정독** (특히 🆕 표시 섹션)
2. **현재 작업 상태 확인**:
   - `git log --oneline -20` — 어디까지 작업됐는지
   - `ls -la app/` — 라우트 그룹 확인 (구 (public)인지 신 (shared)인지)
   - `cat db/schema.ts` — 스키마 v1인지 v2인지
3. **v1→v2 마이그레이션 필요 여부 판단**:
   - 라우트 그룹 이름 변경: `(public)→(shared)`, `(clinician)→(manager)`
   - 스키마 추가: `patients`, `clinicSessions`, `consentVersions`, `auditLogs`
   - 라이브 큐 로직 추가
4. **사용자에게 보고**:
   > "v2 개정사항을 확인했습니다. 현재 T<N>까지 작업되어 있으며, v2 적용을 위해
   > [필요한 변경 목록]을 진행하겠습니다. 우선순위는: ①스키마 마이그레이션 → ②라우트 이름 변경 → ③라이브 큐 추가."
5. **사용자 승인 후 변경 시작**

### 13.2 묻지 말 것 (이미 결정됨)
- "역할은 몇 개?" → **3계층: shared / manager / admin**
- "실시간은 어떻게?" → **폴링 3초**
- "데이터는 얼마나 보관?" → **영구 (PIPA 권리 요청 시까지)**
- "공유사이트는 어디서?" → **한의원 내부 IP만**
- "환자는 누구?" → **로그인하지 않는다. patients 테이블로만 식별**

---

## 14. 자주 발생하는 함정 (v2 추가)

### 14.1~14.5 (v1과 동일)

### 14.6 🆕 라이브 큐 폴링 함정
- SWR `refreshInterval`이 백그라운드 탭에서 멈추는 경우 → `refreshWhenHidden: true` 설정
- 폴링 데이터가 매번 다를 때만 리렌더링되도록 응답 캐시 키 잘 설계
- 큐 비어있을 때 빈 배열 응답 (`{ items: [] }`) — null/undefined 반환 X

### 14.7 🆕 환자 중복 등록 방지
- "홍길동" 동명이인 매우 흔함 → 이름만으로 매칭 X
- 표준 키: `이름 + 생년` (예: "홍길동-1985")
- 이마저 중복 시 전화 뒷 4자리 보조

### 14.8 🆕 IP allowlist 함정
- Vercel은 `x-forwarded-for` 사용 (실제 클라이언트 IP는 첫 항목)
- 한의원 인터넷이 동적 IP면 매번 바뀜 → KT/SKT 기업회선 권장 또는 VPN
- 모바일 데이터로 키오스크 접근 시 차단됨 — Wi-Fi 강제 안내

### 14.9 🆕 영구 보관 데이터 백업
- Turso 자동 백업 7일 → 더 길게 보관하려면 admin 화면에서 주기적 dump
- 권장: 월 1회 admin이 `backup/page.tsx`에서 .sqlite 파일 다운로드 → 안전한 곳 보관

---

## 15. 데이터 매핑 치트시트

| 체질 | 약어 | 한글 | 한자 | 처방 prefix | 설문 응답 매핑 |
|---|---|---|---|---|---|
| 태양인 | `ty` | 태양인 | 太陽人 | L | 선지 1 |
| 태음인 | `te` | 태음인 | 太陰人 | H | 선지 2 |
| 소음인 | `se` | 소음인 | 少陰人 | R | 선지 3 |
| 소양인 | `sy` | 소양인 | 少陽人 | P | 선지 4 |

| 역할 | 약어 | 권한 |
|---|---|---|
| shared | (비로그인) | 공유사이트 영역만 (IP 제한 안에서) |
| manager | M | 라이브 큐·환자·처방·본초·변증·메모 |
| admin | A | manager 권한 전체 + 사용자·콘텐츠·설정·백업 |

---

## 16. 🆕 한의원 진료 워크플로 (시퀀스)

```
[환자 도착]
    ↓
[카운터 매니저] 환자에게 키오스크 안내
    ↓
[환자] /consent → 동의 → /intake → 정보 입력
    ↓
   ── 신규?
   ├── YES: patients row 신규 생성, consentedAt 기록
   └── NO: 이전 patient 매칭, 새 clinicSession만 추가
    ↓
[환자] /quiz/[1..28] 응답
    ↓
[환자] POST /api/quiz/score
   → DB: clinicSession.status='submitted', answers·result 저장
    ↓
[환자] /result/[sessionId] — 결과 + 면책 + 섭생 안내
    ↓
       [라이브 큐 갱신 — 3초 내]
       ↓
       [카운터·원장실 매니저 화면] 큐에 신규 항목 알림 (애니메이션·뱃지)
            ↓
            [매니저] 클릭 → /patients/[id]/session/[sid]
                ↓
                [화면] 결과 + 환자 이력 + 처방·변증 추천
                ↓
                [매니저] 진료 메모 입력 → 저장
                    ↓
                    DB: clinicSession.status='reviewed', clinicNote 기록
                        ↓
                        [라이브 큐] 항목 제거 (또는 'reviewed' 탭으로 이동)
```

---

## 17. 🆕 실시간 동기화 구현 패턴

### 17.1 폴링 (Phase 1)
```typescript
// components/manager/live-queue.tsx
"use client";
import useSWR from "swr";

export function LiveQueue() {
  const { data, error } = useSWR("/api/manager/queue", fetcher, {
    refreshInterval: 3000,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });
  return (
    <div>
      {data?.items.map(item => <QueueItem key={item.sessionId} {...item} />)}
    </div>
  );
}
```

```typescript
// app/api/manager/queue/route.ts
import { requireRole } from "@/lib/rbac";
import { db } from "@/db/client";
import { clinicSessions, patients } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(req: Request) {
  await requireRole("manager");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const items = await db
    .select({
      sessionId: clinicSessions.id,
      patientName: patients.name,
      submittedAt: clinicSessions.submittedAt,
      resultTop: clinicSessions.resultTop,
      resultConfidence: clinicSessions.resultConfidence,
    })
    .from(clinicSessions)
    .innerJoin(patients, eq(clinicSessions.patientId, patients.id))
    .where(
      and(
        eq(clinicSessions.status, "submitted"),
        gte(clinicSessions.submittedAt, since)
      )
    )
    .orderBy(sql`${clinicSessions.submittedAt} DESC`)
    .limit(50);
  return Response.json({ items });
}
```

### 17.2 Pusher 업그레이드 경로 (Phase 3, 선택)
- Pusher Channels 무료 (200k msg/일, 100 concurrent)
- `POST /api/quiz/score` 마지막에 `pusher.trigger("queue", "new", payload)` 호출
- 매니저 화면은 폴링 대신 Pusher 구독
- 전환 시점: 폴링이 함수 호출 한도 임박할 때

---

## 18. 🆕 네트워크 접근 제어 (IP allowlist)

### 18.1 미들웨어 로직
```typescript
// middleware.ts (요약)
import { NextRequest, NextResponse } from "next/server";

const SHARED_PATH = ["/", "/consent", "/intake", "/quiz", "/result", "/guide"];
const ALLOWED_IPS = (process.env.CLINIC_ALLOWED_IPS ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function isSharedPath(pathname: string) {
  return SHARED_PATH.some(p => pathname === p || pathname.startsWith(p + "/"));
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // shared 영역만 IP 검증
  if (isSharedPath(pathname)) {
    if (ALLOWED_IPS.length === 0) {
      // 환경변수 미설정 시 경고만 + 통과 (개발 편의)
      return NextResponse.next();
    }
    const ip = getClientIp(req);
    if (!ALLOWED_IPS.includes(ip)) {
      const url = req.nextUrl.clone();
      url.pathname = "/access-restricted";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
```

### 18.2 한의원 공인 IP 확인 방법
1. 한의원 인터넷 회선에서 `https://api.ipify.org` 접속 → IP 확인
2. `CLINIC_ALLOWED_IPS=`에 콤마로 추가 (IPv4·IPv6 가능)
3. 동적 IP면 변경 시마다 환경변수 업데이트 → 정적 IP 회선 권장
4. 대체안: Cloudflare Zero Trust로 더 세련된 access policy

### 18.3 우회 (테스트)
- admin role 로그인 시 IP 검증 우회 — 개발자가 외부에서 점검 가능
- 단, 환자 데이터 입력은 우회해도 새 patient 생성됨 — 테스트 시 주의

---

## 19. 🆕 변경 이력 (Change Log)

### v2.0 — 2026-05-18
- 사용자 역할 재구성: 5계층(guest/public/student/clinician/admin) → 3계층(shared/manager/admin)
- 한의원 진료 워크플로 중심으로 정체성 재정의
- 환자(patients) 엔티티 추가, 영구 보관 정책
- 라이브 큐 (clinicSessions·답+폴링 3초)
- 동의(consentVersions)·감사 로그(auditLogs) 추가
- 라우트 그룹 이름 변경: (public)→(shared), (clinician)→(manager), (student) 제거
- DB 클라이언트 better-sqlite3 → @libsql/client (Turso)
- 네트워크 접근 제어: 공유사이트 IP allowlist
- 학생·일반인 영역 제거 (별도 프로젝트로 분리 가능성)
- 동시 작업자(Claude Code)를 위한 v2 REVISION NOTICE 추가

### v1.0 — 2026-05-18
- 초기 발행

---

**문서 끝**. Claude Code 작업자: §13.1 따라 현재 상태 점검 후 사용자에게 보고. v2 적용 후 §8의 새 T-task 진행.
