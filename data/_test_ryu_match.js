/* 류주열 매칭 엔진 시뮬레이션 — Node에서 직접 실행
   HTML 변경 없이 매칭 결과만 확인 */
const fs = require('fs');
const path = require('path');

const SX_DICT = JSON.parse(fs.readFileSync(path.join(__dirname, 'sx_dict.json'), 'utf8')).map;
const BYEONJEUNG = JSON.parse(fs.readFileSync(path.join(__dirname, 'byeonjeung_map.json'), 'utf8')).byeonjeung;
const RX_FULL = JSON.parse(fs.readFileSync(path.join(__dirname, 'prescriptions_full.json'), 'utf8'));
const BJ_CK = { taeum:'te', soyang:'sy', taeyang:'ty', soeum:'se' };

// HTML에서 RX_CURATED를 뽑아오기 어려우니, 즐겨찾기 코드만 하드코딩 (HTML과 동기)
const FAV_CODES = {
  taeum:   ['H019','H110','H117'],     // 마황의이인탕·조위승청탕·태음조위(미연결) — H019(태음조위 X→ 갈근조위), 실제론 HTML 참조
  soyang:  ['P013','P009','P018'],
  taeyang: [],
  soeum:   []
};

function ko2hans(token){
  if (!token) return [];
  token = String(token).trim(); if (!token) return [];
  if (SX_DICT[token]) return SX_DICT[token].slice();
  const out = [];
  for (const k of Object.keys(SX_DICT)){
    if (token.indexOf(k) >= 0 || k.indexOf(token) >= 0){
      for (const h of SX_DICT[k]) if (out.indexOf(h)<0) out.push(h);
    }
  }
  return out;
}
function freeTextToHans(ft){
  if (!ft) return { hans:[], hitKeys:[] };
  const hans=[], hitKeys=[];
  for (const k of Object.keys(SX_DICT)){
    if (k.length>=2 && ft.indexOf(k)>=0){
      hitKeys.push(k);
      for (const h of SX_DICT[k]) if (hans.indexOf(h)<0) hans.push(h);
    }
  }
  return { hans, hitKeys };
}
function bjSxMatches(sxList, hansPool){
  if (!sxList || !sxList.length || !hansPool.length) return 0;
  let hits=0;
  for (const s of sxList){
    if (!s) continue;
    for (const h of hansPool){
      if (s===h || s.indexOf(h)>=0 || h.indexOf(s)>=0){ hits++; break; }
    }
  }
  return hits;
}
function match(profile, cc, ft){
  const ck = BJ_CK[profile.constitution];
  const wantedHanyul = profile.hanyul==='mixed' ? null : profile.hanyul;
  const ccHansPool = []; const ccHansMap={};
  for (const c of cc){
    const hs = ko2hans(c);
    for (const h of hs){
      if (ccHansPool.indexOf(h)<0) ccHansPool.push(h);
      if (!ccHansMap[h]) ccHansMap[h]=[];
      if (ccHansMap[h].indexOf(c)<0) ccHansMap[h].push(c);
    }
  }
  const ftScan = freeTextToHans(ft);
  const codeScore = {};
  let bjMatched=0;
  for (const bj of BYEONJEUNG){
    const ccHit = bjSxMatches(bj.sx, ccHansPool);
    const ftHit = bjSxMatches(bj.sx, ftScan.hans);
    if (ccHit===0 && ftHit===0) continue;
    bjMatched++;
    const rxBranch = bj.rx && bj.rx[ck]; if (!rxBranch) continue;
    const pickRoles = wantedHanyul ? [wantedHanyul,'any'] : ['hot','cold','any'];
    for (const role of pickRoles){
      for (const code of (rxBranch[role]||[])){
        if (!codeScore[code]) codeScore[code]={score:0,jeung:[],sxMatched:[]};
        codeScore[code].score += ccHit*3 + ftHit*1;
        if (codeScore[code].jeung.indexOf(bj.jeung)<0) codeScore[code].jeung.push(bj.jeung);
      }
    }
  }
  const fav = FAV_CODES[profile.constitution]||[];
  for (const c of Object.keys(codeScore)) if (fav.indexOf(c)>=0) codeScore[c].score += 8;
  const rxMap = {}; for (const r of RX_FULL) rxMap[r.code]=r;
  const ranked = Object.keys(codeScore)
    .map(c => ({code:c, rx:rxMap[c], score:codeScore[c].score, jeung:codeScore[c].jeung, isFav:fav.indexOf(c)>=0}))
    .filter(x=>x.rx)
    .sort((a,b)=>b.score-a.score)
    .slice(0,5);
  return { ranked, bjMatched, ccHansPool, ftHansPool:ftScan.hans, ftHitKeys:ftScan.hitKeys };
}

// === 시나리오 ===
const scenes = [
  { name:'태음·한 / 변비+소화불량+더부룩 / 환절기 비염 메모',
    profile:{constitution:'taeum',hanyul:'cold'}, cc:['변비','소화불량','더부룩'], ft:'환절기마다 비염 악화. 식후 더부룩 빈번.' },
  { name:'소양·열 / 두통+불면 / 상열감 메모',
    profile:{constitution:'soyang',hanyul:'hot'}, cc:['두통','불면'], ft:'얼굴 상열감 자주. 입이 마름.' },
  { name:'태양·한 / 요통+사지마비 / 빈 메모',
    profile:{constitution:'taeyang',hanyul:'cold'}, cc:['요통','사지마비'], ft:'' },
  { name:'소음·한 / 설사+복통 / 수족냉 메모',
    profile:{constitution:'soeum',hanyul:'cold'}, cc:['설사','복통'], ft:'수족냉 심함. 식욕부진.' },
  { name:'태음·열 / 기침+가래 / 빈 메모',
    profile:{constitution:'taeum',hanyul:'hot'}, cc:['기침','가래'], ft:'' },
  { name:'미수록단어 입력 / 사전 외 단어 처리',
    profile:{constitution:'taeum',hanyul:'cold'}, cc:['건선','아토피'], ft:'피부 가려움.' },
];

for (const s of scenes){
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▣', s.name);
  console.log('  입력 주소증:', s.cc, '· 메모:', s.ft ? s.ft.slice(0,30)+'...' : '(없음)');
  const r = match(s.profile, s.cc, s.ft);
  console.log('  → 한문 변환 (CC):', r.ccHansPool.slice(0,8).join(',') + (r.ccHansPool.length>8?'...':''));
  console.log('  → 메모 한글 hit:', r.ftHitKeys.join(','));
  console.log('  → 변증 매칭:', r.bjMatched, '건');
  if (r.ranked.length===0){
    console.log('  ✘ 추천 0건');
    continue;
  }
  for (const m of r.ranked){
    console.log('  ['+m.score+'점'+(m.isFav?' ★즐겨찾기':'')+'] '+m.code+' '+m.rx.name+'  ←  '+m.jeung.slice(0,2).join('/')+(m.jeung.length>2?'..':''));
  }
}
