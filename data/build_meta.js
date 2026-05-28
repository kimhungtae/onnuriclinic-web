/* ═══════════════════════════════════════════════════
   온누리 사상체질 — 처방 메타데이터 빌드 스크립트
   byeonjeung_map.json (변증→처방) 을 역인덱싱하여
   prescriptions_meta.json (처방→변증·증상·한열) 생성.
   prescriptions_full.json 과 조인하여 처방명·구성·체질 부착.
   실행:  node build_meta.js   (data 폴더 안에서)
   외부 라이브러리 0개.
═══════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const map = JSON.parse(fs.readFileSync(path.join(DIR, 'byeonjeung_map.json'), 'utf8'));
const full = JSON.parse(fs.readFileSync(path.join(DIR, 'prescriptions_full.json'), 'utf8'));

const CONST = { te: 'taeum', sy: 'soyang', ty: 'taeyang', se: 'soeum' };

// 처방코드 → full DB 항목
const fullByCode = {};
full.forEach(function (p) { fullByCode[p.code] = p; });

// 처방코드 → 메타 누적
const meta = {};
function ensure(code) {
  if (!meta[code]) {
    meta[code] = {
      code: code,
      byeonjeung: [],          // [{jeung, cat, role}]  role: hot|cold|any
      symptoms: [],            // 중복 제거된 증상(한자)
      hotHits: 0, coldHits: 0, anyHits: 0
    };
  }
  return meta[code];
}

map.byeonjeung.forEach(function (entry) {
  Object.keys(entry.rx).forEach(function (ck) {
    const block = entry.rx[ck];
    ['hot', 'cold', 'any'].forEach(function (role) {
      const list = block[role];
      if (!list) return;
      list.forEach(function (code) {
        const m = ensure(code);
        m.byeonjeung.push({ jeung: entry.jeung, cat: entry.cat, role: role });
        if (role === 'hot') m.hotHits++;
        else if (role === 'cold') m.coldHits++;
        else m.anyHits++;
        entry.sx.forEach(function (s) {
          if (m.symptoms.indexOf(s) < 0) m.symptoms.push(s);
        });
      });
    });
  });
});

// 한열 판정: 열로만 등장→hot, 한으로만→cold, 둘 다→mixed, 단일(any)만→unknown
function deriveHanyul(m) {
  if (m.hotHits > 0 && m.coldHits === 0) return { hanyul: 'hot', note: '책에서 열(熱)자 처방으로만 등장' };
  if (m.coldHits > 0 && m.hotHits === 0) return { hanyul: 'cold', note: '책에서 한(寒)자 처방으로만 등장' };
  if (m.hotHits > 0 && m.coldHits > 0) return { hanyul: 'mixed', note: '열·한 양쪽으로 등장 — 원장 확인 필요' };
  return { hanyul: 'unknown', note: '한열 구분 없는 단일 처방으로만 등장 — 원장 확인 필요' };
}

// 출력 조립
const items = {};
const codes = Object.keys(meta).sort();
const missingInFull = [];
codes.forEach(function (code) {
  const m = meta[code];
  const d = deriveHanyul(m);
  const f = fullByCode[code];
  if (!f) missingInFull.push(code);
  items[code] = {
    code: code,
    name: f ? f.name : null,
    hanja: null,
    constitution: f ? f.constitution : null,
    composition: f ? f.composition : null,
    hanyul: d.hanyul,
    hanyulNote: d.note,
    byeonjeungCount: m.byeonjeung.length,
    byeonjeung: m.byeonjeung,
    symptoms: m.symptoms
  };
});

const out = {
  _doc: '온누리 사상체질 — 처방별 변증·증상·한열 메타데이터 (자동 생성)',
  _source: 'byeonjeung_map.json 역인덱싱 + prescriptions_full.json 조인',
  _build: 'node build_meta.js',
  _date: new Date().toISOString().slice(0, 10),
  _warn: '한열(hanyul)·증상은 책 전사에서 파생된 초안. mixed/unknown 및 전체 원장 검수 대상.',
  count: codes.length,
  items: items
};
fs.writeFileSync(path.join(DIR, 'prescriptions_meta.json'), JSON.stringify(out, null, 1), 'utf8');

// ── 리포트 ──
const byHanyul = { hot: 0, cold: 0, mixed: 0, unknown: 0 };
codes.forEach(function (c) { byHanyul[items[c].hanyul]++; });
const fullCodes = full.map(function (p) { return p.code; });
const notMapped = fullCodes.filter(function (c) { return !meta[c]; });

console.log('═══════════════════════════════════════════');
console.log(' 처방 메타데이터 빌드 완료');
console.log('───────────────────────────────────────────');
console.log(' 변증 항목 수      :', map.byeonjeung.length);
console.log(' 메타 생성 처방 수 :', codes.length, '/ 류주열 전체', full.length);
console.log(' 한열 분류         : 열', byHanyul.hot, '· 한', byHanyul.cold,
            '· 혼합', byHanyul.mixed, '· 미상', byHanyul.unknown);
console.log(' full DB 미수록 코드:', missingInFull.length ? missingInFull.join(',') : '없음');
console.log(' 변증서에 안 나온 처방:', notMapped.length, '개 (검색참조용으로만 잔류)');
console.log('═══════════════════════════════════════════');
