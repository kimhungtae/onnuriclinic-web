# 온누리한의원 홈페이지 — 작업 환경 안내

> 이 파일은 Cowork에서 이 폴더를 작업할 때 Claude가 먼저 읽고 맥락을 파악하기 위한 문서입니다.
> 새로운 세션/창에서도 이 폴더를 열면 즉시 동일한 작업 흐름을 이어갈 수 있습니다.

---

## 1. 프로젝트 개요

- **이름**: 온누리한의원 공식 홈페이지
- **운영자**: kim (이메일: epaphrokim@gmail.com, GitHub: kimhungtae)
- **위치**: 경기 수원시 권선구 덕영대로1201번길 8, 남수원메드빌 3층
- **전화**: 031-223-1075
- **라이브 사이트**: **https://onnuriclinic.com** (Cloudflare Pages 호스팅)

---

## 2. 호스팅 / 배포 구조

```
[로컬 폴더] C:\Users\ADmiN\Downloads\onnuri-site
        ↓ git push
[GitHub] kimhungtae/onnuriclinic-web (main branch)
        ↓ 자동 webhook
[Cloudflare Pages] onnuri-clinic 프로젝트
        ↓ 빌드 (30~90초)
[라이브] https://onnuriclinic.com
```

- **GitHub 저장소**: `kimhungtae/onnuriclinic-web`
- **Cloudflare Pages 프로젝트**: `onnuri-clinic` (도메인 `onnuriclinic.com` 연결됨)
- **DNS**: Cloudflare에서 관리 (도메인 자체는 가비아에서 구매)
- **인증**: `.git/config`에 PAT(`github_pat_...`) 임베드됨 → push 시 자동 인증
- **PAT 만료일**: 2027-05-07 (그 전에 갱신 필요, 토큰 이름: `onnuri-site-push`, scope: All repositories, Contents Read+Write)

---

## 3. 파일 구조

### 사이트 핵심 파일 (GitHub로 푸시되는 것)

| 파일 | 역할 |
|------|------|
| `index.html` | 메인 홈페이지 (1.3MB, 단일 파일에 모든 CSS/JS/SVG 통합) |
| `onnuri_clinic (3)_mobile.html` | `index.html`의 사본. **push.bat이 자동 동기화** (이 파일 직접 편집하지 말 것) |
| `ai-consult.html` | AI 한방 상담 별도 페이지 (15개 증상별 구조화된 안내, 백엔드 불필요) |
| `vercel.json` | (옛 vercel 시절 잔재. Cloudflare 환경에서는 무시됨) |
| `functions/chat/` | Supabase 챗봇 백엔드 코드 (현재 미사용, 옛 코드) |
| `migrations/` | Supabase DB 마이그레이션 (현재 미사용, 옛 코드) |
| `README.md` | 옛 Next.js 시절 README (옛 정보, 무시) |
| `배포가이드.md` | 옛 가이드 |

### 로컬 전용 파일 (.gitignore에 등록되어 GitHub로 안 올라감)

| 파일 | 역할 |
|------|------|
| `push.bat` | **GitHub 푸시 자동화 스크립트** (PAT 포함, 절대 외부 공유 금지) |
| `setup.bat`, `migrate.bat`, `cleanup.bat` | 일회성 설정 스크립트 (이미 사용됨, 보관용) |
| `push_history.txt` | 푸시 이력 자동 기록 |
| `push_log.txt`, `migrate_log.txt` | 옛 디버깅 로그 |
| `CLAUDE.md` | 이 파일 |

### 바탕화면 단축키
- **"온누리 푸시"** (push.bat 바로가기) — 더블클릭으로 자동 푸시

---

## 4. 작업 흐름 (사이트 수정 시)

### 일반 흐름
1. **사용자가 Claude에게 수정 요청** (예: "맨 아래 카드 색깔 좀 바꿔줘")
2. **Claude가 `index.html` 편집** (Read/Edit/Grep 도구로 정확한 위치 찾아 수정)
3. **사용자가 바탕화면 "온누리 푸시" 더블클릭** (또는 CMD에서 `push.bat`)
4. **push.bat 6단계 자동 실행**:
   - [1/6] 옛 로그 파일 git tracking 정리
   - [2/6] `index.html` → `onnuri_clinic (3)_mobile.html` 복사
   - [3/6] `git add -A`
   - [4/6] 자동 타임스탬프 커밋 (예: "Update 2026-05-11 14:30")
   - [5/6] `git pull --rebase origin main` (외부 변경사항 통합)
   - [6/6] `git push origin main`
5. **PUSH SUCCESSFUL** 화면 + 검증 체크리스트 표시
6. **사용자가 라이브 사이트 확인 후 Y/N 입력**
7. **push_history.txt에 자동 기록**
8. **Cloudflare Pages 자동 빌드 → 1~2분 후 라이브 반영**

### 새 페이지 추가 시
- 새 .html 파일을 폴더에 추가 (예: `events.html`)
- `index.html` 네비에 링크 추가 (`<li><a href="events.html">이벤트</a></li>`)
- 그대로 push.bat 실행하면 새 페이지도 자동 배포됨

---

## 5. 주요 섹션 / 기능 (index.html 안)

| 섹션 ID | 위치 | 설명 |
|---------|------|------|
| `#hero` | 상단 | 메인 히어로 영역 |
| `#about` | | 한의원 소개 |
| `#story` | | 원장 소개 / 철학 |
| `#treatments` | | 진료 분야 |
| `#info` | | 진료 안내 (시간, 오시는 길) |
| `#directions` | (info 안) | 오시는 길 카드 (앵커 — 상단 메뉴 "오시는 길"이 여기로 스크롤) |
| `#gallery` | | 한의원 둘러보기 |
| `#healthnavi` | | 헬스네비 (AI 사전 상담 설문) |
| `#consult` | | AI 한방 상담 안내 카드 (CTA → ai-consult.html) |
| `#contact` | 하단 | CONTACT (전화 / 블로그 / 위치 카드) |

### 모달들
- `#mapModal` — "위치 / 약도" 카드 클릭 시 약도 + 네이버지도/카카오맵 길찾기
- `#bookingModal` — "지금 예약하기" 버튼 클릭 시 예약 방법 선택
- `#hnModal` — 헬스네비 사전 상담 설문 모달

### 외부 링크
- 네이버 블로그: `https://blog.naver.com/epaphro_`
- 네이버 지도 검색: `https://m.map.naver.com/search2/search.naver?query=온누리한의원+수원+권선동`
- 카카오맵 검색: `https://map.kakao.com/?q=온누리한의원+수원+권선동`

---

## 6. 중요 약속 / 컨벤션

### ✅ DO
- `index.html`만 편집할 것 (`onnuri_clinic (3)_mobile.html`은 push.bat이 자동 동기화)
- 한글 그대로 사용 OK (UTF-8)
- 외부 라이브러리 추가 시: CDN URL 사용 (CSP 통과해야 함)
- 색상은 가능하면 기존 CSS 변수 사용 (`var(--green)`, `var(--green-pale)`, `var(--warm)` 등)
- 새 기능 추가 시 모바일 반응형 고려 (`@media (max-width:640px)` 등)

### ❌ DON'T
- ⚠️ **카카오톡 상담 버튼 추가 금지** (운영자가 일일이 응대하기 어려워서 의도적으로 제거함)
- ⚠️ **API 키가 필요한 클라이언트 사이드 코드 금지** (예: `fetch('https://api.anthropic.com/v1/messages')` 같은 직접 호출 → CORS 차단 + 키 노출)
  - AI 기능이 필요하면 새 ai-consult.html처럼 키워드 매칭 방식으로 구현
- ⚠️ **`push.bat`, `setup.bat`, `migrate.bat`을 GitHub로 push 금지** (PAT 노출). 이미 .gitignore에 있음
- ⚠️ **PAT를 채팅에 출력하지 말 것**
- ⚠️ **`functions/chat/`, `migrations/` 폴더 건드리지 말 것** (옛 코드지만 그대로 둘 것)

### 🔄 동기화 규칙
- 메인 서빙 파일은 `index.html`이지만, vercel.json 설정 때문에 옛 환경에선 `onnuri_clinic (3)_mobile.html`이 서빙되었음
- 호환성 위해 push.bat이 두 파일을 자동 동기화
- 즉, 둘 중 하나만 수정하면 됨 (관례상 `index.html`)

---

## 7. 의료 콘텐츠 작성 가이드

AI 한방 상담 답변 / 진료 안내 작성 시:

### ✅ 권장
- "한방에서 보는 관점" + "가정에서 할 수 있는 관리" + "한의원에서 도와드릴 수 있는 부분" + 마무리 권유 (4단 구조)
- "정확한 진단은 온누리한의원에 내원하셔서 한의사와 직접 상담해주시기를 권해드립니다" 마무리 권유 필수

### ❌ 금지
- 처방명 직접 언급 (갈근탕, 소청룡탕 등)
- 혈자리명 직접 언급 (백회혈, 풍지혈 등)
- 단정적 치료 효과 약속 ("침치료/뜸으로 100% 낫습니다" 같은 표현)

---

## 8. 자주 발생하는 작업 패턴

### "텍스트 X를 Y로 바꿔줘"
1. `Grep`으로 X가 있는 라인 찾기 (`pattern: "X"`, `path: index.html`)
2. `Read`로 해당 영역 정확히 확인
3. `Edit`로 정확한 old_string → new_string

### "버튼/카드 추가해줘"
1. 기존 비슷한 요소 (`Grep`으로 `class="contact-card"` 등) 찾기
2. 같은 패턴으로 새 요소 작성
3. `Edit`로 적절한 위치에 삽입

### "스타일 (색깔/크기) 바꿔줘"
1. CSS 영역 (`<style>` 안) 또는 인라인 style 찾기
2. CSS 변수 (`--green`, `--warm` 등) 우선 활용
3. 모바일 반응형(`@media (max-width:640px)`) 함께 수정 필요한지 확인

### "새 페이지 만들어줘"
1. 별도 .html 파일로 작성 (예: `events.html`)
2. 폴더 구조 그대로 두기 (Cloudflare는 root에서 정적 파일 서빙)
3. `index.html` 네비에 링크 추가
4. push.bat 실행

---

## 9. 트러블슈팅 메모

### push.bat 실행 시 에러
- **"git rejected (fetch first)"**: 외부에서 다른 푸시 있음 → push.bat의 [5/6] pull --rebase 단계가 자동 처리
- **"index file corrupt"**: Linux 샌드박스에서 git 작업 시 발생할 수 있음. Windows native git은 영향 없음 → push.bat을 Windows에서 실행하면 OK
- **"or은(는) 예상되지 않았습니다"**: 배치 파서 오류. `if (...)` 블록 안의 echo 문에 `(...)` 괄호가 있을 때 발생. 괄호 제거 또는 `^(`, `^)` 이스케이프
- **카카오톡 채널 안내 alert**: 옛 잔재. 보이면 제거 요청 (이미 메인은 정리됨)

### 라이브 사이트 변경사항 안 보임
1. Cloudflare 빌드 시간 (30~90초) 대기
2. 브라우저 강제 새로고침 (Ctrl+Shift+R)
3. Cloudflare 대시보드 → Workers & Pages → onnuriclinic-web → Deployments에서 최근 빌드 상태 확인
4. 빌드 실패 시 빌드 로그 확인

### Vercel 프로젝트들 (사용 안 함)
- `onnuri1-home` Vercel 프로젝트: 옛 placeholder, 무시
- `onnuriclinic-web` Vercel 프로젝트: 사용 중단 (Cloudflare로 이전됨)
- 둘 다 그대로 둬도 라이브 사이트에 영향 없음

---

## 10. 신규 세션 시 Claude의 첫 동작 (권장)

새 Cowork 세션에서 이 폴더를 열었을 때:

1. **이 CLAUDE.md를 먼저 읽기** (이미 자동 로드되어 있을 것)
2. 사용자 요청 들어오면:
   - 코드 수정 작업이면 → `Grep` / `Read` / `Edit`로 처리
   - 푸시 단계는 사용자가 직접 (또는 명시적 요청 시 처리)
3. **불필요한 재질문 금지**:
   - "어디 GitHub 저장소에 push할까요?" → 이미 정해져 있음 (kimhungtae/onnuriclinic-web)
   - "어떤 호스팅 쓰세요?" → Cloudflare Pages (onnuri-clinic 프로젝트)
   - "PAT 발급해드릴까요?" → 이미 발급되고 push.bat에 임베드됨
   - "푸시 자동화 만들어드릴까요?" → 이미 구축됨 (바탕화면 "온누리 푸시")

---

## 11. 작업 이력 (주요 마일스톤)

- **2026-05-07**: GitHub 저장소 만들기, PAT 발급, 로컬 git 초기화, push.bat 자동화 구축
- **2026-05-07**: 위치 / 약도 모달 기능 추가 (네이버지도/카카오맵 길찾기 버튼 포함)
- **2026-05-08**: 진료 분야 상세 모달 추가
- **2026-05-11**: 호스팅 위치 추적 → Cloudflare Pages 발견 → GitHub 연동 설정
- **2026-05-11**: AI 한방 상담 페이지 (`ai-consult.html`) 통합 (15개 증상별, 키워드 매칭)
- **2026-05-11**: 카카오톡 상담 버튼 모두 제거 (운영 부담 회피)
- **2026-05-11**: 망가진 인라인 챗봇 (Anthropic API 직접 호출) → CTA 카드로 교체
- **2026-05-11**: push.bat에 pull-rebase 단계 + 검증 단계 추가, push_history.txt 도입

---

**마지막 업데이트**: 2026-05-11 (Cowork 세션에서 자동 작성)
