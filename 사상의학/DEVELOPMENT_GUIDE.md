# 사상의학 플랫폼 — Claude Code 개발지침서

> **이 문서의 정체**: Claude Code가 새 프로젝트 폴더에서 작업을 시작할 때 가장 먼저 읽는 마스터 가이드. 코딩에 필요한 모든 결정사항·관례·작업 큐가 들어있다.
>
> **사용법**: 새 프로젝트 폴더 생성 후, 이 파일을 그 폴더의 `CLAUDE.md` 또는 `DEVELOPMENT_GUIDE.md`로 복사. 그러면 Claude Code 새 세션이 자동으로 읽는다.
>
> **버전**: v1.0 · **작성일**: 2026-05-18 · **작성자**: Cowork(설계) → Claude Code(구현)

---

## 0. TL;DR — Claude Code가 한눈에 알아야 할 것

| 항목 | 값 |
|---|---|
| 프로젝트명 | **sasang-platform** (사상의학 디지털 플랫폼) |
| 운영자 | kim (epaphrokim@gmail.com, GitHub: kimhungtae) |
| 새 프로젝트 폴더 | `C:\Users\ADmiN\Downloads\sasang-platform\` |
| GitHub | `kimhungtae/sasang-platform` (새 저장소, 생성 필요) |
| 초기 배포 대상 | **내부용** (로컬/사내 네트워크) — 인증 간소화, 면책은 결과지만 |
| 기술 스택 | Next.js 14 + TypeScript + SQLite(Drizzle) + MeiliSearch + Tailwind/shadcn |
| 마스터 설계 | `C:\Users\ADmiN\Downloads\onnuri-site\사상의학\PLATFORM_DESIGN.md` |
| 원자료 (HWP/PDF/XLSX) | `C:\Users\ADmiN\Downloads\onnuri-site\사상의학\` 폴더 |
| 기존 정적 사이트와 관계 | **완전 별개 프로젝트**. onnuri-site는 그대로, sasang-platform은 신규 |
| 첫 세션 진입점 | 본 문서 §13 "첫 세션 체크리스트" → §8 Phase 1 작업 큐 |

---

## 1. 프로젝트 정체성

### 1.1 무엇을 만드는가
사상의학(동무 이제마)의 디지털화. 핵심 4 모듈:
1. **체질 감별** — 28문항 설문 + 소아 문진 + 시각 감별
2. **처방·본초 검색 DB** — 류주열 처방 352+ · 본초 사전
3. **장부변증 가이드** — 폐·비·간·신·심 × 4체질 매트릭스
4. **강의록·자료 라이브러리** — 김주·안준철·권재식 자료 전문검색

### 1.2 사용자 (4계층)
- **운영자(원장)**: 본인 임상 진료 도구. 모든 권한.
- **한의사**: 처방·본초·변증 참조. 처방 구성 열람.
- **학생/연구자**: 강의록·원전 학습. 노트.
- **일반인**: 자가진단 + 섭생법만 (처방 비공개).

### 1.3 운영 가정 (이번 단계)
- **내부용**: 로컬 또는 사내 네트워크. 일반 트래픽 없음.
- 인증은 단순 이메일+승인. 한의사 면허 검증은 v2.
- 면책 고지는 **결과 페이지**에 명시. 일반 공개 정책은 v2 이후.

### 1.4 기존 onnuri-site와의 관계
- **별개 프로젝트**다. 같은 도메인·코드베이스 공유 없음.
- onnuri-site는 정적 사이트(Cloudflare Pages)로 그대로 운영.
- sasang-platform은 풀스택. 향후 서브도메인(`sasang.onnuriclinic.com`) 연결할 수 있으나 지금은 로컬.
- onnuri-site/`사상의학` 폴더의 v23.html은 **참고 자료**일 뿐, 본 프로젝트의 모태는 아님. 단, 채점 알고리즘·UX 패턴은 참고 가치 있음.

---

## 2. 참조 문서 맵

| 문서 | 위치 | 용도 |
|---|---|---|
| **PLATFORM_DESIGN.md** | `onnuri-site\사상의학\PLATFORM_DESIGN.md` | 마스터 설계 (정보 아키텍처·데이터 모델·로드맵). **반드시 읽기.** |
| **DEVELOPMENT_GUIDE.md** | (본 문서) | 실행 지침. 작업 시작점. |
| 체질설문지 원본 | `onnuri-site\사상의학\체질설문지.txt` (CP949) | 28문항 시드 |
| 류주열 처방 | `onnuri-site\사상의학\류주열사상처방개정판.xlsx` | 처방 DB 시드 (352개) |
| 장부변증 5종 | `onnuri-site\사상의학\새로 쓴 사상의학 장부변증 [폐비간신심]병.hwp` | 변증 트리 시드 |
| 본초 자료 | `onnuri-site\사상의학\체질약물재정리...hwp`, `안준철 원장님 자료.zip\사상본초...` | 본초 사전 시드 |
| 섭생법 4종 | `onnuri-site\사상의학\[태양/태음/소양/소음]인 섭생법.hwp` | 일반인 영역 콘텐츠 |
| 강의록 PDF | `onnuri-site\사상의학\*.pdf`, `안준철 원장님 자료.zip\*.pdf` | 강의록 라이브러리 시드 |
| v23.html 참고 | `onnuri-site\온누리_사상체질_감별설문지_v23.html` | UX·알고리즘 참고 (필수 아님) |

---

## 3. 기술 스택 (정확한 버전)

```json
{
  "node": ">=20.10",
  "npm": ">=10",
  "packages": {
    "next": "14.2.x",
    "react": "18.3.x",
    "typescript": "5.4.x",
    "tailwindcss": "3.4.x",
    "drizzle-orm": "latest",
    "better-sqlite3": "latest",
    "next-auth": "5.x (Auth.js)",
    "zod": "latest",
    "recharts": "latest",
    "meilisearch": "latest (서버) / meilisearch-js (클라이언트)"
  },
  "devTools": {
    "drizzle-kit": "latest",
    "vitest": "latest",
    "playwright": "latest (E2E)",
    "eslint": "latest",
    "prettier": "latest"
  }
}
```

### 3.1 외부 서비스
- **MeiliSearch**: 로컬 Docker (`getmeili/meilisearch:latest`). 1.0+
- **LibreOffice (Headless)**: HWP → TXT 변환 — Windows 설치 후 `soffice.exe --headless`
- **(선택) Tesseract OCR**: 스캔 PDF 대비. v2에서

### 3.2 왜 이 스택인가
- Next.js 14 App Router: SSR/SSG 혼용, 단일 코드베이스로 4계층 처리
- SQLite + Drizzle: 파일 단일·이식·백업 쉬움. 100k 레코드까지 충분
- MeiliSearch: 한국어 토크나이저 양호, 자체 호스팅 무료, typo tolerance
- Auth.js: 이메일/OAuth, RBAC 직접 구현 가능
- shadcn/ui: 코드 소유권 = 우리 것. 의존성 락인 없음

---

## 4. 초기 셋업 (One-Time Bootstrap)

### 4.1 첫 실행 명령 시퀀스
Claude Code가 **첫 세션 첫 5분**에 실행할 것:

```powershell
# 1. 폴더 이동 (없으면 만들기)
cd C:\Users\ADmiN\Downloads
mkdir sasang-platform
cd sasang-platform

# 2. Next.js 스캐폴드
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbo

# 3. shadcn/ui 초기화
npx shadcn-ui@latest init -y
# (스타일: Default · 컬러: Stone · CSS 변수: yes)

# 4. 핵심 의존성
npm i drizzle-orm better-sqlite3 zod recharts meilisearch next-auth@beta openpyxl-js
npm i -D drizzle-kit @types/better-sqlite3 vitest @playwright/test prettier

# 5. shadcn 컴포넌트 (자주 쓸 것 일괄)
npx shadcn-ui@latest add button card input label select tabs dialog alert form badge progress

# 6. Git 초기화 + 첫 커밋
git init
git add -A
git commit -m "chore: bootstrap Next.js + shadcn + drizzle"

# 7. GitHub 저장소 연결 (사용자가 미리 빈 저장소 생성해둘 것)
git remote add origin https://github.com/kimhungtae/sasang-platform.git
git branch -M main
git push -u origin main
```

### 4.2 환경 변수 (`.env.local`)
```
# DB
DATABASE_URL=file:./db/sasang.db

# Auth.js
AUTH_SECRET=<openssl rand -base64 32 결과>
AUTH_URL=http://localhost:3000

# MeiliSearch
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=<로컬 개발용 임의 문자열>

# 메일 (운영자 승인 알림)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

### 4.3 `package.json` 스크립트 추가
```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts",
    "etl:prescriptions": "tsx scripts/xlsx-to-prescriptions.ts",
    "etl:questionnaire": "tsx scripts/txt-to-questionnaire.ts",
    "etl:lectures": "tsx scripts/pdf-to-chunks.ts",
    "search:reindex": "tsx scripts/build-search-index.ts",
    "test": "vitest",
    "test:e2e": "playwright test",
    "meili:dev": "docker run -p 7700:7700 -v $(pwd)/meili_data:/meili_data getmeili/meilisearch:latest"
  }
}
```

---

## 5. 폴더 구조 (생성할 것)

```
sasang-platform/
├── CLAUDE.md                       ← 본 문서를 이리로 복사 (또는 그대로 두기)
├── app/
│   ├── (public)/
│   │   ├── page.tsx                # 홈
│   │   ├── quiz/
│   │   │   ├── page.tsx            # 자가진단 시작
│   │   │   └── [step]/page.tsx     # 문항 진행
│   │   ├── result/[id]/page.tsx    # 결과
│   │   └── guide/[constitution]/page.tsx  # 섭생
│   ├── (student)/
│   │   ├── layout.tsx              # 학생 인증 가드
│   │   ├── courses/page.tsx
│   │   ├── library/page.tsx
│   │   └── notes/page.tsx
│   ├── (clinician)/
│   │   ├── layout.tsx              # 한의사 인증 가드
│   │   ├── prescriptions/page.tsx
│   │   ├── herbs/page.tsx
│   │   ├── organ-syndromes/page.tsx
│   │   └── symptoms/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx              # 관리자 가드
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   ├── quiz/score/route.ts
│   │   ├── prescriptions/route.ts
│   │   ├── herbs/route.ts
│   │   ├── search/route.ts
│   │   └── auth/[...nextauth]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn 컴포넌트
│   ├── quiz/
│   │   ├── question-card.tsx
│   │   ├── progress-bar.tsx
│   │   └── result-chart.tsx
│   ├── prescription/
│   │   ├── prescription-card.tsx
│   │   └── ingredient-list.tsx
│   ├── disclaimer.tsx              # 면책 고지 (재사용)
│   └── role-gate.tsx               # RBAC 컴포넌트
├── db/
│   ├── schema.ts                   # Drizzle 스키마 (PLATFORM_DESIGN §5 참조)
│   ├── client.ts                   # better-sqlite3 + drizzle 인스턴스
│   ├── migrations/                 # drizzle-kit 산출물
│   └── sasang.db                   # SQLite 파일 (.gitignore)
├── lib/
│   ├── auth.ts                     # Auth.js 설정
│   ├── rbac.ts                     # 권한 헬퍼
│   ├── scoring.ts                  # 자가진단 채점
│   ├── search.ts                   # MeiliSearch 클라이언트
│   └── encoding.ts                 # CP949·UTF-8 변환
├── data/
│   ├── questionnaires/
│   │   ├── adult28.json            # ETL 산출물
│   │   ├── adult28_weights.json
│   │   └── pediatric.json
│   ├── prescriptions.json          # ETL 산출물
│   ├── herbs.json                  # ETL 산출물 (수동 보강)
│   ├── lifestyle/
│   │   ├── ty.md
│   │   ├── te.md
│   │   ├── sy.md
│   │   └── se.md
│   └── syndromes/                  # 5장부 변증
├── scripts/
│   ├── txt-to-questionnaire.ts     # 체질설문지.txt → JSON
│   ├── xlsx-to-prescriptions.ts    # 류주열 XLSX → JSON
│   ├── parse-composition.ts        # 구성 문자열 → 약재 토큰
│   ├── hwp-to-text.ts              # LibreOffice 래퍼
│   ├── pdf-to-chunks.ts            # PDF → 단락
│   ├── seed.ts                     # JSON → SQLite
│   └── build-search-index.ts       # SQLite → MeiliSearch
├── public/
│   └── sources/                    # 원본 PDF/HWP (gitignore 또는 LFS)
├── tests/
│   ├── scoring.test.ts
│   ├── composition.test.ts
│   └── e2e/
│       └── quiz.spec.ts
├── docs/
│   ├── PLATFORM_DESIGN.md          # 원본 설계서 사본
│   ├── decisions/                  # ADR (Architecture Decision Record)
│   └── data-sources.md             # 자료 출처·저작권 추적
├── .env.local                      # gitignore
├── .env.example                    # 템플릿 (Git 트래킹)
├── drizzle.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── package.json
└── README.md
```

### 5.1 .gitignore 추가 항목
```
.env.local
db/sasang.db
db/sasang.db-journal
meili_data/
public/sources/*.pdf
public/sources/*.hwp
*.local
```

---

## 6. 코딩 컨벤션

### 6.1 언어·스타일
- **TypeScript strict mode** (`tsconfig: "strict": true`)
- ESLint + Prettier (Next.js 기본 + 사용자 정의 prettier)
- 파일명: `kebab-case.tsx`. React 컴포넌트 이름은 `PascalCase`
- 함수형 컴포넌트 + Hooks. 클래스 컴포넌트 금지.
- Server Component 기본, 인터랙션 필요할 때만 `"use client"`

### 6.2 네이밍
- 체질 코드: `ty`(태양)·`te`(태음)·`sy`(소양)·`se`(소음). UI 표시는 `태양인` 등 한글. (v23.html과 일치)
- 처방 ID: `L###`·`H###`·`P###`·`R###` (XLSX의 No. 컬럼 그대로)
- 본초 ID: `HB-###`
- 변증 ID: `[장부코드]-[체질코드]-##` (예: `LU-H-01`)

### 6.3 API 규약
- Route Handler는 `app/api/<resource>/route.ts`
- 응답 형식 통일: `{ ok: true, data } | { ok: false, error }`
- 검증: 모든 입력은 `zod`로 schema 검증
- 에러: 4xx는 사용자 입력 오류, 5xx는 서버 오류. 로그는 `console.error` + 추후 Sentry

### 6.4 의료 콘텐츠 작성 (UI 텍스트)
- **금지**: "100% 낫습니다", "확실한 진단" 등 단정적 표현
- **공개 영역**에선 처방명 직접 노출 금지 (`/`(public)/* 라우트 전체)
- **임상가 영역**에선 처방명 OK
- 결과 페이지 상·하단에 면책 고지 컴포넌트 `<Disclaimer />` 필수

### 6.5 i18n
- v1: 한국어 단일. 폰트: Pretendard 또는 Noto Sans KR
- v2 영문 요약 시 `next-intl` 도입

### 6.6 커밋 메시지
[Conventional Commits](https://www.conventionalcommits.org):
- `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `data:`
- 예: `feat(quiz): add 28-question scoring algorithm`

---

## 7. 데이터 마이그레이션 가이드 (ETL)

> **원칙**: 원본 파일은 절대 수정하지 않는다. ETL 스크립트가 JSON으로 변환하고, seed가 그 JSON을 DB로 넣는다.

### 7.1 체질설문지.txt → adult28.json
```typescript
// scripts/txt-to-questionnaire.ts
// 1. CP949 → UTF-8 디코딩 (iconv-lite)
// 2. 정규식으로 문항·선지 추출 (현재 28문항, 28번은 음식 체크리스트로 별도 처리)
// 3. 매핑: 선지 1→ty, 2→te, 3→se, 4→sy (체질설문지.txt 분석란)
// 4. 출력: data/questionnaires/adult28.json
```
**중요**: 매핑은 `1=태양, 2=태음, 3=소음, 4=소양` (체질설문지.txt 분석란 그대로).

### 7.2 류주열사상처방개정판.xlsx → prescriptions.json
```typescript
// scripts/xlsx-to-prescriptions.ts
// 1. exceljs 또는 xlsx로 4시트 읽기 (태양/태음/소양/소음)
// 2. 시트별 No. prefix 확인 (L/H/P/R)
// 3. 컬럼: No. · 처방명 · 구성(개정) · 구성(예전)
// 4. parse-composition.ts로 구성 문자열 토큰화 → ingredient 배열
```

```typescript
// scripts/parse-composition.ts
// 입력: "갈근8 맥문동6 황금6 길경4 행인4"
// 출력: [{ herb: "갈근", dose: 8 }, { herb: "맥문동", dose: 6 }, ...]
// 정규식: /([가-힣]+)(\d+(?:\.\d+)?)/g
// 이체자 매핑: 모당귀↔당귀, 토창출↔창출 등 (data/herb-aliases.json)
```

### 7.3 HWP → 텍스트
```typescript
// scripts/hwp-to-text.ts
// 1. LibreOffice headless로 변환: soffice --headless --convert-to txt input.hwp
// 2. 변환 실패 시 hwp5proc XML 추출 후 직접 파싱
// 3. 출력: data/raw/{filename}.txt
// 운영자가 LibreOffice 설치되어 있어야 함 (Windows: winget install --id LibreOffice.LibreOffice)
```

### 7.4 PDF → 단락
```typescript
// scripts/pdf-to-chunks.ts
// 1. pdf-parse 또는 pdfjs로 텍스트 추출
// 2. 단락 분리: 빈 줄(\n\n) 또는 heading 패턴
// 3. 각 단락에 메타 부여: { documentId, page, order, text }
// 4. 출력: data/raw/chunks/{documentId}.json
```

### 7.5 seed: JSON → SQLite
```typescript
// scripts/seed.ts
// 1. data/*.json 읽어서 Drizzle insert
// 2. 처방 ↔ 약재 관계 테이블 채우기
// 3. 멱등성 보장: ON CONFLICT DO UPDATE
```

### 7.6 검색 인덱스 빌드
```typescript
// scripts/build-search-index.ts
// 1. SQLite에서 documents·chunks·prescriptions·herbs 읽기
// 2. MeiliSearch 인덱스 3개 생성: documents, prescriptions, herbs
// 3. 한국어 stop words 설정, ranking rules: typo > words > proximity > attribute
```

---

## 8. Phase 1 작업 큐 (MVP, 4~6주)

각 작업은 **단일 PR 단위**. 작업 시작 시 `TaskCreate`로 등록, 완료 시 `TaskUpdate completed`.

### T1 — 프로젝트 부트스트랩 ✅ acceptance
- [ ] §4.1 명령 시퀀스 모두 실행
- [ ] `npm run dev` 시 기본 페이지 노출
- [ ] git 초기 커밋 + GitHub push 완료
- [ ] `.env.example` 작성

### T2 — DB 스키마 & 마이그레이션
- [ ] `db/schema.ts`에 PLATFORM_DESIGN §5 스키마 입력
- [ ] `drizzle.config.ts` 설정
- [ ] `npm run db:generate` → `db:migrate`로 빈 DB 생성
- [ ] `npm run db:studio`에서 테이블 11+ 확인

### T3 — 체질설문지 ETL
- [ ] `scripts/txt-to-questionnaire.ts` 작성
- [ ] `data/questionnaires/adult28.json` 생성 — 28문항 모두 매핑 검수
- [ ] 28번 음식 체크리스트는 별도 구조(`type: "multiselect-food"`)로 분리
- [ ] 가중치 파일 `adult28_weights.json` (기본 1, 핵심 문항 2)
- [ ] unit test: 문항 수 28, 선지 매핑 1=ty/2=te/3=se/4=sy

### T4 — 자가진단 UI (`/quiz`)
- [ ] `/quiz` 진입 페이지: 안내 + 시작 버튼
- [ ] `/quiz/[step]` 동적 라우트, 1문항/페이지
- [ ] 이전/다음 버튼, 진행률 바
- [ ] 응답은 session storage (DB 저장은 결과 페이지 진입 시)
- [ ] 모바일 반응형 (Tailwind sm/md breakpoint)
- [ ] 면책 고지는 시작 페이지에 1회

### T5 — 채점 API & 결과 페이지
- [ ] `lib/scoring.ts`: 가중 카운팅 + 70% 임계 + 1·2차 후보
- [ ] `POST /api/quiz/score` Route Handler
- [ ] `/result/[id]` 페이지: Recharts 막대그래프 + 신뢰도 표시
- [ ] 결과 카드 클릭 → `/guide/[constitution]` 이동
- [ ] **면책 고지 상·하단 필수**
- [ ] unit test: 동일 응답 → 동일 결과 (멱등)

### T6 — 4체질 섭생 가이드 페이지
- [ ] `data/lifestyle/{ty,te,sy,se}.md` 4파일 작성 — 사상의학 폴더의 섭생법 HWP 4종에서 변환·정리
- [ ] `/guide/[constitution]` 페이지: 음식·운동·정서·주의 4섹션
- [ ] 한의사 상담 CTA (선택적 — 내부용이라 v2에서 활성화)

### T7 — 인증 시스템 (Auth.js, 최소화)
- [ ] Email magic link or credential auth
- [ ] users 테이블 role: `public`(기본) · `student` · `clinician` · `admin`
- [ ] 운영자(kim.epaphrokim@gmail.com) 자동 `admin`
- [ ] 한의사 가입 요청 → 운영자 승인(관리자 페이지에서)
- [ ] `lib/rbac.ts`: `requireRole(role: Role)` 헬퍼

### T8 — 류주열 처방 ETL
- [ ] `scripts/xlsx-to-prescriptions.ts` 작성
- [ ] `scripts/parse-composition.ts` 작성
- [ ] `data/prescriptions.json` 생성 — **352±α** 항목
- [ ] 약재 마스터 자동 추출 → `data/herbs.json` (중복 제거)
- [ ] unit test: L001 = 류씨오가피장척탕, 8개 약재, 첫 약재=목적8

### T9 — seed + 처방 검색 페이지
- [ ] `scripts/seed.ts`: JSON → SQLite insert
- [ ] `/clinician/prescriptions` 페이지: 필터(체질·약재·증상)
- [ ] `GET /api/prescriptions?constitution=&herb=&q=`
- [ ] 결과 카드 + 상세 모달 (구성표 개정/예전 대조)
- [ ] 한의사 이상만 접근 (`(clinician)/layout.tsx`에서 가드)

### T10 — 면책·법적 페이지
- [ ] `/legal/disclaimer` · `/legal/privacy` 페이지
- [ ] `<Disclaimer />` 컴포넌트 (결과 페이지·공개 영역에서 재사용)
- [ ] 푸터 컴포넌트에 법적 페이지 링크

### T11 — README + 운영 문서
- [ ] `README.md`: 프로젝트 개요·셋업·실행 방법
- [ ] `docs/data-sources.md`: 어떤 자료를 어떻게 가져왔는지 명세
- [ ] `docs/decisions/0001-tech-stack.md`: ADR 작성

### T12 — Phase 1 검증
- [ ] `npm run dev`로 전체 흐름 수동 검증
- [ ] Playwright E2E: 자가진단 28문항 → 결과 페이지까지
- [ ] Lighthouse 모바일 점수 > 90
- [ ] 일반인이 처방 페이지 접근 시 403 확인

**Phase 1 완료 기준**: 일반인이 자가진단·섭생 안내까지 사용 가능. 한의사 로그인 시 처방 검색 가능. localhost에서 모두 동작.

---

## 9. Phase 2~4 개요 (참고)

PLATFORM_DESIGN §9 로드맵 그대로:
- **Phase 2**: 본초 사전 + 본초 ↔ 처방 양방향 링크 + 처방 검색 고도화
- **Phase 3**: 장부변증 트리 + 증상 카탈로그 + 강의록 라이브러리 + MeiliSearch
- **Phase 4**: 진료 도구(환자 설문→처방 후보), 소아 문진, 시각 감별, Tauri 데스크톱

각 Phase 시작 시 동일한 형식으로 작업 큐 분해.

---

## 10. 테스트 전략

### 10.1 Vitest (unit)
- `lib/scoring.ts`, `parse-composition.ts` 같은 순수 함수 우선
- DB 의존 함수는 in-memory SQLite로 격리

### 10.2 Playwright (E2E)
- 핵심 사용자 흐름만 (자가진단 → 결과, 한의사 로그인 → 처방 검색)
- 시각 회귀 테스트는 v2

### 10.3 데이터 검증 테스트
ETL 산출물의 무결성:
```typescript
test("처방 시드 무결성", () => {
  const data = JSON.parse(readFileSync("data/prescriptions.json"));
  expect(data.length).toBeGreaterThan(340);
  expect(data.length).toBeLessThan(370);
  expect(data.filter(p => p.id.startsWith("L"))).toHaveLength(72);
  // ...
});
```

---

## 11. Git 워크플로

### 11.1 브랜치
- `main`: 안정. 직접 push 가능 (1인 개발이지만 PR 권장)
- `feat/<topic>`: 작업 브랜치. 예: `feat/quiz-scoring`

### 11.2 PR 체크리스트 (자체)
- [ ] `npm run lint` 통과
- [ ] `npm run test` 통과
- [ ] `npm run build` 성공
- [ ] 관련 문서 업데이트

### 11.3 자동화 스크립트 (선택)
onnuri-site의 `push.bat`처럼 단순화한 `push.bat`은 v2에서. v1은 수동 git.

---

## 12. 의료·법적 가이드라인

### 12.1 면책 고지 표준 텍스트
```
※ 본 결과는 자가진단을 위한 참고 자료이며, 의학적 진단이 아닙니다.
   정확한 체질 감별과 처방은 한의사의 진료를 통해 받으시기 바랍니다.
```
이 문구는 `<Disclaimer />` 컴포넌트로 통일.

### 12.2 접근 통제
- 공개 영역: 자가진단·섭생법·사상의학 입문
- 처방·본초 구성: 한의사 이상
- 강의록 원문: 학생 이상
- 강의록 검색 결과 요약(미리보기 100자): public 허용 (v2 결정 사항)

### 12.3 저작권
- 류주열·안준철·김주·권재식 자료는 **권리자 확인 전까지 비공개**
- 동의수세보원 원문(고전)은 공유 가능, 국역본은 번역자 확인 필요
- `docs/data-sources.md`에 자료별 출처·승인 상태 기록 의무

---

## 13. 첫 세션 Claude Code 체크리스트

새 Cowork·Claude Code 세션이 `sasang-platform/` 폴더를 처음 열 때 따라할 순서:

1. **본 문서를 처음부터 끝까지 읽는다.** (특히 §0 TL;DR, §8 작업 큐)
2. **PLATFORM_DESIGN.md를 읽는다.** (`docs/PLATFORM_DESIGN.md` 또는 원본 경로)
3. **현재 상태 파악**:
   - `git log --oneline | head` — 어디까지 작업됐는지
   - `ls -la` — 파일 구조 확인
   - `cat package.json` — 의존성 현황
4. **사용자에게 보고 + 다음 작업 제안**:
   - "현재 T<N>까지 완료된 것으로 보입니다. T<N+1> 진행할까요?"
5. **TaskCreate**로 작업 등록 → 진행 → `TaskUpdate completed`
6. **Phase 1 단계**라면 §8의 작업 순서(T1→T12)를 엄수
7. **모르겠으면 본 문서를 다시 읽거나 사용자에게 질문**

### 13.1 불필요한 질문 금지 (이미 결정된 사항)
- "기술 스택은?" → §3 그대로
- "폴더 위치는?" → `C:\Users\ADmiN\Downloads\sasang-platform\`
- "GitHub는?" → `kimhungtae/sasang-platform`
- "배포는?" → 내부용, 로컬 호스팅
- "체질 코드 약어는?" → `ty/te/sy/se`
- "처방 ID는?" → `L/H/P/R + 3자리`

---

## 14. 자주 발생하는 함정 (Pitfalls)

### 14.1 한국어 인코딩
- 체질설문지.txt는 **CP949(EUC-KR)**. 직접 `readFileSync(path, "utf-8")` 하면 깨짐.
- 반드시 `iconv-lite`로 decode 후 작업.
- 모든 산출물은 UTF-8.

### 14.2 HWP 파일
- HWP는 한컴 독점. LibreOffice가 부분 지원만 함.
- 표(table)가 많은 HWP는 깨지기 쉬움 → 변환 결과를 반드시 사람이 검수.
- 안 되면: HWP → PDF 변환 후 PDF 파이프라인 적용.

### 14.3 Windows 경로
- Node.js에서 `path.join`, `path.resolve` 사용. 직접 `\\` 작성 금지.
- 한글 폴더명 OK이나, `sasang-platform`은 영문 유지.

### 14.4 처방명 노출
- 임상가용 페이지에서만. 공개 영역에 처방명 직접 출력하면 약사법·의료법 분쟁 소지.
- `<PrescriptionName />` 컴포넌트에 RBAC 가드 내장.

### 14.5 SQLite + Windows
- `better-sqlite3`는 native 모듈 → Windows에선 빌드 도구 필요할 수 있음 (`npm i windows-build-tools` 또는 Visual Studio Build Tools).
- 안 되면 대안: `libsql` (TypeScript 네이티브).

### 14.6 다중 세션 / 동시 편집
- v1은 단일 사용자 가정 → SQLite 단일 파일 OK
- 다중 한의사가 동시 노트 작성하면 락 발생 가능 → Postgres 이전 시점에 해결

---

## 15. 관련 정보 (Quick Reference)

### 15.1 데이터 매핑 치트시트
| 체질 | 약어 | 한글 | 한자 | 처방 prefix | 설문지 응답 |
|---|---|---|---|---|---|
| 태양인 | `ty` | 태양인 | 太陽人 | L | 1 |
| 태음인 | `te` | 태음인 | 太陰人 | H | 2 |
| 소음인 | `se` | 소음인 | 少陰人 | R | 3 |
| 소양인 | `sy` | 소양인 | 少陽人 | P | 4 |

> **주의**: 일부 자료에서 약어가 다를 수 있음. 본 프로젝트는 v23.html과 일치하게 `ty/te/sy/se` 사용.

### 15.2 외부 링크
- Next.js 14 App Router: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team
- shadcn/ui: https://ui.shadcn.com
- MeiliSearch Korean: https://docs.meilisearch.com/learn/configuration/korean.html
- Auth.js: https://authjs.dev

### 15.3 운영자 연락처
- 이름: kim
- 이메일: epaphrokim@gmail.com
- GitHub: kimhungtae
- 한의원: 경기 수원시 권선구 덕영대로1201번길 8, 남수원메드빌 3층

---

## 16. 이 문서 자체의 업데이트 규칙

- Phase 완료 시마다 §8 작업 큐를 다음 Phase로 교체
- 결정사항 변경 시 본 문서를 **먼저** 업데이트하고 코드 변경
- ADR (`docs/decisions/`)에는 "왜" 변경했는지 기록
- 사용자가 채팅에서 결정한 사항은 본 문서로 옮겨야 영구화됨

---

**문서 끝**. 첫 액션: §13.1을 따른 후 §4.1 명령 실행 → T1 시작.
