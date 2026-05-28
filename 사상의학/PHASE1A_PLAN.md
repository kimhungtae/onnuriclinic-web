# Phase 1a 작업 계획서 — 정적 HTML 4모듈 완성

> **목표**: cowork_spec.md의 모듈 A·C·D·E를 v24.html 패턴으로 단일 HTML 4개에 구현. LocalStorage로 데이터 전달. 2~3주 안에 임상 시험 운영 가능 상태로.
>
> **트랙**: Phase 1a (정적 HTML) → Phase 1b (원장실 PC 서버화)
>
> **버전**: v1.0 · **시작일**: 2026-05-19

---

## 0. 확정 사항 (Phase 1a 동안 변경 없음)

| 항목 | 값 |
|---|---|
| 사용 위치 | 온누리한의원 원내 (외부 인터넷 불필요) |
| 디바이스 | 갤럭시탭 Chrome (Android 12+) 우선, 데스크톱 Chrome 보조 |
| 데이터 저장 | 각 iPad의 LocalStorage (Phase 1b에서 원장실 PC SQLite로 통합) |
| 인증 | 없음. 원내 Wi-Fi 접속 자체가 인증 |
| 임상례 DB 입력 | Cowork 자동 추출 100% |
| 모듈 B 처리 | Phase 1에서 제외. 모듈 A 신뢰도 미달 시 바로 C로 분기 |
| 자료 출처 표기 | 모든 처방·가감 항목에 안준철·하만종·권재식 등 표기 (cowork_spec §7-5) |
| 안전 안내문 | 처방·결과 화면마다 2종 고정 표기 (cowork_spec §7-3) |
| 인쇄 호환 | A4 인쇄 깨끗 (병행 운영) |

---

## 1. 전체 구조 — 4모듈 정적 HTML 시리즈

```
[온누리_사상체질_감별설문지_v24.html]    ← 모듈 A (완성)
        ↓ 신뢰도 ≥70%로 단일 체질 확정
        ↓ (이 경우 모듈 E로 직진 가능)
        │
        ↓ 신뢰도 <70% 또는 양체질 후보
        │
[온누리_정밀시진_C1_v1.html]             ← 모듈 C-1 (신규)
        ↓ 한쪽 ★★ 확정 → 모듈 E
        ↓ 양쪽 ★★ 또는 ★ 1~2개 차 → 모듈 D
        │
[온누리_기능검사_D_v1.html]              ← 모듈 D (신규)
        ↓ 체질·한열·음양형 확정
        │
[온누리_처방추천_E_v1.html]              ← 모듈 E (신규)
        ↓ 처방 후보 3종 + 가감 + 부적합 시그널
        ↓
       처방 확정 + 인쇄
```

### 1.1 LocalStorage 키 컨벤션
```js
// 한 환자의 진료 세션 단위
const SESSION_KEY = 'onnuri_session';

// 구조
{
  sessionId: 'cuid',
  patient: { name, gender, age, birthYear },
  startedAt: timestamp,
  // 모듈 A 결과
  moduleA: {
    answers: {...},
    result: { top: 'sy', pcts: {ty,te,sy,se}, confidence },
    hanyul: 'cold'|'hot'|'mixed',
    completedAt: timestamp
  },
  // 모듈 C 결과 (선택)
  moduleC: {
    pair: 'taeum_soyang',
    checks: { left: {killer:N, normal:N}, right: {killer:N, normal:N} },
    verdict: 'taeum'|'soyang'|'pending',
    completedAt: timestamp
  },
  // 모듈 D 결과 (선택)
  moduleD: {
    sections: {
      pulse: {...}, palpation: {...}, reaction: {...}, drug_trial: {...}
    },
    fourCriteria: { stool, urine, sleep, fatigue }, // 4대 호전 카운트
    finalConstitution: 'te',
    finalHanyul: 'cold',
    finalYangYin: 'yang',
    completedAt: timestamp
  },
  // 모듈 E 결과
  moduleE: {
    chiefComplaints: [...],
    candidates: [...], // 3순위까지
    selected: { prescription, period, note },
    completedAt: timestamp
  }
}
```

### 1.2 갤럭시탭 간 데이터 이동 (Phase 1a 한계)
- LocalStorage는 탭별 독립 → 키오스크 탭 → 카운터 탭 → 원장실 탭 자동 이동 X
- **임시 해법**: 모듈 A 완료 시 QR 코드로 결과 URL 생성 → 다른 탭에서 스캔
- 또는 **단순 해법**: 카운터·원장실에서 키오스크 탭 직접 들고 다님 (1대로 통합)
- **근본 해법**: Phase 1b 서버화에서 자동 동기화 (1~2주 안에)

### 1.3 갤럭시탭 운영 약속
- **반드시 Chrome 사용** (Samsung Internet 금지) — LocalStorage·CSS 호환성 일관성
- **PWA로 설치**: Chrome → 메뉴 → "홈 화면에 추가" → 앱처럼 사용
- **자동 업데이트 ON**: Play 스토어 Chrome 자동 업데이트 유지

### 1.4 실 운영 기기 — 노트북 (네트워크 상)
**2026-05-19 저녁 결정**: SM-T580 갤럭시탭에서 v24 구동 안정성 부족 → 노트북 기반으로 전환.

**노트북 환경 (Chrome 최신 가정)**:
- Windows·Mac 무관, Chrome 120+ 사용
- 모든 모듈 최신 표준 자유롭게 사용 가능
- 외부 라이브러리(Recharts·Chart.js 등) 필요 시 사용 가능
- 화면 1366×768 이상 보장

**아래 SM-T580 제약 사항은 보관용** — 향후 태블릿 도입 시 재참고:

### 1.4 (보관) 과거 결정: Galaxy Tab A 10.1 (SM-T580, 2016년식)
**현재 사용 기기 사양**:
- Android 8.1 (최종 OS, 보안 업데이트 중단됨)
- Chrome: 100번대 후반 추정
- RAM 2GB / Exynos 7870 / 10.1" 1920×1200
- 802.11n Wi-Fi

**개발 제약** (Phase 1a 전체 적용):
- 모든 모듈은 **Chrome 100+ 대상 동작 보장**. 최신 CSS(`:has()`, container queries, view transitions 등) 금지
- **외부 라이브러리 금지** — vanilla JS + SVG로만. Recharts·D3·Chart.js 안 씀 (v24.html처럼)
- **CSS는 2022년 표준까지만** — `gap`, flex, grid, `clamp()`, custom properties OK
- **JSON 분할 로드** — `prescriptions.json`을 체질별 4파일로 쪼개거나 lazy fetch
- **메모리 의식**: 한 화면 로드 시 큰 객체는 사용 후 명시적 `= null`
- **이미지·폰트 경량화** — Noto KR weight 2개만 (400, 600)
- **W1·W2·W3 단계 끝마다 SM-T580 실기 테스트** 필수

**역할 배분 제안** (현 단일 기기 환경):
- SM-T580 1대 → **환자 키오스크 우선** (모듈 A·C-1·D, 자가입력 중심)
- 카운터·원장실 라이브 큐 → **Phase 1b 서버화 후 원장실 PC 본체 화면**으로 보기
- 모듈 E(처방 추천)는 처방 DB가 무거우므로 원장실 PC 또는 업그레이드 후 태블릿에서 운용

**업그레이드 권장 시점**:
- 모듈 E 본격 운영 시작
- 카운터·원장실 동시 라이브 큐 필요해질 때
- 권장 후속 기기: Tab S9 FE / Tab A9+ 이상 (RAM 4GB+, Android 13+)

---

## 2. 작업 큐 (단위·기간·산출물)

각 작업은 단일 산출물 + 검증 기준. 클로드코드에 던질 때 그대로 사용 가능.

### W1 — 모듈 C-1 (태음↔소양 정밀 시진) HTML 구현
**기간**: 3~4일
**입력**: `chat-package/mockup_taeum_soyang.html`, `cowork_spec.md §2.1`
**산출물**: `온누리_정밀시진_C1_v1.html`

**작업 내용**:
- [ ] mockup의 정적 체크박스를 클릭형으로 변환
- [ ] 좌/우 컬럼별 ★★(killer)·★(normal) 카운터 실시간 갱신
- [ ] 판정 로직 (cowork_spec §2.1):
  - 한쪽 ★★ + 반대쪽 ★★ 없음 → 그 체질 확정
  - 양쪽 ★★ → 보류, 모듈 D로 진행 안내
  - 양쪽 ★★ 없음 + ★ 3개 차이 → 다수 쪽 확정
  - 양쪽 ★★ 없음 + ★ 1~2개 차이 → 모듈 D로
- [ ] 환자 정보 헤더 (LocalStorage onnuri_session에서 자동 로드)
- [ ] 모듈 A 결과 표시 (`태음 42% / 소양 38%`)
- [ ] 결과를 onnuri_session.moduleC에 저장
- [ ] "기능검사 시작" 버튼 → 모듈 D HTML 열기
- [ ] "처방 추천 진행" 버튼 → 모듈 E HTML 열기
- [ ] A4 인쇄 스타일 (mockup 기반 유지)
- [ ] 안전 안내문 2종 하단 고정

**검증**:
- 좌측 ★★ 1개 체크 시 "태음인 확정" 메시지
- 양쪽 ★★ 0개 + ★ 좌 5/우 1 → "태음인 확정" 메시지
- 양쪽 ★★ 1개씩 → "기능 검사 진행 필요" 메시지

---

### W2 — 모듈 D (기능 검사) HTML 구현
**기간**: 4~5일
**입력**: `chat-package/mockup_function_test.html`, `cowork_spec.md §2.2`
**산출물**: `온누리_기능검사_D_v1.html`

**작업 내용**:
- [ ] 4섹션 입력 UI (맥진·복진·반응·약물시험)
- [ ] 섹션 D-1 맥진: 기본맥·관맥·한열 라디오/체크
- [ ] 섹션 D-2 복진: 상복부 가스·심하 압통·대변 빈도
- [ ] 섹션 D-3 반응 (히든카드): 커피·산약·우유·평생 못 먹는 음식·홍삼
- [ ] 섹션 D-4 약물 시험: 4대 적합성 기준 (대변·소변·수면·피로감)
  - 각 항목 호전/유지/악화 3택
  - **3개 이상 호전 = 적합 판정** (cowork_spec §2.2)
- [ ] 종합 판정 산출: 체질 + 한열 + 음양형 동시 확정
- [ ] 결과를 onnuri_session.moduleD에 저장
- [ ] "처방 추천 진행" 버튼 → 모듈 E
- [ ] 인쇄 스타일
- [ ] 안전 안내문 2종

**검증**:
- 4대 기준 중 3개 이상 호전 시 "적합 — 처방 추천 진행" 메시지
- 2개 이하 호전 시 "후보 재평가 — 모듈 C로 돌아가기" 옵션 노출
- 단독 증상 호전만으로 판정 금지 (안준철 원칙) — UI에 명시

---

### W3 — 모듈 E (처방 추천) HTML 구현
**기간**: 5~7일 (가장 큰 작업)
**입력**: `chat-package/mockup_rx_recommendation.html`, `cowork_spec.md §2.3`, `사상의학/류주열사상처방개정판.xlsx`, 안준철·하만종·권재식 HWP/PDF
**산출물**: 
- `온누리_처방추천_E_v1.html`
- `data/prescriptions.json` (자동 추출 산출물)
- `data/clinical_cases.json` (임상례 가감 사례, 자동 추출)
- `data/symptom_chips.json` (체질·한열별 자주 쓰는 주소증)

**작업 내용**:
- [ ] **사전 ETL 스크립트** (1~2일):
  - 류주열 XLSX → `prescriptions.json` (352개, 자동)
  - 안준철·하만종·권재식 HWP/PDF → 임상례 추출 (자동)
  - 안준철 카톡강의에서 주소증·체질 매핑 추출
  - 추출 결과 `data-sources.md`에 추적 (어느 자료 어느 페이지에서)
- [ ] **E-1 환자 요약 카드**: onnuri_session에서 자동 로드
- [ ] **E-2 주소증 입력**:
  - 체질·한열별로 자동 필터링된 칩
  - 다중 선택 (최대 3개)
  - 자유 기재란
- [ ] **E-3 매칭 엔진** (cowork_spec §2.3 가중치):
  - 체질 일치 (필수, 40%)
  - 한열 일치 (필수, 25%)
  - 음양형 일치 (태음만, 15%)
  - 주소증 부합도 (변동, 20%)
- [ ] **E-4 추천 처방 카드 (3순위)**:
  - 처방명 + 한자명 + 매칭도 % + 시각화 바
  - 추천 근거 / 주의 / 부적합 시그널 / 본 케이스 가감
  - 출처 표시 (자료명) — **반드시**
- [ ] **E-5 최종 처방 결정란**:
  - 처방·기간·재진 시점·메모
  - 인쇄 / 차트 저장 버튼
- [ ] onnuri_session.moduleE에 저장
- [ ] 인쇄 스타일 + 안전 안내문 2종

**검증**:
- 환자 = 태음인·한증·양형, 주소증 = "만성 비염, 식적" → 1순위 태음조위탕 (매칭도 92% 정도)
- 출처 누락 처방 0건
- 가감 사례가 자료별로 적어도 50개 이상 추출됨

---

### W4 — 4모듈 데이터 연결 + 시작 화면
**기간**: 2~3일
**산출물**: `온누리_사상체질_홈_v1.html`

**작업 내용**:
- [ ] 홈 화면: 4개 모듈 진입 버튼 + 현재 세션 표시
- [ ] 새 환자 시작 → 환자 정보 입력 → 모듈 A로
- [ ] 자동 분기 로직 (cowork_spec §F-2):
  - A 신뢰도 ≥70% & 단일 체질 → C 생략, E로 직진
  - A 신뢰도 <70% & 양체질 후보 → C로
  - C 보류 → D로
  - D 적합 → E로
- [ ] 진행 중 세션 복원 (브라우저 종료 후 재진입 가능)
- [ ] 세션 종료·새 세션 시작
- [ ] 인쇄: 전체 워크플로 PDF (cowork_spec §F-3) — 간소화 버전

**검증**:
- 모듈 A 완료 후 자동 분기 (신뢰도 80% → 직접 E 진입)
- 신뢰도 60% → C-1 진입
- iPad에서 모든 페이지 정상 표시

---

### W5 — 임상 시험 운영 (2주)
- [ ] 환자 5~10명 응답 받아 모듈 A~E 끝까지 진행
- [ ] 원장님 직관과 다른 결과가 나오는 케이스 기록
- [ ] 처방 추천이 비합리적인 케이스 기록
- [ ] 매칭 가중치·UX 조정안 정리

### W6 — Phase 1b 착수 (원장실 PC 서버화)
별도 계획서 `PHASE1B_PLAN.md`로 작성 예정. 핵심:
- 원장실 PC에 Node.js + Next.js + SQLite 설치
- LocalStorage → SQLite 마이그레이션 스크립트
- 부팅 시 자동 시작 (Windows 작업 스케줄러)
- IP 고정 + 원내 Wi-Fi에서 iPad 접속 안내
- 일일 자동 백업 → 외장 HDD

---

## 3. 의료 안전 가드 (cowork_spec §7 + 안준철 원칙)

모든 모듈 공통:

### 3.1 안전 안내문 2종 (필수, 처방·결과 화면 하단)
```
※ 한 가지 증상의 호전만으로 체질·처방을 확정하지 않습니다 (안준철)
※ 체질과 한열은 항상 전제로 하고 약물 적합성을 확인합니다 (안준철)
```

### 3.2 처방 카드 필수 표기
- 부적합 시그널 (어떤 증상 나오면 즉시 변경)
- 출처 (안준철 / 하만종 / 권재식 / 사상임상의학회 등)
- "추천" 표기 (자동 처방 도구로 오인 방지)

### 3.3 의료기기 비해당 명시
- 홈·각 모듈 상단에 "본 도구는 임상 의사결정 지원 도구이며 의료기기가 아닙니다. 최종 진단·처방은 원장님이 결정합니다." 표기

---

## 4. 자료 자동 추출 ETL 계획 (W3 사전 작업)

### 4.1 자동 추출 대상
| 자료 | 추출 방식 | 산출 |
|---|---|---|
| 류주열사상처방개정판.xlsx | openpyxl, 4 시트 | prescriptions.json (352개) |
| 안준철 강의록 PDF (2009·2012) | pdf-parse + 정규식 | clinical_cases.json (가감) |
| 안준철 카톡강의 HWP | LibreOffice → 텍스트 → 패턴 매칭 | symptom_chips.json |
| 사상임상의학회 체질별/증후별 PDF | pdf-parse | symptom_to_prescription.json |
| 하만종 자료 | (있다면) | 모듈 C-2용 |
| 권재식 카톡모음 | LibreOffice → 텍스트 | reaction_signals.json (음식 반응) |

### 4.2 추출 신뢰도 정책
- 자동 추출 결과를 `data/extracted_*.json`에 저장 + `data-sources.md`에 어느 자료 어느 페이지에서 추출됐는지 메모
- 처방 매칭 시 출처 표시
- 임상 시험(W5) 중 잘못된 추출 발견 시 운영 중 수정

### 4.3 실패 대비
- HWP 변환 실패 → HWP→PDF → pdf-parse
- PDF 표 깨짐 → 수동 보정 안내 (운영 중 처리)
- 처방명 정규화 실패 → 별표 표시 + 운영 중 보정

---

## 5. 산출물 카탈로그 (Phase 1a 종료 시점)

| 파일 | 위치 | 용도 |
|---|---|---|
| `온누리_사상체질_감별설문지_v24.html` | onnuri-site/ | 모듈 A (기존) |
| `온누리_정밀시진_C1_v1.html` | onnuri-site/ | 모듈 C-1 (신규) |
| `온누리_기능검사_D_v1.html` | onnuri-site/ | 모듈 D (신규) |
| `온누리_처방추천_E_v1.html` | onnuri-site/ | 모듈 E (신규) |
| `온누리_사상체질_홈_v1.html` | onnuri-site/ | 통합 홈 (신규) |
| `data/prescriptions.json` | onnuri-site/data/ | 류주열 처방 DB |
| `data/clinical_cases.json` | onnuri-site/data/ | 안준철 가감 사례 |
| `data/symptom_chips.json` | onnuri-site/data/ | 주소증 칩 |
| `data/symptom_to_prescription.json` | onnuri-site/data/ | 매칭 보조 |
| `data/reaction_signals.json` | onnuri-site/data/ | 권재식 음식 반응 |
| `data/data-sources.md` | onnuri-site/data/ | 출처 추적 |

이 11개 파일이 모이면 iPad에 다운로드해서 즉시 임상 시험 가능 상태.

---

## 6. 다음 액션 (오늘~내일)

1. [ ] **Cowork(여기)에서**: ETL 사전 스크립트 작성 시작 — 가장 시간 많이 듬
2. [ ] **클로드코드(또는 직접)에서**: W1 모듈 C-1 HTML 구현 착수
3. [ ] **원장님**: iPad 1대 준비 (테스트용), 사파리 충분
4. [ ] **공유 자료**: 모듈 B 잔존 코드는 Phase 2에서 다룰 예정이므로 지금은 보류

---

## 7. 위험·미결정

- [ ] 자료 권리자(안준철·하만종·권재식) 사용 허가 — 원내 한정이라 단기 OK, **공개 전 협의 필요**
- [ ] LocalStorage 데이터 손실 위험 — Phase 1b 서버화 전까지 환자 1명 진료 = 1 세션 단위로 빠르게 인쇄 권장
- [ ] iPad 1대만으로 운영 시 카운터·원장실 동시 보기 불가 — Phase 1b까지는 1대로 통합 운영
- [ ] 자동 추출 정확도 — W3 진행 중 원장님 1차 검수 필요할 수 있음 (자료 종류별로)

---

**문서 끝**. 작업 진행은 PROGRESS_MANUAL §8 "다음 7일 할 일"에 누적 기록.
