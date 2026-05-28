# W1 작업서 — 모듈 C-1 (태음↔소양 정밀 시진) 구현

> **이 문서의 정체**: Claude Code 단일 세션에 던지면 모듈 C-1을 90~95% 완성도로 구현 가능한 친절판 작업서.
> 임상 로직·임계값·안전 문구·코드 스켈레톤·검증 기준을 모두 박아 넣어 추측 영역을 최소화.
>
> **버전**: v1.0 · **작성일**: 2026-05-20 · **목표 완료**: W1 (3~4일)

---

## 1. 미션 한 줄

**v24.html(모듈 A)에서 자가설문 신뢰도가 70% 미만이거나 태음·소양이 경합으로 나온 환자를 위해, 시진 항목 체크로 두 체질 중 하나를 확정 또는 보류 판정하는 단일 HTML 페이지를 만든다.**

---

## 2. 산출물 (반드시 이대로)

### 2.1 결과 파일
- **파일명**: `온누리_정밀시진_C1_v1.html`
- **저장 위치**: `C:\Users\ADmiN\Downloads\onnuri-site\` (v24.html과 같은 폴더)
- **형식**: 단일 HTML 파일 (CSS·JS 인라인, 외부 라이브러리 0개)

### 2.2 산출물 점검 (Claude Code가 자체 확인)
- [ ] 파일이 `<!DOCTYPE html>`로 시작하고 `</html>`로 끝남
- [ ] `<script>` 내용을 추출해 Node `node --check`에 통과
- [ ] 브라우저에서 열면 첫 화면이 정상 노출 (v24.html처럼 빈 화면 X)
- [ ] 모든 체크박스 클릭 시 카운터·판정 메시지 실시간 반응

---

## 3. 참조 자료 (읽는 순서)

| 순서 | 파일 | 어디서 무엇을 가져올지 |
|---|---|---|
| 1 | `사상의학\chat-package\cowork_spec.md` §2.1 | 판정 로직 3 조건, 진입 조건, 카테고리 구성 원칙 |
| 2 | `사상의학\chat-package\mockup_taeum_soyang.html` | **UI 청사진** — HTML 구조, CSS 변수, 항목 텍스트 전체. 본 작업서 §6 데이터 테이블이 mockup과 1:1 일치 |
| 3 | `온누리_사상체질_감별설문지_v24.html` | **코딩 스타일 모델** — `:root` CSS 변수, render() 패턴, LocalStorage 사용법, A4 인쇄 스타일 |
| 4 | `사상의학\chat-package\cowork_spec.md` §7 | 의료 안전 가드(안내문 2종·출처 표시·"추천" 표기 등) |
| 5 | `사상의학\PHASE1A_PLAN.md` §1.1 | LocalStorage 통합 키 구조 (모듈 A·C·D·E 공유) |

---

## 4. 아키텍처 결정 사항 (이의 없음)

- **단일 HTML** — CSS·JS·SVG 모두 인라인
- **외부 라이브러리 0개** — vanilla JS만. Recharts·D3·jQuery 등 금지
- **데이터 저장** — `localStorage.onnuri_session` 하나의 키에 JSON 누적
- **렌더 방식** — v24.html과 동일한 `screen` 클래스 + `render()` 함수 패턴
- **대상 환경** — 노트북 Chrome 최신 (Phase 1a 후속에서 결정된 사양)
- **인쇄 호환** — A4 1쪽으로 출력되도록 `@media print` 스타일

---

## 5. 화면 구조 (3 screen)

```
screen-info       세션 시작·환자 정보 확인 (LocalStorage 자동 로드)
                  ↓ "변별 시작" 버튼
screen-chart      5개 카테고리 비교 표 + 실시간 카운터 + 판정 메시지
                  ↓ "판정 확정" 버튼
screen-verdict    최종 판정 결과 + 다음 모듈 분기 버튼
                    [태음 확정 → 모듈 E로]
                    [소양 확정 → 모듈 E로]
                    [보류 → 모듈 D로]
                    [돌아가기 → 차트로]
```

---

## 6. 데이터 — 변별 항목 25개 (mockup §<tbody> 추출)

> **반드시** 다음 데이터 객체를 그대로 코드에 박을 것. 텍스트 한 글자도 바꾸지 말 것 (임상 정확도 보장).

```javascript
const C1_ITEMS = {
  taeum: [
    // CAT 1 흉곽 형태
    { id:'t1-1', cat:1, killer:true,  text:'앞뒤로 두툼하고 둥근 원통형(종형)' },
    { id:'t1-2', cat:1, killer:true,  text:'흉골각이 손가락 2개 이상으로 넓다' },
    { id:'t1-3', cat:1, killer:false, text:'허리둘레가 굵어 몸통이 꽉 차 있다' },
    // CAT 2 엉덩이·하체
    { id:'t2-1', cat:2, killer:false, text:'허리 굵고 바지 허리 치수에 몸을 맞춤' },
    { id:'t2-2', cat:2, killer:false, text:'복부·허리가 발달, 전체적 원통형' },
    // CAT 3 얼굴·기세
    { id:'t3-1', cat:3, killer:false, text:'얼굴 골격이 크고 이목구비가 넓게 퍼져 있다' },
    { id:'t3-2', cat:3, killer:false, text:'이마가 평평하고 양미간이 넓다 (동전 하나 폭)' },
    { id:'t3-3', cat:3, killer:false, text:'안색이 홍조를 띠며 탁하게(검게) 보인다' },
    { id:'t3-4', cat:3, killer:false, text:'목이 굵고 짧음 (목·어깨 경계 불분명)' },
    // CAT 4 입
    { id:'t4-1', cat:4, killer:true,  text:'입이 크고 구각(입꼬리)이 넓다',
      note:'소양 배제 지표' },
    // CAT 5 음용수·구갈
    { id:'t5-1', cat:5, killer:false, text:'평소 물을 잘 안 마신다 (음주자 제외)' },
    { id:'t5-2', cat:5, killer:true,  text:'구갈 시 입천장과 코가 마른다고 표현' },
    { id:'t5-3', cat:5, killer:true,  text:'땀이 충분히 나면 개운, 안 나면 답답·무거움' },
  ],
  soyang: [
    // CAT 1 흉곽 형태
    { id:'s1-1', cat:1, killer:true,  text:'가슴·어깨가 좌우로 넓고 허리 아래 급격히 좁아짐(역삼각)' },
    { id:'s1-2', cat:1, killer:false, text:'흉골각이 좁다 (손가락 1개 이내)' },
    { id:'s1-3', cat:1, killer:false, text:'상체 길고 하체가 짧다' },
    // CAT 2 엉덩이·하체
    { id:'s2-1', cat:2, killer:true,  text:'어깨 넓으나 엉덩이 작고 가벼움',
      note:'핵심 결정타' },
    { id:'s2-2', cat:2, killer:false, text:'오래 앉아 있으면 불편해함' },
    { id:'s2-3', cat:2, killer:false, text:'발이 키에 비해 작고 짧다' },
    // CAT 3 얼굴·기세
    { id:'s3-1', cat:3, killer:true,  text:'이마·미간이 돌출, 가운데로 몰리는 느낌' },
    { id:'s3-2', cat:3, killer:false, text:'말상·계란형, 아래턱 두터워 안정감' },
    { id:'s3-3', cat:3, killer:false, text:'안색이 누렇고 검은 편 (혹은 뺨만 붉음)' },
    { id:'s3-4', cat:3, killer:false, text:'눈빛 표예(剽銳), 동작이 경급(輕急)함' },
    // CAT 4 입
    { id:'s4-1', cat:4, killer:false, text:'이목구비가 오밀조밀, 아래턱이 짧고 갸름함' },
    // CAT 5 음용수·구갈
    { id:'s5-1', cat:5, killer:false, text:'위열 시 다음(多飮), 냉수를 즐겨 찾음' },
    { id:'s5-2', cat:5, killer:true,  text:'구갈 시 인후부가 마른다고 표현' },
    { id:'s5-3', cat:5, killer:true,  text:'대변 시원할 때 컨디션 최상' },
  ]
};

const CAT_LABELS = {
  1: { name:'흉곽 형태',     subtitle:'옆에서 관찰' },
  2: { name:'엉덩이·하체',   subtitle:'안정감·무게중심' },
  3: { name:'얼굴·기세',     subtitle:'기세로 본다' },
  4: { name:'입의 크기',     subtitle:'강력한 배제 지표' },
  5: { name:'음용수·구갈',   subtitle:'한열·표리 단서' },
};
```

**카운트 확인**: 태음 측 13항목(★★ 5, ★ 8), 소양 측 13항목(★★ 5, ★ 8). 총 26개 체크박스.

---

## 7. 판정 로직 (cowork_spec §2.1 그대로)

```javascript
function evaluateVerdict(checks) {
  // checks 형태: { taeum: { killer:N, normal:N }, soyang: { killer:N, normal:N } }
  const t = checks.taeum;
  const s = checks.soyang;

  // 조건 1: 한쪽에만 ★★ 결정타 체크 → 그 체질 확정
  if (t.killer > 0 && s.killer === 0) {
    return { verdict:'taeum', confidence:'high', reason:'태음 결정타 단독' };
  }
  if (s.killer > 0 && t.killer === 0) {
    return { verdict:'soyang', confidence:'high', reason:'소양 결정타 단독' };
  }

  // 조건 2: 양쪽 모두 ★★ 결정타 체크 → 보류, 기능 검사로
  if (t.killer > 0 && s.killer > 0) {
    return { verdict:'pending', confidence:'low', reason:'양쪽 결정타 충돌 — 기능 검사 필요' };
  }

  // 조건 3: 양쪽 모두 ★★ 없음 → ★ 일반 단서 비교
  const diff = t.normal - s.normal;
  if (diff >= 3)  return { verdict:'taeum',   confidence:'medium', reason:`★ 단서 ${diff}개 우위` };
  if (diff <= -3) return { verdict:'soyang',  confidence:'medium', reason:`★ 단서 ${-diff}개 우위` };

  // 그 외 (1~2개 차이 또는 동일) → 보류
  return { verdict:'pending', confidence:'low', reason:'★ 단서 차이 부족 — 기능 검사 필요' };
}
```

### 7.1 판정 메시지 (UI 노출용, 실시간 갱신)

판정 결과별로 화면 하단에 다음 박스 색상·문구 노출:

| verdict | 박스 색 | 메시지 |
|---|---|---|
| `taeum` (high) | 녹색 (`--taeum-l`) | "**태음인** 확정 — 결정타 단서. 처방 추천(모듈 E)으로 진행하세요." |
| `taeum` (medium) | 연녹 (`--taeum-bg`) | "**태음인** 우세 — ★ 단서 N개 우위. 처방 추천으로 진행 또는 기능 검사로 보강." |
| `soyang` (high) | 주황 (`--soyang-l`) | "**소양인** 확정 — 결정타 단서. 처방 추천(모듈 E)으로 진행하세요." |
| `soyang` (medium) | 연주황 (`--soyang-bg`) | "**소양인** 우세 — ★ 단서 N개 우위. 처방 추천으로 진행 또는 기능 검사로 보강." |
| `pending` | 노랑 (`--gold-l`) | "**보류** — 기능 검사(모듈 D)로 진행하여 맥진·복진·약물 시험 필요" + 사유 표시 |

---

## 8. LocalStorage 데이터 계약

### 8.1 읽기 (페이지 로드 시)
```javascript
const session = JSON.parse(localStorage.getItem('onnuri_session') || '{}');
// 기대 구조:
// session.patient = { name, gender, age, birthYear }
// session.moduleA = { result: { top, pcts, confidence }, hanyul, completedAt }
```

**모듈 A 결과가 없으면**: "자가설문(모듈 A)을 먼저 진행해주세요" 안내 + v24.html 링크.

### 8.2 쓰기 (판정 확정 시)
```javascript
session.moduleC = {
  pair: 'taeum_soyang',
  checks: {
    taeum:  { killer: 1, normal: 4, items:['t1-1','t1-3',...] },  // 체크된 id 목록 포함
    soyang: { killer: 0, normal: 2, items:['s3-2','s5-1'] },
  },
  verdict: 'taeum',           // 'taeum' | 'soyang' | 'pending'
  confidence: 'high',         // 'high' | 'medium' | 'low'
  reason: '태음 결정타 단독',
  completedAt: Date.now(),
};
localStorage.setItem('onnuri_session', JSON.stringify(session));
```

### 8.3 다음 모듈 분기 (판정 확정 후)
- `verdict === 'taeum' || verdict === 'soyang'` → 모듈 E (처방 추천) HTML 열기
  - W3 산출물 `온누리_처방추천_E_v1.html` (W3 완료 전이면 alert로 안내)
- `verdict === 'pending'` → 모듈 D (기능 검사) HTML 열기
  - W2 산출물 `온누리_기능검사_D_v1.html` (W2 완료 전이면 alert로 안내)
- "결과 출력" 버튼 → `window.print()`

---

## 9. UI 구체 명세

### 9.1 헤더 (screen-chart 상단)
```
[온누리 한의원]                         [v1 · 정밀 시진 C-1]
사상체질 정밀 시진 차트 — 태음 ↔ 소양
[환자명] · [성별] · [나이]세 · 모듈 A 결과: 태음 42% / 소양 38% (신뢰도 보통)
```
환자 이름·성별·나이·체질 % 모두 `session.patient`와 `session.moduleA.result.pcts`에서 자동 로드.

### 9.2 카테고리 비교 표
- mockup의 `<table class="compare">` 구조 그대로
- 좌측: 태음 항목, 우측: 소양 항목
- 각 항목은 `<label>` 안에 `<input type="checkbox" id="…" data-side="taeum|soyang" data-killer="true|false" data-cat="1~5">` + 텍스트
- 클릭 시 카운터 즉시 갱신·판정 박스 즉시 갱신

### 9.3 실시간 카운터 박스 (표 하단, sticky)
```
┌──────────────────────────────────────────┐
│ 태음 측  ★★ 1  |  ★ 3        소양 측  ★★ 0  |  ★ 2 │
│ ────────────────────────────────────────  │
│ [판정 박스 — §7.1 메시지가 실시간 표시]   │
└──────────────────────────────────────────┘
```

### 9.4 액션 버튼 (screen-chart 하단)
- **[← 모듈 A로 돌아가기]** (v24.html 열기)
- **[모든 체크 해제]** (확인 dialog → checks 초기화)
- **[판정 확정 →]** (LocalStorage 저장 + screen-verdict 노출)

### 9.5 판정 결과 화면 (screen-verdict)
- 큰 판정 카드 (verdict 색상·메시지)
- 체크된 항목 요약 (좌·우 컬럼별 ★★·★ 목록)
- 다음 액션 버튼:
  - taeum/soyang → "[처방 추천(모듈 E) 진행]"
  - pending → "[기능 검사(모듈 D) 진행]"
  - 공통: "[결과 인쇄]" + "[차트로 돌아가기]"

---

## 10. 의료 안전 가드 (반드시 포함, 위치 명시)

### 10.1 헤더 상단 (모든 screen)
```html
<div class="safety-banner">
  본 도구는 임상 의사결정 지원 도구이며 의료기기가 아닙니다.
  최종 진단·처방은 원장님이 환자를 직접 확인하고 결정합니다.
</div>
```

### 10.2 차트 화면 상단 안내 박스
```
판정 원칙
  ★★ 결정타 항목이 한쪽에서만 체크되면 그 체질로 확정합니다.
  결정타가 없으면 ★ 일반 단서의 체크 수를 비교해 3개 이상 차이 나는 쪽으로 판정합니다.
  1~2개 차이라면 기능 검사(모듈 D)로 진행하세요.
```

### 10.3 화면 하단 안전 안내문 2종 (cowork_spec §7-3)
```
※ 한 가지 증상의 호전만으로 체질·처방을 확정하지 않습니다 (안준철)
※ 체질과 한열은 항상 전제로 하고 약물 적합성을 확인합니다 (안준철)
```

### 10.4 출처 표시 (푸터)
```
변별 항목 출처: 안준철·하만종·김주 사상의학 강의록
```

### 10.5 인쇄 출력 시
- 안전 안내문 2종 모두 인쇄에 포함
- 판정 결과·체크 항목·환자 정보 모두 1쪽 A4에 들어가도록 `@media print` 스타일

---

## 11. 코드 스켈레톤 (Claude Code가 이 골격을 채우기)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>온누리 한의원 — 정밀 시진 C-1 (태음↔소양)</title>
<style>
:root{
  --taeum:#2D7D46; --taeum-l:#E8F5EC; --taeum-bg:#F4FBF6;
  --soyang:#D4691E; --soyang-l:#FDF1E5; --soyang-bg:#FEF8F2;
  --gold:#C49A3F; --gold-l:#FEF9E6;
  --ink:#1a1a1a; --sub:#555; --line:#d5d5d5;
  --bg:#faf8f3; --serif:'Noto Serif KR',serif; --sans:'Noto Sans KR',sans-serif;
}
/* ... 기본 reset + 레이아웃 + 표 + 체크박스 + 카운터 + 판정 박스 + @media print */
</style>
</head>
<body>
<div id="wrap"></div>

<script>
const C1_ITEMS = { /* §6 데이터 그대로 */ };
const CAT_LABELS = { /* §6 데이터 그대로 */ };

let step = 0;  // 0:info, 1:chart, 2:verdict
let session = JSON.parse(localStorage.getItem('onnuri_session') || '{}');
let checks = { taeum:{}, soyang:{} };   // checked id → true

function loadSession() { /* session에서 patient·moduleA 읽음 */ }
function saveSession() { /* moduleC에 저장 */ }

function computeChecks() {
  // checks 객체를 순회하며 {taeum:{killer,normal,items}, soyang:{...}} 산출
}

function evaluateVerdict(c) {
  /* §7 로직 그대로 */
}

function renderInfo()    { /* 환자 정보 + 모듈 A 결과 + "변별 시작" 버튼 */ }
function renderChart()   { /* 5 카테고리 표 + 카운터 + 판정 박스 */ }
function renderVerdict() { /* 최종 판정 + 다음 모듈 버튼 */ }

function onCheckChange(id, side) {
  if (checks[side][id]) delete checks[side][id];
  else checks[side][id] = true;
  refreshCounter();
}

function refreshCounter() {
  const c = computeChecks();
  // 카운터 DOM 갱신
  // 판정 박스 DOM 갱신 (evaluateVerdict(c) 결과로)
}

function confirmVerdict() {
  const c = computeChecks();
  const v = evaluateVerdict(c);
  session.moduleC = {
    pair:'taeum_soyang',
    checks: c,
    verdict: v.verdict,
    confidence: v.confidence,
    reason: v.reason,
    completedAt: Date.now(),
  };
  saveSession();
  step = 2;
  render();
}

function goToModuleE() { location.href = '온누리_처방추천_E_v1.html'; }
function goToModuleD() { location.href = '온누리_기능검사_D_v1.html'; }
function goToModuleA() { location.href = '온누리_사상체질_감별설문지_v24.html'; }

function render() {
  const screens = [renderInfo, renderChart, renderVerdict];
  document.getElementById('wrap').innerHTML = screens[step]();
  window.scrollTo({top:0,behavior:'smooth'});
}

// 페이지 로드 시
loadSession();
render();
</script>
</body>
</html>
```

---

## 12. 에지 케이스 (반드시 처리)

| 케이스 | 동작 |
|---|---|
| LocalStorage에 `onnuri_session.moduleA` 없음 | screen-info에서 "모듈 A 먼저 진행" 안내 + v24.html 링크. 차트 진입 차단 |
| LocalStorage에 `onnuri_session.patient` 없음 | "환자 정보 없음" 표시, 차트는 진입 허용 (이름 입력 칸 제공) |
| 체크 0개 상태 | 판정 박스 비표시 또는 "항목을 체크하세요" 회색 메시지 |
| 한쪽 ★★ 0개 + ★ 0개 vs 다른 쪽 ★ 1개 (1개 차이) | pending, "차이 부족 — 기능 검사 필요" |
| 양쪽 ★★ 모두 0 + 양쪽 ★ 동수 | pending, "★ 동수 — 기능 검사 필요" |
| 사용자가 화면 새로고침 | session에서 moduleC 있으면 verdict 화면 복원, 없으면 chart 화면 복원 |
| 모듈 E·D HTML이 아직 없을 때 | 버튼 클릭 시 alert("모듈 E는 W3 완료 후 활성화됩니다") + LocalStorage엔 정상 저장 |

---

## 13. 안티패턴 (Claude Code가 피해야 할 것)

- ❌ React·Vue·jQuery·Recharts 등 외부 라이브러리 import — vanilla JS만
- ❌ 항목 텍스트를 HTML에 하드코딩 — `C1_ITEMS` 데이터 객체에서 생성
- ❌ 판정 로직을 UI 코드에 섞기 — `evaluateVerdict()` 순수 함수로 격리
- ❌ LocalStorage 키 임의 사용 — 반드시 `onnuri_session` 단일 키
- ❌ 임상 텍스트 임의 수정 — §6 데이터의 한 글자도 바꾸지 말 것
- ❌ 안전 안내문 생략 — §10의 4개 위치 모두 포함
- ❌ "AI가 진단" 같은 문구 — "참고" "후보" "추천"만 사용
- ❌ 인쇄 시 카운터·판정 박스가 색깔 진하게 — `@media print`에서 회색조 또는 흰 배경

---

## 14. 작업 순서 (10 단계)

Claude Code는 이 순서로 진행:

1. **데이터·로직 먼저** — `C1_ITEMS`, `CAT_LABELS`, `evaluateVerdict()` 함수 작성 + 콘솔에서 5~6 케이스 단위 테스트
2. **HTML 골격** — `<head>` 메타·`<style>` 변수·`<div id="wrap">` + 페이지 로드 진입점
3. **CSS 기반** — `:root` 변수 + 기본 reset + 레이아웃 컨테이너 (max-width:900px, 화면 중앙)
4. **screen-info 구현** — 세션 로드, 환자/모듈 A 요약, "변별 시작" 버튼
5. **screen-chart 구조** — 안전 배너 + 헤더 + 안내 박스 + 비교 표 (CAT 1~5)
6. **카운터·판정 박스 sticky 배치** — 표 하단 또는 sticky bottom
7. **체크박스 이벤트 연결** — `onCheckChange` → `refreshCounter` → DOM 갱신
8. **screen-verdict 구현** — 큰 판정 카드 + 체크 요약 + 다음 모듈 버튼
9. **인쇄 스타일** — `@media print` (sticky 해제·색상 흰 배경·1쪽 안에)
10. **자체 검증** — §15 acceptance criteria 모두 통과 확인

---

## 15. 검증 기준 (Acceptance Criteria)

Claude Code는 구현 완료 후 다음을 모두 체크 후 사용자에게 보고:

### 15.1 기능 검증
- [ ] 페이지 로드 시 빈 화면 안 나옴 (v24 사고 재발 방지)
- [ ] `node --check` 통과
- [ ] LocalStorage `onnuri_session.moduleA`가 있으면 환자명·체질 % 자동 노출
- [ ] LocalStorage `onnuri_session.moduleA`가 없으면 안내 메시지 노출
- [ ] 26개 체크박스 모두 클릭 가능, 클릭 시 카운터 즉시 갱신
- [ ] §7 판정 로직 4가지 케이스 모두 정상 동작:
  - 태음 ★★ 1개 + 소양 ★★ 0개 → "태음 확정"
  - 소양 ★★ 1개 + 태음 ★★ 0개 → "소양 확정"
  - 양쪽 ★★ 1개씩 → "보류 — 양쪽 결정타 충돌"
  - 양쪽 ★★ 0개 + 태음 ★ 5 vs 소양 ★ 2 → "태음 우세 (★ 3개 차이)"
  - 양쪽 ★★ 0개 + 태음 ★ 3 vs 소양 ★ 2 → "보류 — 차이 부족"
- [ ] "판정 확정" 클릭 시 LocalStorage `onnuri_session.moduleC` 정상 저장
- [ ] 새로고침 후 moduleC 있으면 verdict 화면 복원
- [ ] "모든 체크 해제" 버튼 → 확인 후 초기화

### 15.2 임상 안전 검증
- [ ] 안전 배너 모든 screen 상단 노출
- [ ] 안전 안내문 2종 (안준철 원칙) 화면 하단 노출
- [ ] 출처 표시 푸터 노출
- [ ] §6 임상 텍스트 25개 항목 한 글자도 다르지 않음 (직접 비교)

### 15.3 UI·인쇄 검증
- [ ] 노트북 Chrome 1366×768 이상에서 가로 스크롤 없이 표시
- [ ] mockup의 색상·레이아웃과 일관 (★/★★ 표시, 좌우 컬럼 배경 등)
- [ ] `Ctrl+P` 인쇄 미리보기에서 A4 1쪽에 들어감
- [ ] 인쇄 시 카운터·체크 결과·환자 정보 모두 포함

---

## 16. 완료 후 Claude Code의 보고 형식

작업 끝나면 사용자에게 다음 형식으로 보고:

```
✓ 모듈 C-1 구현 완료
파일: C:\Users\ADmiN\Downloads\onnuri-site\온누리_정밀시진_C1_v1.html
라인 수: NNNN
검증:
  - 기능 9/9 통과
  - 임상 안전 4/4 통과
  - UI·인쇄 4/4 통과

테스트 시나리오:
  1. v24.html에서 자가설문 완료 → onnuri_session.moduleA 저장됨
  2. 정밀시진 C1 HTML 열기 → 환자명·체질 % 자동 로드 확인
  3. 태음 ★★ 1개 체크 → "태음 확정" 메시지 즉시 노출
  4. 판정 확정 → onnuri_session.moduleC 저장
  5. 인쇄 미리보기 → A4 1쪽 정상

다음 액션: W2 모듈 D 작업서 작성 또는 W1 결과물 임상 시험
```

---

## 부록 A. v24.html에서 가져올 패턴

- `:root` CSS 변수 형식 (--ty, --te, --sy, --se → 본 문서는 --taeum, --soyang)
- Noto Serif KR + Noto Sans KR 폰트 로드 (`<link>`)
- `.screen{display:none}` + `.screen.active{display:block}` 패턴 (이 작업은 step 인덱스로 대체 가능)
- LocalStorage 사용 패턴 (try/catch 없이 직접 사용 → v24와 동일하게 단순화)
- 결과지 인쇄 시 화면 액션 버튼 숨김 (`.no-print{display:none}`)
- A4 인쇄용 폰트 크기 축소·여백 최소화

## 부록 B. 본 작업 외 절대 하지 말 것

- 모듈 B(의사결정나무) 코드 생성 — Phase 1에서 제외됨
- 모듈 D·E 본 구현 — W2·W3 작업서에서 별도 진행
- 처방 데이터베이스 구축 — W3에서 진행
- 다른 페어(C-2 ~ C-6) 차트 생성 — Phase 2

---

**문서 끝**. Claude Code: §3 참조 자료 정독 후 §14 작업 순서대로 진행. 의문점은 작업 전에 사용자에게 한 번에 정리해 질문.
