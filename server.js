/* ═══════════════════════════════════════════════════
   온누리 사상체질 진료 시스템 — 원내 연동 서버 (W6 / Phase 1b)
   - 5개 모듈 HTML·data 정적 서빙
   - onnuri_session·onnuri_trial_log 를 서버에 보관 → 원장실 PC 내 모듈 간 공유
   - 접수실 대기열: 접수실 PC에서 자가설문 → /api/intake → 원장실 진료 대기 목록
   - HTML 응답에 동기화 스크립트(shim) 자동 주입 (접수실 모드 ?intake=1 은 동기화 제외)
   - 잘못된 요청에도 서버가 죽지 않도록 전 구간 오류 방어
   실행:  node server.js   (또는  서버시작.bat  더블클릭)
   외부 라이브러리 0개 — Node 기본 모듈만.
═══════════════════════════════════════════════════ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = 8000;
const DATA_DIR = path.join(ROOT, 'server-data');
const KV_FILE = path.join(DATA_DIR, 'kv.json');
const INTAKE_FILE = path.join(DATA_DIR, 'intake_queue.json');
const ADDR_FILE = path.join(ROOT, '접속주소_안내.txt');
const SYNC_KEYS = ['onnuri_session', 'onnuri_trial_log'];
const RECEPTION_FILE = '/온누리_접수실_v1.html';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(KV_FILE)) fs.writeFileSync(KV_FILE, '{}', 'utf8');
if (!fs.existsSync(INTAKE_FILE)) fs.writeFileSync(INTAKE_FILE, '[]', 'utf8');

function loadKV(){ try { return JSON.parse(fs.readFileSync(KV_FILE, 'utf8')); } catch(e){ return {}; } }
function saveKV(o){ try { fs.writeFileSync(KV_FILE, JSON.stringify(o, null, 1), 'utf8'); } catch(e){ console.error('저장 실패:', e.message); } }
function loadIntake(){ try { const v = JSON.parse(fs.readFileSync(INTAKE_FILE, 'utf8')); return Array.isArray(v) ? v : []; } catch(e){ return []; } }
function saveIntake(a){ try { fs.writeFileSync(INTAKE_FILE, JSON.stringify(a, null, 1), 'utf8'); } catch(e){ console.error('대기열 저장 실패:', e.message); } }
function safeDecode(s){ try { return decodeURIComponent(s); } catch(e){ return s; } }

/* HTML <head>에 주입할 동기화 스크립트:
   ① 페이지 로드 시 서버 값을 동기 XHR로 받아 localStorage에 채움
   ② localStorage.setItem/removeItem 을 가로채 동기화 키 변경 시 서버에 POST
   ※ 접수실 모드(URL ?intake=1)에서는 동기화하지 않음 — 접수실 PC가 공용 세션을 건드리지 않게 */
const SYNC_SHIM =
  '<script>(function(){' +
  'if(String(location.search).indexOf("intake")>=0)return;' +
  'var K=["onnuri_session","onnuri_trial_log"];' +
  'try{var x=new XMLHttpRequest();x.open("GET","/api/kv",false);x.send();' +
  'if(x.status===200){var d=JSON.parse(x.responseText||"{}");' +
  'K.forEach(function(k){if(d[k]!==undefined&&d[k]!==null)localStorage.setItem(k,JSON.stringify(d[k]));});}}catch(e){}' +
  'function push(k,body){try{var p=new XMLHttpRequest();' +
  'p.open("POST","/api/kv?key="+encodeURIComponent(k),true);' +
  'p.setRequestHeader("Content-Type","application/json");p.send(body);}catch(e){}}' +
  'var _s=localStorage.setItem.bind(localStorage);' +
  'localStorage.setItem=function(k,v){_s(k,v);if(K.indexOf(k)>=0)push(k,v);};' +
  'var _r=localStorage.removeItem.bind(localStorage);' +
  'localStorage.removeItem=function(k){_r(k);if(K.indexOf(k)>=0)push(k,"null");};' +
  '})();</script>';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
};

function send(res, code, type, body){
  try { res.writeHead(code, {'Content-Type': type}); res.end(body); } catch(e){}
}

/* ── API: 세션 동기화 (onnuri_session·onnuri_trial_log) ── */
function handleApi(req, res, url){
  if (req.method === 'GET'){
    send(res, 200, 'application/json; charset=utf-8', JSON.stringify(loadKV()));
    return;
  }
  if (req.method === 'POST'){
    const chunks = [];
    let size = 0;
    req.on('data', function(c){ size += c.length; if (size > 5e6){ req.destroy(); return; } chunks.push(c); });
    req.on('error', function(){ send(res, 400, 'application/json', '{"ok":false}'); });
    req.on('end', function(){
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        const key = url.searchParams.get('key');
        if (!key || SYNC_KEYS.indexOf(key) < 0){ send(res, 400, 'application/json', '{"ok":false}'); return; }
        const kv = loadKV();
        try { kv[key] = JSON.parse(body); } catch(e){ kv[key] = null; }
        saveKV(kv);
        send(res, 200, 'application/json', '{"ok":true}');
      } catch(e){
        console.error('API 처리 오류:', e.message);
        send(res, 500, 'application/json', '{"ok":false}');
      }
    });
    return;
  }
  send(res, 405, 'text/plain; charset=utf-8', 'method not allowed');
}

/* ── API: 접수실 대기열 ──
   GET  /api/intake          → 대기 환자 배열
   POST /api/intake          → {patient,moduleA} 1건 추가 (서버가 id·시각 부여)
   POST /api/intake/remove?id=X → 해당 환자 제거 (원장 진료 시작·삭제 시) */
function handleIntake(req, res, url, isRemove){
  if (req.method === 'GET' && !isRemove){
    send(res, 200, 'application/json; charset=utf-8', JSON.stringify(loadIntake()));
    return;
  }
  if (req.method === 'POST'){
    const chunks = [];
    let size = 0;
    req.on('data', function(c){ size += c.length; if (size > 5e6){ req.destroy(); return; } chunks.push(c); });
    req.on('error', function(){ send(res, 400, 'application/json', '{"ok":false}'); });
    req.on('end', function(){
      try {
        if (isRemove){
          const id = url.searchParams.get('id');
          const q = loadIntake().filter(function(it){ return String(it.id) !== String(id); });
          saveIntake(q);
          send(res, 200, 'application/json', '{"ok":true}');
          return;
        }
        const body = Buffer.concat(chunks).toString('utf8');
        let rec = null;
        try { rec = JSON.parse(body); } catch(e){ rec = null; }
        if (!rec || typeof rec !== 'object'){ send(res, 400, 'application/json', '{"ok":false}'); return; }
        const q = loadIntake();
        const id = Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        q.push({ id: id, patient: rec.patient || {}, moduleA: rec.moduleA || null, submittedAt: Date.now() });
        saveIntake(q);
        send(res, 200, 'application/json', '{"ok":true,"id":"' + id + '"}');
      } catch(e){
        console.error('대기열 처리 오류:', e.message);
        send(res, 500, 'application/json', '{"ok":false}');
      }
    });
    return;
  }
  send(res, 405, 'text/plain; charset=utf-8', 'method not allowed');
}

/* ── 정적 파일 (HTML이면 동기화 shim 주입) ── */
function handleStatic(res, pathname){
  let rel = (pathname === '/' || pathname === '') ? '/온누리_사상체질_홈_v1.html' : pathname;
  const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[\/\\])+/, ''));
  if (file.indexOf(ROOT) !== 0){ send(res, 403, 'text/plain; charset=utf-8', 'forbidden'); return; }
  fs.readFile(file, function(err, data){
    try {
      if (err){ send(res, 404, 'text/plain; charset=utf-8', '404 — ' + rel); return; }
      const ext = path.extname(file).toLowerCase();
      if (ext === '.html'){
        let html = data.toString('utf8');
        if (html.indexOf('<head>') >= 0) html = html.replace('<head>', '<head>\n' + SYNC_SHIM);
        else html = SYNC_SHIM + html;
        send(res, 200, 'text/html; charset=utf-8', html);
      } else {
        send(res, 200, MIME[ext] || 'application/octet-stream', data);
      }
    } catch(e){
      console.error('파일 서빙 오류:', e.message);
      send(res, 500, 'text/plain; charset=utf-8', 'server error');
    }
  });
}

const server = http.createServer(function(req, res){
  try {
    let url;
    try { url = new URL(req.url, 'http://localhost'); }
    catch(e){ send(res, 400, 'text/plain; charset=utf-8', 'bad request'); return; }
    const pathname = safeDecode(url.pathname);
    if (pathname === '/api/kv') handleApi(req, res, url);
    else if (pathname === '/api/intake') handleIntake(req, res, url, false);
    else if (pathname === '/api/intake/remove') handleIntake(req, res, url, true);
    else if (pathname === '/접수실' || pathname === '/reception'){
      // 접수실 PC용 간편 주소 → 접수실 모드(?intake=1)로 리디렉트
      try { res.writeHead(302, {'Location': encodeURI(RECEPTION_FILE) + '?intake=1'}); res.end(); } catch(e){}
    }
    else handleStatic(res, pathname);
  } catch(e){
    console.error('요청 처리 오류:', e.message);
    send(res, 500, 'text/plain; charset=utf-8', 'server error');
  }
});

/* 잘못된 HTTP·미처리 예외에도 서버가 절대 죽지 않게 */
server.on('clientError', function(err, socket){
  try { socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); } catch(e){}
});
process.on('uncaughtException', function(e){
  console.error('처리되지 않은 오류 (서버는 계속 실행):', e.message);
});

/* 이 PC의 내부망(LAN) IPv4 주소 목록 */
function lanIPs(){
  const out = [];
  try {
    const ifs = os.networkInterfaces();
    Object.keys(ifs).forEach(function(name){
      (ifs[name] || []).forEach(function(i){
        if (i && i.family === 'IPv4' && !i.internal) out.push(i.address);
      });
    });
  } catch(e){}
  return out;
}

server.listen(PORT, '0.0.0.0', function(){
  const ips = lanIPs();
  const main = ips[0] || '(IP 주소를 찾지 못함 — 네트워크 확인)';
  console.log('═══════════════════════════════════════════');
  console.log(' 온누리 사상체질 진료 서버 — 실행 중');
  console.log('───────────────────────────────────────────');
  console.log(' [원장실 이 PC]   http://localhost:' + PORT);
  console.log(' [접수실/검사실]  http://' + main + ':' + PORT + '/접수실');
  if (ips.length > 1) console.log(' (대체 IP) ' + ips.slice(1).map(function(x){ return 'http://' + x + ':' + PORT + '/접수실'; }).join('  '));
  console.log('───────────────────────────────────────────');
  console.log(' 접속 주소는  접속주소_안내.txt  파일에도 저장됩니다.');
  console.log(' 종료: 이 창을 닫으세요');
  console.log('═══════════════════════════════════════════');
  try {
    fs.writeFileSync(ADDR_FILE,
      '온누리 사상체질 진료 시스템 — 접속 주소\r\n' +
      '(서버를 켤 때마다 자동 갱신됩니다)\r\n\r\n' +
      '■ 원장실 PC (이 컴퓨터):\r\n   http://localhost:' + PORT + '\r\n\r\n' +
      '■ 접수실 / 검사실 PC (자가설문 전용):\r\n   http://' + main + ':' + PORT + '/접수실\r\n' +
      (ips.length > 1
        ? '   (대체 주소: ' + ips.slice(1).map(function(x){ return 'http://' + x + ':' + PORT + '/접수실'; }).join(' , ') + ')\r\n'
        : '') +
      '\r\n※ 접수실 PC 브라우저(크롬·엣지) 주소창에 위 접수실 주소를 입력하세요.\r\n' +
      '※ 두 PC가 같은 공유기(병원 내부망)에 연결돼 있어야 합니다.\r\n' +
      '※ 접속이 안 되면  방화벽_허용.bat  을 원장실 PC에서 한 번 실행하세요.\r\n',
      'utf8');
  } catch(e){}
});
