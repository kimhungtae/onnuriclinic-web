# W2 작업서 — 모듈 D (기능 검사: 맥진·복진·반응·약물시험) 구현

> **이 문서의 정체**: Claude Code 단일 세션에 던지면 모듈 D를 90~95% 완성도로 구현 가능한 친절판 작업서.
> W1 작업서(`W1_TASK_BRIEF.md`)와 동일한 16절 구조. 임상 로직·항목 텍스트·안전 문구·코드 스켈레톤·검증 기준을 모두 박아 추측 영역을 최소화.
>
> **버전**: v1.0 · **작성일**: 2026-05-20 · **목표 완료**: W2 (4~5일)
>
> **임상 내용 출처**: `mockup_function_test.html` + `cowork_spec.md §2.2` + 안준철 4대 기준. 본 작업서의 임상 텍스트는 모두 위 자료에서 **그대로 전사**한 것이며, 새로 만든 임상 판단은 없다. **§7.3 종합 판정은 의도적으로 자동화하지 않고 원장 수기 선택으로 둔다**(이유는 §7.3 참조). 임상 감수: 안준철 원장.

---

## 1. 미션 한 줄

**정밀 시진(모듈 C-1)에서 "보류" 판정이 난 환자를 위해, 맥진·복진·반응 확인·약물 시험의 4개 기능 검사 소견을 입력받아 체질·한열·음양형 3축을 원장이 확정하도록 보조하는 단일 HTML 페이지를 만든다.**

---

## 2. 산출물 (반드시 이대로)

### 2.1 결과 파일
- **파일명**: `온누리_기능검사_D_v1.html`
- **저장 위치**: `C:\Users\ADmiN\Downloads\onnuri-site\` (v24.html·C1.html과 같은 폴더)
- **형식**: 단일 HTML 파일 (CSS·JS 인라인, 외부 라이브러리 0개)

### 2.2 산출물 점검 (Claude Code가 자체 확인)
- [ ] 파일이 `<!DOCTYPE html>`로 시작하고 `</html>`로 끝남
- [ ] `<script>` 내용을 추출해 Node `node --check`에 통과
- [ ] 브라우저에서 열면 첫 화면이 정상 노출 (빈 화면 X)
- [ ] 모든 체크박스·라디오 클릭 시 시사 방향 집계·약물시험 적합 카운터가 실시간 반응

---

## 3. 참조 자료 (읽는 순서)

| 순서 | 파일 | 어디서 무엇을 가져올지 |
|---|---|---|
| 1 | `사상의학\chat-package\cowork_spec.md` §2.2 | 4섹션 구조, 진입 조건, 4대 적합성 기준, 테스트 처방표 |
| 2 | `사상의학\chat-package\mockup_function_test.html` | **UI 청사진** — 섹션·검사 그리드·약물시험 박스·종합 판정 zone. 본 작업서 §6 데이터가 mockup과 1:1 일치 |
| 3 | `온누리_정밀시진_C1_v1.html` | **코딩 스타일 모델 (1순위)** — `:root` 변수, `step`+`render()` 3-screen 패턴, `onnuri_session` LocalStorage 계약, `@media print`, 안전 가드 배치. D는 C-1과 완전히 동일한 골격을 쓴다 |
| 4 | `온누리_사상체질_감별설문지_v24.html` | 코딩 스타일 보조 — 폰트 로드, esc() 헬퍼 |
| 5 | `사상의학\PHASE1A_PLAN.md` §1.1, W2 항목 | LocalStorage `moduleD` 키 구조, W2 검증 기준 |

---

## 4. 아키텍처 결정 사항 (이의 없음)

- **단일 HTML** — CSS·JS 모두 인라인. C-1과 동일 골격
- **외부 라이브러리 0개** — vanilla JS만. Recharts·D3·jQuery 금지
- **데이터 저장** — `localStorage.onnuri_session` 단일 키에 JSON 누적 (C-1과 공유)
- **렌더 방식** — C-1과 동일한 `let step` + `render()` + `screens[step]()` 패턴
- **대상 환경** — 노트북 Chrome 최신 (1366×768 이상)
- **인쇄 호환** — A4로 출력되도록 `@media print` 스타일 (섹션이 길어 1쪽 초과 허용, 단 페이지 나눔 깔끔하게)
- **종합 판정은 원장 수기 선택** — 도구는 시사 방향을 집계해 보조 표시만 한다 (§7.3)

---

## 5. 화면 구조 (3 screen)

```
screen-info       세션 시작 · 환자 정보 + 모듈 A·C 결과 요약 (LocalStorage 자동 로드)
                  ↓ "기능 검사 시작" 버튼
screen-test       섹션 1 맥진 · 2 복진 · 3 반응 확인 · 4 약물 시험
                  실시간: 시사 방향 집계 패널 + 약물시험 적합 카운터
                  ↓ "종합 판정 →" 버튼
screen-verdict    종합 판정 — 체질·한열·음양형 3축 원장 선택
                  + 시사 방향/약물시험 요약 + 처방 의도 메모
                  ↓ "판정 확정" 버튼
                    [적합 + 체질 확정 → 모듈 E로]
                    [부적합 또는 "재시험 필요" → 모듈 C로]
                    [결과 인쇄] · [검사로 돌아가기]
```

---

## 6. 데이터 — 검사 항목 (mockup 추출)

> **반드시** 다음 데이터 객체를 그대로 코드에 박을 것. 임상 텍스트는 한 글자도 바꾸지 말 것.
> `tags` 는 그 소견이 시사하는 방향(시사 방향 집계용). 빈 배열이면 집계에 기여하지 않음(기록만).

```javascript
/* 섹션 1·2·3 — 체크 소견. 각 항목은 독립 체크박스 */
const D_FINDINGS = {
  // 섹션 1 — 맥진 (脈診)  · 열 머리: 소견 1 / 소견 2
  pulse: [
    { id:'p1', cat:'기본맥 강도', sub:'전체 강약', col:1,
      text:'처음부터 끝까지 눌러도 힘이 있다 (長而緊)', tags:['taeum'] },
    { id:'p2', cat:'기본맥 강도', sub:'전체 강약', col:2,
      text:'미세불현 — 무력하고 실같이 가는 맥', tags:['soyang'] },
    { id:'p3', cat:'관맥 부위별', sub:'촌맥 vs 척맥', col:1,
      text:'촌맥(寸)이 더 강하게 잡힘', tags:['yang'] },
    { id:'p4', cat:'관맥 부위별', sub:'촌맥 vs 척맥', col:2,
      text:'척맥(尺)이 더 강하게 잡힘 → 음허 경향', tags:['yin'] },
    { id:'p5', cat:'맥의 한열', sub:'참고 지표', col:1,
      text:'침지(沈遲) 경향', tags:['cold'] },
    { id:'p6', cat:'맥의 한열', sub:'참고 지표', col:2,
      text:'부삭(浮數) 경향', tags:['hot'] },
  ],
  // 섹션 2 — 복진 (腹診)  · 열 머리: 소견 1 / 소견 2
  palpation: [
    { id:'a1', cat:'상복부 가스', sub:'과식 후 헛배', col:1,
      text:'과식 시 윗배에 가스 잘 차고 헛배부름', tags:['soyang','cold'] },
    { id:'a2', cat:'상복부 가스', sub:'과식 후 헛배', col:2,
      text:'과식해도 가스 적고 윗배 편안', tags:['soyang','hot'] },
    { id:'a3', cat:'복부 압통', sub:'중완·심하 부위', col:1,
      text:'심하부 두툼·압통 적음, 복근 두꺼움', tags:['taeum'] },
    { id:'a4', cat:'복부 압통', sub:'중완·심하 부위', col:2,
      text:'심하부·중완 압통, 복근 얇음', tags:['soyang'] },
    { id:'a5', cat:'대변 빈도', sub:'소증의 한열 기준', col:1,
      text:'하루 1회 이상 매일 봄', tags:['cold'] },
    { id:'a6', cat:'대변 빈도', sub:'소증의 한열 기준', col:2,
      text:'1~2일에 한 번, 변비 경향', tags:['hot'] },
  ],
  // 섹션 3 — 반응 확인 (反應 確認)  · 열 머리: 태음 시사 / 소양 시사
  reaction: [
    { id:'r1', cat:'커피 반응', sub:'불면·심계 여부', col:1,
      text:'잘 잠 (위완수한증)', tags:['taeum','yang'] },
    { id:'r2', cat:'커피 반응', sub:'불면·심계 여부', col:1,
      text:'불면 (간수열증)', tags:['taeum','yin'] },
    { id:'r3', cat:'커피 반응', sub:'불면·심계 여부', col:2,
      text:'심계·정충, 속쓰림', tags:['soyang'] },
    { id:'r4', cat:'우유·산약 반응', sub:'태음 배제 지표', col:1,
      text:'잘 먹음 (배제 안 됨)', tags:[] },
    { id:'r5', cat:'우유·산약 반응', sub:'태음 배제 지표', col:2,
      text:'산약 먹으면 배 아픔 → 태음 배제', tags:['soyang'] },
    { id:'r6', cat:'우유·산약 반응', sub:'태음 배제 지표', col:2,
      text:'우유 먹고 확실히 설사·복통', tags:[] },
    { id:'r7', cat:'홍삼 반응', sub:'참고', col:1,
      text:'편안 / 무반응', tags:[] },
    { id:'r8', cat:'홍삼 반응', sub:'참고', col:2,
      text:'얼굴 열·가슴답답 → 소양 열자 가능', tags:['soyang','hot'] },
  ],
};

/* 섹션 3 — 자유 기재 (히든카드) */
const D_FREETEXT = {
  id:'r-food', cat:'평생 못 먹는 음식', sub:'히든카드',
  placeholder:'예: 양파 알러지 → 태양인 시사 / 메밀 알러지 → 태음 시사 등 자유 기재',
};

/* 섹션 4 — 테스트 처방 (택일, 라디오) */
const D_RX_OPTIONS = [
  { id:'taeum_cold',  group:'태음 한자', rx:'태음조위탕',           hint:'맞으면 변 시원·땀 개운' },
  { id:'taeum_hot',   group:'태음 열자', rx:'갈근조위탕',           hint:'맞으면 변 좋아짐, 음허자엔 부적' },
  { id:'soyang_cold', group:'소양 한자', rx:'형방패독산 / 형방지황탕', hint:'맞으면 상복부 편안' },
  { id:'soyang_hot',  group:'소양 열자', rx:'지황백호탕 / 양격산화탕', hint:'맞으면 갈증·열감 해소' },
];

/* 섹션 4 — 안준철 4대 기준 (각 항목 호전/무변/악화 3택, 라디오) */
const D_CRITERIA = [
  { id:'stool',   name:'대변', sub:'3~7일 후',
    improve:'시원하고 매일 봄', neutral:'큰 변화 없음', worsen:'설사 / 더 굳음' },
  { id:'urine',   name:'소변', sub:'',
    improve:'시원·정상량',     neutral:'큰 변화 없음', worsen:'빈삭·잔뇨감' },
  { id:'sleep',   name:'수면', sub:'',
    improve:'잘 잠·깊어짐',     neutral:'변화 없음',   worsen:'불면·심계' },
  { id:'fatigue', name:'피로감', sub:'',
    improve:'기력·안색 회복',   neutral:'변화 없음',   worsen:'탈진·무기력' },
];
```

**카운트 확인**: 체크 소견 20개(맥진 6 + 복진 6 + 반응 8) · 자유기재 1칸 · 테스트 처방 라디오 4개(택일) · 4대 기준 3택 라디오 4그룹.

---

## 7. 판정 로직

### 7.1 시사 방향 집계 (보조 표시)
체크된 맥·복·반응 소견의 `tags`를 모두 합산한다.

```javascript
function tallyDirections(checked) {
  // checked: 체크된 finding id 배열
  const all = D_FINDINGS.pulse.concat(D_FINDINGS.palpation, D_FINDINGS.reaction);
  const tally = { taeum:0, soyang:0, cold:0, hot:0, yang:0, yin:0 };
  checked.forEach(function(id){
    const it = all.filter(function(x){ return x.id===id; })[0];
    if (it) it.tags.forEach(function(t){ if (tally[t]!==undefined) tally[t]++; });
  });
  return tally;
}
```

### 7.2 약물 시험 적합도 (자동 판정)
안준철 4대 기준 — `cowork_spec §2.2` / mockup §4 그대로.

```javascript
function evaluateDrugTrial(fourCriteria) {
  // fourCriteria: { stool, urine, sleep, fatigue } 각 'improve'|'neutral'|'worsen'|null
  const vals = ['stool','urine','sleep','fatigue'].map(function(k){ return fourCriteria[k]; });
  const answered = vals.filter(Boolean).length;
  const improve  = vals.filter(function(v){ return v==='improve'; }).length;
  if (answered < 4) return { fitness:'incomplete', improveCount:improve, reason:'4대 기준 입력 미완료' };
  // 4대 기준 중 3개 이상 호전 → 적합 (안준철: 단독 증상 호전만으로 확정 금지)
  if (improve >= 3) return { fitness:'fit',   improveCount:improve, reason:'4대 기준 '+improve+'개 호전 — 적합' };
  return { fitness:'unfit', improveCount:improve, reason:'호전 '+improve+'개 (3개 미만) — 후보 재평가 필요' };
}
```

### 7.3 종합 판정 — 원장 수기 선택 (자동화하지 않음)
**중요**: 맥·복·반응 소견 → 체질·한열·음양형으로 가는 결정 알고리즘은 `cowork_spec`·mockup 어디에도 명시돼 있지 않다. mockup의 종합 판정 zone은 **원장이 직접 누르는 버튼**이다. 따라서 본 도구는:

- 체질·한열·음양형 3축을 **원장이 버튼으로 선택**한다 (자동 확정 금지).
- 도구는 §7.1 시사 방향 집계와 §7.2 약물시험 적합도를 **보조 표시**해 선택을 돕는다.
- 3축 선택지 (mockup §종합 판정 그대로):
  - **체질**: 태음인 / 소양인 / 재시험 필요
  - **한열**: 한증 (寒) / 열증 (熱) / 한열 협잡
  - **음양형 (태음만)**: 양형 (양허) / 음형 (음허) / 해당없음
- 음양형 축은 체질이 "태음인"일 때만 활성화한다. 소양인·재시험 선택 시 음양형은 자동으로 "해당없음" 처리.

### 7.4 다음 모듈 분기
```javascript
function nextModuleOf(finalConstitution, drugFitness) {
  // 체질이 태음/소양으로 확정 + 약물시험 적합(또는 약물시험 미실시) → 모듈 E
  // 체질 '재시험 필요' 또는 약물시험 부적합 → 모듈 C로 되돌아가 후보 재평가
  if (finalConstitution === 'retest') return 'moduleC';
  if (drugFitness === 'unfit')        return 'moduleC';
  return 'moduleE';
}
```
- 약물 시험을 아직 안 한 경우(`incomplete`)에도 체질·한열이 확정됐다면 모듈 E 진행을 허용한다(약물시험은 권장이나 필수 아님). 단 verdict 화면에 "약물 시험 미완료" 경고를 표시.

### 7.5 판정 메시지 (UI 노출용)
| 상태 | 박스 색 | 메시지 |
|---|---|---|
| 약물시험 `fit` | 녹색 (`--taeum-l`) | "**적합** — 4대 기준 N개 호전. 처방 추천(모듈 E)으로 진행하세요." |
| 약물시험 `unfit` | 노랑 (`--gold-l`) | "**부적합** — 호전 N개(3개 미만). 후보 재평가 — 모듈 C로 돌아가세요." |
| 약물시험 `incomplete` | 회색 | "약물 시험 4대 기준 입력 미완료 (재방문 시 입력)." |
| 체질 `재시험 필요` 선택 | 노랑 (`--gold-l`) | "**재시험 필요** — 정밀 시진(모듈 C)으로 돌아가 후보를 재평가하세요." |

---

## 8. LocalStorage 데이터 계약

### 8.1 읽기 (페이지 로드 시)
```javascript
const session = JSON.parse(localStorage.getItem('onnuri_session') || '{}');
// 기대 구조:
// session.patient = { name, gender, age, birthYear }
// session.moduleA = { result:{ top, pcts, confidence }, ... }   (있으면 요약 표시)
// session.moduleC = { verdict:'pending'|..., reason, checks, ... } (있으면 요약 표시)
```
**모듈 C 결과가 없거나 `verdict`가 `pending`이 아니면**: screen-info에 안내문 노출("정밀 시진(모듈 C)에서 보류 판정된 환자 대상입니다") + 모듈 C 링크. 단 진입은 **허용**(원장 재량). C-1의 모듈 A 처리 방식과 동일하게.

### 8.2 쓰기 (판정 확정 시)
```javascript
session.moduleD = {
  sections: {
    pulse:     { items:['p1','p4', ...] },          // 체크된 finding id
    palpation: { items:[...] },
    reaction:  { items:[...], freetext:'양파 알러지' },
  },
  directionTally: { taeum:2, soyang:1, cold:1, hot:0, yang:1, yin:1 },
  drugTrial: {
    prescription: 'taeum_cold',                      // D_RX_OPTIONS의 id (없으면 null)
    fourCriteria: { stool:'improve', urine:'neutral', sleep:'improve', fatigue:'improve' },
    improveCount: 3,
    fitness: 'fit',                                  // 'fit'|'unfit'|'incomplete'
  },
  finalConstitution: 'taeum',     // 'taeum'|'soyang'|'retest'
  finalHanyul: 'cold',            // 'cold'|'hot'|'mixed'
  finalYangYin: 'yang',           // 'yang'|'yin'|'none'
  memo: '처방 의도·추적 관찰...',
  completedAt: Date.now(),
};
localStorage.setItem('onnuri_session', JSON.stringify(session));
```

> **표기 일관성 주의**: PHASE1A §1.1 예시는 `finalConstitution:'te'`(2자 코드)로 적혀 있으나, 모듈 C-1은 `verdict:'taeum'|'soyang'|'pending'`을 쓴다. C→D→E 체인 일관성을 위해 **본 작업서는 `'taeum'|'soyang'` 전체 표기로 통일**한다. (PHASE1A의 2자 코드 예시와 어긋나는 점은 의도된 결정이며, 추후 Kim/원장이 모듈 E·F 설계 시 한쪽으로 표준화 권장.)

### 8.3 다음 모듈 분기 (판정 확정 후)
- `nextModuleOf(...) === 'moduleE'` → `온누리_처방추천_E_v1.html` 열기 (W3 미완성이면 alert 안내)
- `nextModuleOf(...) === 'moduleC'` → `온누리_정밀시진_C1_v1.html` 열기
- "결과 인쇄" 버튼 → `window.print()`

---

## 9. UI 구체 명세

### 9.1 헤더 (모든 screen 상단)
```
[온누리 한의원]                              [v1 · 기능 검사 D]
사상체질 기능 검사 — 맥진·복진·반응·약물시험
[환자명] · [성별] · [나이]세 · 모듈 C: 보류 (사유: 양쪽 결정타 충돌)
```
환자·모듈 C 요약은 `session.patient`·`session.moduleC`에서 자동 로드.

### 9.2 검사 섹션 (screen-test, 섹션 1~3)
- mockup의 `.section` + `.check-grid` 구조 그대로 (3열: 검사 항목 / 소견 1·2 또는 태음·소양 시사)
- 각 소견은 `<label>` 안에 `<input type="checkbox" id="…" data-tags="taeum,yang">` + 텍스트
- 섹션 3 "평생 못 먹는 음식"은 `<textarea>` 자유 기재 (집계 비대상)
- 체크 시 §9.4 시사 방향 패널 즉시 갱신

### 9.3 약물 시험 섹션 (screen-test, 섹션 4)
- 테스트 처방 4개: 라디오(택일). mockup `.rx-test` 박스 스타일
- 4대 기준: 각 기준마다 호전 / 무변·모호 / 악화 라디오 3택 (mockup 4열 그리드)
- 입력 시 §7.2 적합도 즉시 계산 → §7.5 메시지 박스 갱신
- 섹션 하단 고정 안내문: "※ 한 가지 증상의 호전만으로 체질을 확정하지 않는다 (안준철). 4대 기준 중 3개 이상이 호전되어야 적합 판정. 피부 건조 단독은 계절적 원인일 수 있으므로 판단 기준에서 제외."

### 9.4 시사 방향 집계 패널 (screen-test, sticky)
```
┌──────────────────────────────────────────────────────┐
│ 시사 방향  태음 2  소양 1  │  寒 1  熱 0  │  양형 1  음형 1 │
│ 약물 시험  [§7.5 적합/부적합 메시지 박스]               │
└──────────────────────────────────────────────────────┘
```
표 하단 sticky. 집계는 보조 지표이며 자동 판정이 아님을 작은 글씨로 명시.

### 9.5 액션 버튼 (screen-test 하단)
- **[← 모듈 C로 돌아가기]**
- **[모든 입력 초기화]** (확인 dialog)
- **[종합 판정 →]** (screen-verdict로)

### 9.6 종합 판정 화면 (screen-verdict)
- mockup `.judge-zone` 구조 — 3축 버튼 행 (체질 / 한열 / 음양형)
- 음양형 행은 체질=태음 선택 시에만 활성(아니면 흐리게 + "해당없음" 고정)
- 시사 방향 집계 + 약물 시험 결과 요약 카드
- 처방 의도 메모 `<textarea>`
- "판정 확정" 버튼: 체질·한열이 모두 선택돼야 활성화
- 확정 후: §7.4 분기 버튼 노출 — [처방 추천(모듈 E) 진행] 또는 [기능 검사 재평가 — 모듈 C로], 공통 [결과 인쇄] · [검사로 돌아가기]

---

## 10. 의료 안전 가드 (반드시 포함, 위치 명시)

### 10.1 헤더 상단 (모든 screen) — 안전 배너
```
본 도구는 임상 의사결정 지원 도구이며 의료기기가 아닙니다.
최종 진단·처방은 원장님이 환자를 직접 확인하고 결정합니다.
```

### 10.2 약물 시험 섹션 안내 (§9.3 하단, 위 안준철 4대 기준 문구)

### 10.3 화면 하단 안전 안내문 2종 (cowork_spec §7-3, 모든 screen)
```
※ 한 가지 증상의 호전만으로 체질·처방을 확정하지 않습니다 (안준철)
※ 체질과 한열은 항상 전제로 하고 약물 적합성을 확인합니다 (안준철)
```

### 10.4 출처 표시 (푸터)
```
검사 항목 출처: 안준철 사상의학 방법론 · 권재식 반응 확인 자료
```

### 10.5 종합 판정 자동화 금지 명시
screen-verdict에 작은 안내: "체질·한열·음양형은 검사 소견을 참고하여 **원장이 직접 판정**합니다. 시사 방향 집계는 보조 지표입니다."

### 10.6 인쇄 출력 시
- 안전 안내문 2종 인쇄 포함
- 종합 판정·체크 소견·약물시험 결과·환자 정보 인쇄 포함
- 카운터·집계 패널은 인쇄 시 회색조 또는 흰 배경 (`@media print`)

---

## 11. 코드 스켈레톤 (Claude Code가 이 골격을 채우기)

> C-1(`온누리_정밀시진_C1_v1.html`)의 골격을 그대로 따른다. `:root` 변수는 C-1 것에 한열·음양형 색을 추가.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>온누리 한의원 — 기능 검사 D (맥·복·반응·약물시험)</title>
<style>
:root{
  --taeum:#2D7D46; --taeum-l:#E8F5EC; --taeum-bg:#F4FBF6;
  --soyang:#D4691E; --soyang-l:#FDF1E5; --soyang-bg:#FEF8F2;
  --gold:#C49A3F; --gold-l:#FEF9E6;
  --hot:#c9302c;  --hot-l:#fbe4e1;        /* 熱 */
  --cold:#2E5C8A; --cold-l:#e1ebfb;       /* 寒 */
  --yang:#a07600; --yang-l:#fff4d6;       /* 양형 */
  --yin:#5e4a8a;  --yin-l:#e8e0f2;        /* 음형 */
  --ink:#1a1a1a; --sub:#555; --line:#d5d5d5;
  --bg:#faf8f3; --serif:'Noto Serif KR',serif; --sans:'Noto Sans KR',sans-serif;
}
/* ... reset + 레이아웃 + 섹션 + check-grid + 라디오 + sticky 집계패널 + 판정 zone + @media print */
</style>
</head>
<body>
<div id="wrap" class="wrap"></div>
<script>
const D_FINDINGS = { /* §6 그대로 */ };
const D_FREETEXT = { /* §6 그대로 */ };
const D_RX_OPTIONS = [ /* §6 그대로 */ ];
const D_CRITERIA = [ /* §6 그대로 */ ];

let step = 0;  // 0:info, 1:test, 2:verdict
let session = JSON.parse(localStorage.getItem('onnuri_session') || '{}');
let checks = {};                 // finding id → true
let freetext = '';
let rxChoice = null;             // D_RX_OPTIONS id
let criteria = { stool:null, urine:null, sleep:null, fatigue:null };
let verdict = { constitution:null, hanyul:null, yangyin:null };
let memo = '';

function loadSession(){ /* moduleD 있으면 상태 복원 + step=2 */ }
function saveSession(){ /* moduleD에 §8.2 구조로 저장 */ }
function tallyDirections(checkedIds){ /* §7.1 */ }
function evaluateDrugTrial(fourCriteria){ /* §7.2 */ }
function nextModuleOf(constitution, fitness){ /* §7.4 */ }

function renderInfo(){ /* 환자 + 모듈 A·C 요약 + "기능 검사 시작" */ }
function renderTest(){ /* 섹션 1~4 + sticky 집계 패널 */ }
function renderVerdict(){ /* 3축 버튼 + 요약 + 메모 + 분기 버튼 */ }

function onFindingChange(id){ /* checks 토글 → refreshPanel */ }
function onCriteriaChange(critId, val){ /* criteria 갱신 → refreshPanel */ }
function refreshPanel(){ /* 집계·약물시험 메시지 DOM 갱신 */ }
function selectAxis(axis, val){ /* verdict 3축 선택 → 재렌더 */ }
function confirmVerdict(){ /* moduleD 저장 → step=2 → render */ }
function goToModuleC(){ location.href = '온누리_정밀시진_C1_v1.html'; }
function goToModuleE(){ /* W3 미완성: alert. 완성 후 location.href 로 교체 */ }

function render(){
  const screens = [renderInfo, renderTest, renderVerdict];
  document.getElementById('wrap').innerHTML = screens[step]();
  window.scrollTo({top:0,behavior:'smooth'});
}
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
| `onnuri_session.moduleC` 없음 또는 verdict≠pending | screen-info에 "정밀 시진(모듈 C) 보류 환자 대상" 안내 + 모듈 C 링크. 진입은 허용 |
| `onnuri_session.patient` 없음 | "환자 정보 없음" 표시, 진입 허용 (이름 입력칸 제공) |
| 약물 시험 4대 기준 일부만 입력 | `fitness:'incomplete'` — 회색 메시지. verdict 진행은 허용(체질·한열 확정 시) |
| 체크·입력 0개 상태 | 집계 패널 0으로 표시, 약물시험 메시지 회색 |
| 체질 미선택 상태에서 "판정 확정" | 버튼 비활성 + "체질·한열을 먼저 선택하세요" 안내 |
| 체질=소양/재시험인데 음양형이 선택돼 있음 | 음양형 자동 'none' 처리, 음양형 행 흐리게 |
| 화면 새로고침 | session.moduleD 있으면 verdict 화면 복원(상태 전부 복원), 없으면 info 화면 |
| 모듈 E HTML 미존재(W3 전) | goToModuleE 클릭 시 alert 안내. moduleD는 이미 저장됨 |
| "모든 입력 초기화" | 확인 dialog → checks·criteria·rxChoice·verdict·memo 전부 리셋 |

---

## 13. 안티패턴 (Claude Code가 피해야 할 것)

- ❌ React·Vue·jQuery 등 외부 라이브러리 — vanilla JS만
- ❌ 검사 항목 텍스트를 HTML에 하드코딩 — `D_FINDINGS` 등 데이터 객체에서 생성
- ❌ **체질·한열·음양형을 자동 확정** — 원장이 버튼으로 선택. 도구는 시사 방향 집계만 보조 표시 (§7.3)
- ❌ §7.1 집계 결과를 "판정"이라 부르기 — "시사 방향(보조 지표)"으로 표기
- ❌ 약물시험 4대 기준 외 항목(피부 건조 등)을 적합도 계산에 포함
- ❌ LocalStorage 키 임의 사용 — 반드시 `onnuri_session` 단일 키
- ❌ 임상 텍스트 임의 수정 — §6 데이터의 한 글자도 바꾸지 말 것
- ❌ 안전 안내문 생략 — §10의 위치 모두 포함
- ❌ "AI가 진단/판정" 같은 문구 — "참고" "시사" "보조"만 사용
- ❌ v24.html·C-1.html 등 기존 파일 수정 — D 파일만 신규 생성

---

## 14. 작업 순서 (10 단계)

1. **데이터·로직 먼저** — `D_FINDINGS`·`D_RX_OPTIONS`·`D_CRITERIA` + `tallyDirections()`·`evaluateDrugTrial()`·`nextModuleOf()` 작성 + 콘솔에서 케이스 단위 테스트
2. **HTML 골격** — C-1 골격 복제, `:root`에 한열·음양형 색 추가, 진입점 배치
3. **CSS 기반** — 레이아웃 + check-grid + 라디오 + 섹션 카드 (C-1 스타일 일관)
4. **screen-info 구현** — 세션 로드, 환자/모듈 A·C 요약, "기능 검사 시작" 버튼
5. **screen-test 섹션 1~3** — 맥진·복진·반응 check-grid + 자유기재
6. **screen-test 섹션 4** — 약물 시험(처방 라디오 + 4대 기준 3택)
7. **시사 방향 집계 패널 sticky** — 체크/라디오 이벤트 → `refreshPanel` 실시간 갱신
8. **screen-verdict 구현** — 3축 버튼 + 요약 카드 + 메모 + 분기 버튼
9. **인쇄 스타일** — `@media print` (sticky 해제·색 흰 배경·페이지 나눔)
10. **자체 검증** — §15 acceptance criteria 모두 통과 확인

---

## 15. 검증 기준 (Acceptance Criteria)

### 15.1 기능 검증 (9)
- [ ] 페이지 로드 시 빈 화면 안 나옴
- [ ] `node --check` 통과
- [ ] 모듈 C 결과 있으면 보류 사유 자동 노출 / 없으면 안내 메시지
- [ ] 체크 소견 20개·라디오 전부 클릭 가능, 시사 방향 집계 즉시 갱신
- [ ] 약물 시험 4대 기준 3개 이상 호전 → "적합", 2개 이하 → "부적합" 메시지
- [ ] 4대 기준 일부만 입력 시 "입력 미완료(incomplete)" 처리
- [ ] 체질·한열 선택해야 "판정 확정" 활성화, 음양형은 태음일 때만 활성
- [ ] "판정 확정" 시 `onnuri_session.moduleD` §8.2 구조로 저장
- [ ] 새로고침 후 moduleD 있으면 verdict 화면 + 상태 복원 / "모든 입력 초기화" 동작

### 15.2 임상 안전 검증 (5)
- [ ] 안전 배너 모든 screen 상단 노출
- [ ] 안전 안내문 2종 화면 하단 노출
- [ ] 약물 시험 4대 기준 안내문(피부 건조 제외 포함) 노출
- [ ] 종합 판정 자동화 금지 안내(§10.5) 노출 + 3축이 실제로 수기 버튼
- [ ] 출처 표시 푸터 노출 / §6 임상 텍스트 전 항목 한 글자도 다르지 않음

### 15.3 UI·인쇄 검증 (4)
- [ ] 노트북 Chrome 1366×768 이상에서 가로 스크롤 없이 표시
- [ ] mockup의 섹션·검사 그리드·태그 색상과 일관
- [ ] `Ctrl+P` 인쇄 시 종합 판정·소견·약물시험·환자 정보 모두 포함, 페이지 나눔 깔끔
- [ ] 인쇄 시 sticky 집계 패널이 색 진하지 않게 처리

---

## 16. 완료 후 Claude Code의 보고 형식

```
✓ 모듈 D 구현 완료
파일: C:\Users\ADmiN\Downloads\onnuri-site\온누리_기능검사_D_v1.html
라인 수: NNNN
검증:
  - 기능 9/9 통과
  - 임상 안전 5/5 통과
  - UI·인쇄 4/4 통과
테스트 시나리오:
  1. C-1에서 보류 판정 → onnuri_session.moduleC 저장됨
  2. 기능검사 D HTML 열기 → 환자·모듈 C 보류 사유 자동 로드
  3. 맥·복·반응 소견 체크 → 시사 방향 집계 실시간 갱신
  4. 약물시험 4대 기준 3개 호전 입력 → "적합" 메시지
  5. 종합 판정 3축 선택 → 판정 확정 → onnuri_session.moduleD 저장
  6. 인쇄 미리보기 → 판정·소견·환자 정보 포함
다음 액션: W3 모듈 E 작업서 작성 또는 W2 결과물 임상 시험
```

---

## 부록 A. C-1에서 그대로 가져올 패턴
- `:root` CSS 변수 형식, Noto Serif/Sans KR 폰트 `<link>` 로드
- `let step` + `render()` + `screens[step]()` 3-screen 패턴
- `esc()` HTML 이스케이프 헬퍼
- `loadSession()` / `saveSession()` — `onnuri_session` 단일 키, try/catch 없이 직접 사용
- `banner()` / `footer()` 공통 조각 (안전 배너 + 안내문 2종 + 출처)
- `@media print` — `.no-print` 숨김, sticky 해제, 색 흰 배경
- 새로고침 시 결과 있으면 verdict 복원

## 부록 B. 본 작업 외 절대 하지 말 것
- 모듈 E(처방 추천) 본 구현 — W3 작업서에서 별도 진행
- 처방 데이터베이스 구축 — W3에서 진행
- v24.html·C-1.html 등 기존 파일 수정 — 모듈 A↔C 연동 이슈는 W4(데이터 연결)에서 처리
- 체질·한열·음양형 판정 알고리즘 신규 설계 — §7.3대로 원장 수기 선택 유지
- 모듈 C-2~C-6, 의사결정나무(모듈 B) — Phase 1 범위 밖

---

**문서 끝**. Claude Code: §3 참조 자료 정독 후 §14 작업 순서대로 진행. 의문점은 작업 전에 사용자에게 한 번에 정리해 질문.
**작성**: Claude Code (W1_TASK_BRIEF.md 형식 준용) · **임상 감수 필요**: 안준철 원장 — 특히 §7.3 종합 판정 방식과 §6 항목 가중(tags)은 원장 확인 권장.
