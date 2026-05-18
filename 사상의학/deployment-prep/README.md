# 배포 준비 패키지 (deployment-prep)

> sasang-platform을 웹앱으로 배포하기 위한 모든 준비 자료. 코드 작성 전·중·후 단계별로 참조.

## 파일 가이드

```
deployment-prep/
├── README.md                          ← 본 파일 (인덱스)
├── DEPLOYMENT_GUIDE.md                ← 종합 배포 가이드 (먼저 읽기)
├── USER_ACTION_CHECKLIST.md           ← 당신이 직접 해야 할 일 체크리스트
├── configs/                           ← 코드에 그대로 복사할 설정 파일들
│   ├── .env.production.example        ← 환경변수 템플릿
│   ├── vercel.json                    ← Vercel 빌드·보안 헤더 설정
│   ├── next-config-security.mjs       ← Next.js 보안 헤더(CSP 포함)
│   ├── middleware.ts                  ← 사이트 비밀번호 게이트
│   ├── gate-page.tsx                  ← 비밀번호 입력 UI
│   ├── gate-route.ts                  ← 비밀번호 검증 API
│   └── github-actions-ci.yml          ← CI 워크플로
└── legal/                             ← 법적 문서 초안
    ├── disclaimer.md                  ← 의료 면책 고지
    ├── privacy.md                     ← 개인정보처리방침
    └── terms.md                       ← 이용약관
```

## 사용 순서

### 1단계 — 사전 준비 (지금)
1. `DEPLOYMENT_GUIDE.md` 정독
2. `USER_ACTION_CHECKLIST.md` §1 따라 계정 5개 만들기 (Vercel·Turso·Resend·GitHub·Cloudflare)
3. `USER_ACTION_CHECKLIST.md` §3 따라 비밀번호·시크릿 생성·저장

### 2단계 — Claude Code 작업 시작
1. 새 프로젝트 폴더 `C:\Users\ADmiN\Downloads\sasang-platform\` 생성
2. `DEVELOPMENT_GUIDE.md` 와 `PLATFORM_DESIGN.md` 사본 배치
3. Claude Code에 "T1부터 진행해줘" 지시
4. T1 부트스트랩 완료 후, **configs/ 폴더의 파일들을 다음과 같이 배치**:

| 원본 (이 폴더) | 새 프로젝트의 위치 |
|---|---|
| configs/vercel.json | sasang-platform/vercel.json |
| configs/next-config-security.mjs | sasang-platform/next.config.mjs (병합) |
| configs/middleware.ts | sasang-platform/middleware.ts |
| configs/gate-page.tsx | sasang-platform/app/_gate/page.tsx |
| configs/gate-route.ts | sasang-platform/app/api/gate/route.ts |
| configs/github-actions-ci.yml | sasang-platform/.github/workflows/ci.yml |
| configs/.env.production.example | sasang-platform/.env.production.example |
| legal/disclaimer.md | sasang-platform/app/legal/disclaimer/page.tsx (변환) |
| legal/privacy.md | sasang-platform/app/legal/privacy/page.tsx (변환) |
| legal/terms.md | sasang-platform/app/legal/terms/page.tsx (변환) |

### 3단계 — 첫 배포
`USER_ACTION_CHECKLIST.md` §6 따라 Vercel Import → 환경변수 입력 → 도메인 연결

### 4단계 — 운영
- 정기 점검: `USER_ACTION_CHECKLIST.md` §8
- 비용·한도 모니터링
- Phase 진행에 따른 추가 서비스 활성화

## 핵심 결정 요약

| 항목 | 값 |
|---|---|
| 도메인 | sasang.onnuriclinic.com |
| 호스팅 | Vercel (Hobby, 무료) |
| DB | Turso libSQL (무료) |
| 이메일 | Resend (무료, 월 3k) |
| 검색 | MeiliSearch Fly.io (Phase 3) |
| 접근 제어 | 사이트 비밀번호 미들웨어 (무료 자체 구현) |
| 예상 운영비 | $0/월 (MVP) |

## 미확정·검토 필요 항목

- [ ] 자료 저작권자 확인 (류주열·안준철·김주·권재식 — 협의 필요)
- [ ] 한의사 면허 확인 절차 (수동 승인 vs API 연동)
- [ ] 외부 공개 시점 결정
- [ ] 백업 자동화 cron (Turso 자체 백업 외)

## 추가 도움이 필요할 때

이 패키지의 한계:
- 실제 계정 생성·결제·DNS 변경은 당신만 가능
- 실제 코드는 Claude Code 작업물
- 법적 문서는 변호사 검토가 안전

각 단계에서 막히면 본 폴더 + DEVELOPMENT_GUIDE 들고 Cowork에 다시 문의.
