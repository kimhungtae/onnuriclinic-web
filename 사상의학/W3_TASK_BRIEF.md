# W3 작업서 — 모듈 E (처방 추천) 구현

> **이 문서의 정체**: Claude Code 단일 세션(또는 2세션)에 던지면 모듈 E를 MVP 완성도로 구현 가능한 친절판 작업서.
> W1·W2 작업서와 동일한 16절 구조. 모듈 E는 **처방 데이터 ETL**이 들어가 W1·W2보다 크다 — §14에서 Phase A(데이터)·Phase B(HTML)로 나눈다.
>
> **버전**: v1.0 · **작성일**: 2026-05-21 · **목표 완료**: W3 (5~7일)
>
> **중요 — 정직성 고지**: cowork_spec §2.3은 처방마다 한열·음양형·주증·주의·부적합시그널·가감 메타데이터를 요구하나, 류주열 XLSX에는 **체질·처방명·구성(약재)만** 있다. 나머지 메타데이터는 구조화된 출처가 없다. 따라서 본 작업서는 **352개 전체에 한열 태그를 지어내지 않고**, §6·§부록B의 MVP 범위(검증된 핵심 처방 큐레이션 + 전체 352는 검색용 참조 목록)로 설계한다. 임상 메타데이터는 **안준철 원장 검수 필수**.

---

## 1. 미션 한 줄

**기능 검사(모듈 D)에서 체질·한열·음양형이 확정된 환자에게, 주소증을 입력받아 매칭된 추천 처방 3순위를 근거·주의·부적합 시그널·가감과 함께 제시하고 원장이 최종 처방을 결정·기록하는 단일 HTML 페이지를 만든다.**

---

## 2. 산출물 (반드시 이대로)

### 2.1 결과 파일
- **메인**: `온누리_처방추천_E_v1.html` — 단일 HTML (CSS·JS 인라인, 처방 데이터 인라인 임베드, 외부 라이브러리 0개)
- **데이터 산출물** (ETL 결과, `C:\Users\ADmiN\Downloads\onnuri-site\data\`):
  - `data/prescriptions_full.json` — 류주열 XLSX 4시트 전체 처방 (체질·코드·처방명·구성)
  - `data/prescriptions_curated.json` — 매칭 엔진이 쓰는 큐레이션 처방 세트 (메타데이터 완비, 원장 검수 대상)
  - `data/symptom_chips.json` — 체질·한열별 주소증 칩 (cowork_spec §2.3)
  - `data/data-sources.md` — 어느 자료 어디서 추출했는지 추적
- **저장 위치**: 메인 HTML은 onnuri-site 루트, 데이터는 `onnuri-site\data\`

### 2.2 산출물 점검 (Claude Code가 자체 확인)
- [ ] HTML이 `<!DOCTYPE html>`로 시작, `</html>`로 끝남
- [ ] `<script>` 추출해 `node --check` 통과 / 모든 `data/*.json`이 `JSON.parse` 통과
- [ ] 브라우저에서 열면 첫 화면 정상 노출 (빈 화면 X)
- [ ] file:// 로 열어도 동작 (처방 데이터는 fetch가 아니라 HTML 내 인라인 임베드 — §4 참조)
- [ ] 주소증 칩 클릭·자유기재 시 추천 처방·매칭도 실시간 반응

---

## 3. 참조 자료 (읽는 순서)

| 순서 | 파일 | 무엇을 가져올지 |
|---|---|---|
| 1 | `사상의학\chat-package\cowork_spec.md` §2.3, §7 | E-1~E-6 명세, 매칭 가중치, 처방 DB 구조, 안전 가드 |
| 2 | `사상의학\chat-package\mockup_rx_recommendation.html` | **UI 청사진** — 환자카드·주소증칩·처방카드·최종결정란 |
| 3 | `온누리_정밀시진_C1_v1.html`, `온누리_기능검사_D_v1.html` | **코딩 스타일 모델** — `:root`·`step`+`render()` 3-screen·`onnuri_session`·`@media print`·안전가드 |
| 4 | `사상의학\PHASE1A_PLAN.md` §1.1·§4·W3 항목 | LocalStorage 키, ETL 계획, W3 검증 기준 |
| 5 | `사상의학\류주열사상처방개정판.xlsx` | 처방 ETL 원본 (4시트: 태양인·태음인·소양인·소음인) |
| 6 | `사상의학\태음인 처방해설.hwp`, `체질처방약물.hwp` 등 | 큐레이션 처방 메타데이터 보강 (원장 검수와 병행) |

---

## 4. 아키텍처 결정 사항 (이의 없음)

- **단일 HTML** — CSS·JS·**처방 데이터 모두 인라인 임베드**. 외부 라이브러리 0개.
- **처방 데이터는 fetch 안 함** — Phase 1a는 file:// 로 열리므로 `fetch('data/*.json')`이 CORS로 차단됨. ETL이 만든 JSON을 **HTML 내 `<script>` const 로 인라인 임베드**한다. `data/*.json` 파일은 별도 산출물(검수·Phase 1b·재생성용)로 함께 보관.
- **데이터 저장** — `localStorage.onnuri_session` 단일 키 (C-1·D와 공유)
- **렌더 방식** — C-1·D와 동일한 `let step`+`render()`+`screens[step]()` 3-screen 패턴
- **매칭 엔진은 큐레이션 세트 대상** — 메타데이터가 완비된 검증 처방만 점수화·랭킹. 전체 352는 검색 참조용.
- **대상 환경** — 노트북 Chrome 최신, A4 인쇄 호환

---

## 5. 화면 구조 (3 screen)

```
screen-info       환자 요약 카드 자동 로드 (모듈 D 확정 체질·한열·음양형·감별근거)
                  ↓ "처방 추천 시작" 버튼
screen-recommend  주소증 입력 (체질·한열 자동필터 칩 + 자유기재)
                  + 추천 처방 3순위 카드 (매칭도·근거·주의·부적합시그널·가감·출처)
                  ↓ 처방 카드의 "이 처방으로 선택"
screen-final      최종 처방 결정 (선택 처방·기간·재진 시점·메모)
                  ↓ "처방 확정"
                    [처방 확정·차트 저장 → onnuri_session.moduleE]
                    [결과 인쇄] · [추천으로 돌아가기]
```

---

## 6. 데이터

### 6.1 처방 DB 구조 (cowork_spec §2.3 기준)
```javascript
// data/prescriptions_curated.json 의 각 항목 — 매칭 엔진이 쓰는 완비형
{
  id:'taeum_jowi',
  name:'태음조위탕', hanja:'太陰調胃湯',
  constitution:'taeum',          // 'taeum'|'soyang'|'taeyang'|'soeum'
  hanyul:'cold',                 // 'cold'|'hot'|'any'
  yangyin:'yang',                // 'yang'|'yin'|'any' (태음만 의미)
  symptoms:['만성비염','식적','변비경향','기침가래','감기후회복'],  // 주증 — 주소증 칩과 매칭
  basis:'태음인 한증 위완수한증·중기 회복의 핵심 처방. 비병·식적·한습곤비에 적합.',
  caution:'마황 함유 → 음허·심계·불면자 부적합.',
  unfitSignal:'복용 후 불면·심계·구갈·피부건조 → 음형 재평가, 음형 처방으로 전환.',
  alternatives:['갈근조위탕'],
  gamga:['+갈근 2돈·승마 1돈 (비병·표열 겸함)','+산약·연자육 각 2돈 (보비·보신, 변비)'],
  source:'안준철 강의록 · 사상임상의학회'
}
```

### 6.2 큐레이션 처방 시드 (검증된 출처만 — 확장 시 원장 검수)
> 아래는 cowork_spec §2.2·§2.3 + mockup_rx_recommendation 에서 **출처가 확인되는 처방**이다.
> 이 시드로 시작하고, 안준철 강의록·사상임상의학회 자료에서 처방을 추가할 때마다 **원장 검수**를 받는다.
> **메타데이터를 추측으로 채우지 말 것** — 불명 필드는 `null` 또는 `'원장확인'`로 두고 §부록B대로 처리.

| id | 처방명 | 체질 | 한열 | 음양형 | 출처 |
|---|---|---|---|---|---|
| taeum_jowi | 태음조위탕 | 태음 | 한 | 양 | 안준철 강의록·사상임상의학회 (cowork_spec §2.2·2.3) |
| galgeun_jowi | 갈근조위탕 | 태음 | 열 | any | cowork_spec §2.2 |
| mahwang_uiin | 마황의이인탕 | 태음 | 한 | any | 사상임상의학회 (mockup) |
| jowi_seungcheong | 조위승청탕 | 태음 | 한 | any | 안준철 임상례 (mockup) |
| hyeongbang_jihwang | 형방지황탕 | 소양 | 한 | any | cowork_spec §2.2 |
| hyeongbang_paedok | 형방패독산 | 소양 | 한 | any | cowork_spec §2.2 |
| jihwang_baekho | 지황백호탕 | 소양 | 열 | any | cowork_spec §2.2 |
| yanggyeok_sanhwa | 양격산화탕 | 소양 | 열 | any | cowork_spec §2.2 |

`태음조위탕`의 전체 메타데이터는 cowork_spec §2.3 예시 + mockup 1순위 카드에서 §6.1 구조로 완성 가능. 나머지는 한열·체질만 확정, 주증·주의·가감은 자료 추출 + 원장 검수.

### 6.3 전체 처방 참조 목록 (ETL — 류주열 XLSX)
- 류주열사상처방개정판.xlsx 4시트(태양인·태음인·소양인·소음인) → `prescriptions_full.json`
- 각 처방: `{ code, constitution, name, composition }` (XLSX에서 신뢰 추출 가능한 필드만)
- 한열·주증 등은 XLSX에 없음 → full 목록은 **검색·참조용**이며 매칭 점수화에는 쓰지 않음
- ETL은 xlsx 파싱 도구(예: 파이썬 openpyxl 또는 SheetJS) 사용. 처방명 정규화 실패분은 별표 표시 후 운영 중 보정.

### 6.4 주소증 칩 (cowork_spec §2.3 — 그대로 전사)
```javascript
const SYMPTOM_CHIPS = {
  taeum: {
    cold:['만성 비염','식적·더부룩','변비 경향','기침 가래','피로·보약','감기 후 회복','관절통·부종','사경증·두통','코피','땀 많음'],
    hot: ['안면홍조','두통','불면','가슴 답답','변비','다한증','공황장애'],
  },
  soyang: {
    cold:['상복부 가스','우울','두통','이명','한기','간기울결 증상'],
    hot: ['갈증','위완 건조','소갈','다음(多飮)','흉번조','안충혈'],
  },
  soeum: {
    any:['소화불량','무기력','설사','대변 묽음','한기'],
  },
  taeyang: { any:[] },  // 자료 부족 — 자유기재로
};
```

---

## 7. 매칭 로직 (E-3 엔진 — cowork_spec §2.3 가중치)

```javascript
// 큐레이션 처방 세트 대상. 체질·한열은 필수 필터, 음양형·주소증은 점수 가산.
function matchPrescriptions(profile, chiefComplaints, rxList) {
  // profile: { constitution, hanyul, yangyin }  ← onnuri_session.moduleD
  // chiefComplaints: 선택/입력된 주소증 문자열 배열
  return rxList
    .filter(function(rx){
      if (rx.constitution !== profile.constitution) return false;        // 체질 필수
      if (rx.hanyul !== 'any' && rx.hanyul !== profile.hanyul) return false; // 한열 필수
      return true;
    })
    .map(function(rx){
      let score = 40 + 25;                                  // 체질 40 + 한열 25 (필터 통과 = 만점)
      if (profile.constitution === 'taeum') {               // 음양형 15 (태음만)
        if (rx.yangyin === 'any' || rx.yangyin === profile.yangyin) score += 15;
      } else { score += 15; }                               // 비태음은 음양형 무관 → 만점 처리
      // 주소증 부합도 20 — 처방 주증 ∩ 입력 주소증
      const hit = chiefComplaints.filter(function(c){
        return rx.symptoms && rx.symptoms.indexOf(c) >= 0;
      }).length;
      const ratio = chiefComplaints.length ? hit / chiefComplaints.length : 0;
      score += Math.round(20 * ratio);
      return { rx:rx, score:score, hitCount:hit };
    })
    .sort(function(a,b){ return b.score - a.score; })
    .slice(0, 3);                                           // 3순위까지
}
```
- 매칭도 % = `score` (0~100). mockup의 92%는 65 + 15(음양형) + 20×0.6(주소증 3개 중 2개 적중)에 해당.
- 후보가 0개면 "체질·한열에 맞는 큐레이션 처방 없음 — 전체 목록 검색 또는 원장 직접 입력" 안내.
- **자동 처방 아님**: 매칭은 후보 정렬일 뿐, 최종 결정은 원장 (§10).

---

## 8. LocalStorage 데이터 계약

### 8.1 읽기 (페이지 로드 시)
```javascript
const session = JSON.parse(localStorage.getItem('onnuri_session') || '{}');
// session.patient, session.moduleD = { finalConstitution, finalHanyul, finalYangYin, ... }
// session.moduleD.drugTrial 등 감별 근거 표시에 활용
```
**moduleD가 없으면**: screen-info에 "기능 검사(모듈 D)를 먼저 완료해주세요" 안내 + 모듈 D 링크. 단 원장 재량 진입은 허용하고, 그 경우 체질·한열을 화면에서 직접 선택하게 한다(폴백).

### 8.2 쓰기 (처방 확정 시)
```javascript
session.moduleE = {
  chiefComplaints: ['만성 비염','식적·더부룩','변비 경향'],
  freeText: '45세 남, 환절기 비염 악화...',
  candidates: [ {id, name, score}, ... ],   // 추천 3순위 스냅샷
  selected: {
    prescription: '태음조위탕 + 갈근 2돈·승마 1돈',
    period: '반제(15일)',
    revisit: 'D+7, D+15',
    note: '처방 의도 메모...',
  },
  completedAt: Date.now(),
};
localStorage.setItem('onnuri_session', JSON.stringify(session));
```

### 8.3 다음 단계
- "결과 인쇄" → `window.print()`
- "추천으로 돌아가기" → screen-recommend
- 재진 추적(E-6)은 Phase 2 — 본 작업 범위 밖 (§부록B)

---

## 9. UI 구체 명세 (mockup_rx_recommendation 기준)

### 9.1 screen-info — 환자 요약 카드
- mockup `.patient-card` — 확정 체질(큰 글씨)·한열 칩·음양형 칩·감별 근거(모듈 D `drugTrial` 요약)
- "처방 추천 시작" 버튼
- moduleD 없을 때: 안내 + 모듈 D 링크 + 체질·한열·음양형 수동 선택 폴백

### 9.2 screen-recommend — 주소증 입력 + 추천
- **E-2 주소증 입력**: `SYMPTOM_CHIPS[체질][한열]` 칩 노출, 클릭 토글(최대 3개 권장 — 초과 시 경고만, 차단 안 함), 자유기재 textarea
- 칩 클릭·자유기재 변경 시 추천 카드 실시간 재계산
- **E-4 추천 처방 카드 3순위**: mockup `.rx-card` — 순위 뱃지, 처방명+한자, 매칭도 바+%, 추천근거/주의(빨강)/부적합시그널(파랑) 섹션, 본 케이스 가감 박스, 출처. 1순위는 강조 테두리.
- 각 카드 "이 처방으로 선택" → screen-final 로 해당 처방 전달
- 후보 0개 시 §7 안내 + 전체 목록 검색 UI(처방명 텍스트 검색 → `prescriptions_full`)

### 9.3 screen-final — 최종 처방 결정
- mockup `.final-rx` — 선택 처방(편집 가능 입력란: 가감 포함 자유 수정), 처방 기간/재진 시점, 처방 의도 메모
- "처방 확정·차트 저장"(→ moduleE 저장) · "결과 인쇄" · "추천으로 돌아가기"

---

## 10. 의료 안전 가드 (반드시 포함)

- **안전 배너** (모든 screen 상단): "본 도구는 임상 의사결정 지원 도구이며 의료기기가 아닙니다. 최종 진단·처방은 원장님이 환자를 직접 확인하고 결정합니다."
- **"추천 처방" 표기** — 자동 처방 도구로 오인 금지. "추천"·"후보"·"매칭"만 사용.
- **처방 카드 필수 표기**: 주의·부적합 시그널·출처를 모든 카드에. 출처 누락 처방은 표시 금지(또는 "출처 미확인" 명시).
- **안내문 2종** (화면 하단, cowork_spec §7-3):
  - `※ 한 가지 증상의 호전만으로 체질·처방을 확정하지 않습니다 (안준철)`
  - `※ 체질과 한열은 항상 전제로 하고 약물 적합성을 확인합니다 (안준철)`
- **부적합 시그널 안내**: caveat 박스 — "불면·심계·구갈·피부건조·설사·무기력 발생 시 즉시 재평가".
- **출처 표시 푸터**: "처방 데이터 출처: 류주열 사상처방개정판 · 안준철 강의록 · 사상임상의학회".

---

## 11. 코드 스켈레톤 (C-1·D 골격 준용)

```html
<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>온누리 한의원 — 처방 추천 E</title>
<style>/* :root 변수 C-1/D 준용 + 처방카드/칩 스타일 */</style>
</head><body>
<div id="wrap" class="wrap"></div>
<script>
const RX_CURATED = [ /* §6.1·6.2 — ETL+검수 결과 인라인 임베드 */ ];
const RX_FULL    = [ /* 류주열 XLSX ETL 결과 인라인 임베드 (검색용) */ ];
const SYMPTOM_CHIPS = { /* §6.4 그대로 */ };

let step = 0;            // 0:info, 1:recommend, 2:final
let session = JSON.parse(localStorage.getItem('onnuri_session') || '{}');
let profile = null;      // {constitution,hanyul,yangyin} — moduleD에서 로드
let chiefComplaints = [];
let freeText = '';
let selectedRx = null;   // {prescription,period,revisit,note}

function loadSession(){ /* moduleD→profile, moduleE 있으면 복원 */ }
function saveSession(){ /* moduleE 저장 */ }
function matchPrescriptions(profile, chiefComplaints, rxList){ /* §7 */ }

function renderInfo(){}      // 환자 요약 + 시작
function renderRecommend(){} // 주소증 칩 + 자유기재 + 추천 3카드
function renderFinal(){}     // 최종 결정란

function onChipToggle(sym){} function onFreeText(v){}
function refreshRecommend(){}            // 추천 카드만 재계산·갱신
function selectRx(id){}                  // → screen-final
function confirmRx(){ /* moduleE 저장 */ }
function printResult(){ window.print(); }
function goToModuleD(){ location.href='온누리_기능검사_D_v1.html'; }

function render(){ const s=[renderInfo,renderRecommend,renderFinal];
  document.getElementById('wrap').innerHTML=s[step](); window.scrollTo({top:0,behavior:'smooth'}); }
loadSession(); render();
</script></body></html>
```

---

## 12. 에지 케이스 (반드시 처리)

| 케이스 | 동작 |
|---|---|
| `onnuri_session.moduleD` 없음 | 안내 + 모듈 D 링크 + 체질·한열·음양형 수동 선택 폴백 |
| 매칭 후보 0개 | "맞는 큐레이션 처방 없음" 안내 + 전체 목록(`RX_FULL`) 처방명 검색 |
| 주소증 0개 선택 | 추천은 체질·한열 기준으로만(주소증 점수 0). "주소증 입력 시 정확도 향상" 안내 |
| 주소증 4개 이상 | 경고 문구만, 차단하지 않음 (cowork_spec "최대 3개 권장") |
| 처방 메타데이터 불완전(주증·가감 null) | 해당 섹션 "원장 확인 필요"로 표시, 카드 자체는 노출 |
| 새로고침 | moduleE 있으면 final 화면 복원, 없으면 info |
| 큐레이션 처방 텍스트에 따옴표/특수문자 | `esc()`로 이스케이프 |

---

## 13. 안티패턴 (피해야 할 것)

- ❌ 외부 라이브러리(React·jQuery·차트 라이브러리)
- ❌ `fetch('data/*.json')` — file:// 에서 안 됨. 데이터는 HTML 인라인 임베드
- ❌ **352개 처방에 한열·주증을 추측으로 태깅** — 검증된 큐레이션만 점수화 (§부록B)
- ❌ 매칭 결과를 "처방 결정"이라 표현 — "추천"·"후보"
- ❌ 출처 없는 처방·가감 노출 — 출처 필수 또는 "미확인" 명시
- ❌ 임상 텍스트(처방명·구성·가감) 임의 변경 — 자료 그대로
- ❌ LocalStorage 키 임의 사용 — `onnuri_session` 단일 키
- ❌ 안전 안내문·부적합 시그널 생략
- ❌ v24·C-1·D 등 기존 파일 수정

---

## 14. 작업 순서

### Phase A — 데이터 ETL (1~2일, 먼저)
1. **류주열 XLSX 파싱** — 4시트 → `prescriptions_full.json` (`{code,constitution,name,composition}`). 행 수·처방명 정규화 검증.
2. **큐레이션 시드 작성** — §6.2 표의 8개 처방을 §6.1 구조로. cowork_spec §2.2·§2.3·mockup에서 확인되는 필드만 채우고 불명은 `null`.
3. **큐레이션 메타데이터 보강** — 안준철 강의록·`태음인 처방해설.hwp` 등에서 주증·주의·가감 추출. 추출 출처를 `data-sources.md`에 기록. **추측 금지** — 불명은 `null` 유지.
4. **`symptom_chips.json`** — §6.4 그대로.
5. **원장 검수 체크포인트** — 큐레이션 처방 메타데이터를 원장에게 제시·확인받은 뒤 Phase B 진행.

### Phase B — HTML 구현 (3~4일)
6. **HTML 골격 + CSS** — C-1·D 골격 복제, 처방카드·칩 스타일 추가, 데이터 인라인 임베드
7. **screen-info** — 환자 요약 카드 + moduleD 폴백
8. **screen-recommend** — 주소증 칩·자유기재 + `matchPrescriptions` + 처방 카드 3순위
9. **screen-final** — 최종 결정란 + moduleE 저장
10. **추천 실시간 갱신** — 칩/자유기재 이벤트 → `refreshRecommend`
11. **후보 0개·전체검색 폴백** — `RX_FULL` 처방명 검색
12. **인쇄 스타일 + 안전 가드 배치**
13. **자체 검증** — §15 acceptance criteria 전부

---

## 15. 검증 기준 (Acceptance Criteria)

### 15.1 데이터 검증 (5)
- [ ] `prescriptions_full.json` JSON.parse 통과, 처방 수가 류주열 XLSX와 일치(±정규화 실패분 명시)
- [ ] `prescriptions_curated.json` 각 항목이 §6.1 필드 구조 준수
- [ ] 큐레이션 처방의 체질·한열이 출처(cowork_spec 등)와 일치
- [ ] 추측으로 채운 메타데이터 0건 — 불명은 `null` 또는 `'원장확인'`
- [ ] `data-sources.md`에 처방별 추출 출처 기록

### 15.2 기능 검증 (8)
- [ ] 첫 화면 빈 화면 안 나옴 / `node --check` 통과 / file:// 에서 동작
- [ ] moduleD 있으면 체질·한열·음양형·감별근거 자동 로드, 없으면 안내+폴백
- [ ] 주소증 칩이 체질·한열에 맞게 필터되어 노출
- [ ] 칩 선택·자유기재 시 추천 처방·매칭도 실시간 갱신
- [ ] 매칭 가중치 §7대로 동작 (체질·한열 필터 + 음양형 15 + 주소증 20)
- [ ] **검증 케이스**: 태음인·한증·양형 + 주소증 "만성 비염·식적·더부룩" → 1순위 태음조위탕, 매칭도 90%대
- [ ] "이 처방으로 선택" → screen-final, "처방 확정" → `onnuri_session.moduleE` 저장
- [ ] 새로고침 후 moduleE 있으면 final 복원

### 15.3 임상 안전 검증 (5)
- [ ] 안전 배너 모든 screen 상단
- [ ] 안내문 2종 + 부적합 시그널 caveat 노출
- [ ] 모든 처방 카드에 주의·부적합 시그널·출처 표기 (없으면 "미확인" 명시)
- [ ] "추천"·"후보" 표기만 사용, "자동 처방/진단" 문구 없음
- [ ] 출처 푸터 노출

### 15.4 UI·인쇄 검증 (3)
- [ ] 노트북 Chrome 1366×768 이상 가로 스크롤 없음
- [ ] mockup의 처방 카드·칩·매칭 바 색·레이아웃과 일관
- [ ] `Ctrl+P` 인쇄 시 선택 처방·근거·환자 정보 포함, 색 회색조

---

## 16. 완료 후 Claude Code의 보고 형식

```
✓ 모듈 E 구현 완료
파일: 온누리_처방추천_E_v1.html  (+ data/ 4개 파일)
라인 수: NNNN  /  처방 DB: full NNN개 · 큐레이션 NN개
검증:
  - 데이터 5/5 · 기능 8/8 · 임상 안전 5/5 · UI·인쇄 3/3 통과
테스트 시나리오:
  1. 모듈 D에서 태음·한증·양형 확정 → onnuri_session.moduleD 저장
  2. 처방추천 E 열기 → 환자 요약 자동 로드
  3. 주소증 "만성 비염·식적" 선택 → 1순위 태음조위탕 (매칭도 9N%)
  4. "이 처방으로 선택" → 최종 결정 → onnuri_session.moduleE 저장
  5. 인쇄 미리보기 → 처방·근거·환자 정보 포함
원장 검수 필요: 큐레이션 처방 메타데이터(주증·주의·가감) NN건
다음 액션: W4 — 4모듈 데이터 연결 + 홈 화면
```

---

## 부록 A. C-1·D에서 그대로 가져올 패턴
- `:root` 변수·Noto 폰트·`esc()`·`let step`+`render()` 3-screen·`loadSession/saveSession`
- `banner()`/`footer()` 안전 가드 조각, `@media print`(`.no-print`·sticky 해제·회색조)
- 새로고침 시 결과 있으면 마지막 화면 복원

## 부록 B. 본 작업 외 / MVP 범위 / 원장 검수
- **MVP 범위**: 매칭 엔진은 큐레이션 처방(검증된 메타데이터)만 점수화. 전체 352는 검색 참조용. 큐레이션은 8개 시드로 시작해 원장 검수와 함께 확장.
- **추측 금지**: 한열·음양형·주증·가감을 자료 없이 채우지 말 것. 불명은 `null`. 이는 [[시각-자료는-정직하게]] 원칙(임상 정확성 우선)과 동일.
- **본 작업 제외**: E-6 재진 추적(D+7·D+15 자동 체크) — Phase 2. E-3 매칭 고도화 — Phase 2. 처방 구성(약재) 용량 계산기 — 범위 밖.
- **원장 검수 필수 항목**: 큐레이션 처방의 한열·음양형·주증 태그, 부적합 시그널, 가감례. 검수 전에는 "검수 전" 워터마크/표시 권장.
- **데이터 권리**: 류주열·안준철·하만종·권재식 자료는 원내 한정 사용. 공개 전 협의 필요(PHASE1A §7).

---

**문서 끝**. Claude Code: §3 정독 후 §14 Phase A→B 순서로 진행. Phase A 끝(큐레이션 메타데이터)에서 **원장 검수 체크포인트**를 반드시 거칠 것. 의문점은 작업 전에 사용자에게 한 번에 질문.
**작성**: Claude Code (W1·W2 작업서 형식 준용) · **임상 감수 필수**: 안준철 원장 — §6 큐레이션 처방 메타데이터 전체.
