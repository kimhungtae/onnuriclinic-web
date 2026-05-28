/* byeonjeung_map.json 의 변증 배열을 모듈 E HTML 의
   "__BYEONJEUNG_DATA__" 자리표시자에 임베드한다.
   실행:  node embed_byeonjeung.js   (data 폴더에서)  */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const HTML = path.join(DIR, '..', '온누리_처방추천_E_v1.html');
const map = JSON.parse(fs.readFileSync(path.join(DIR, 'byeonjeung_map.json'), 'utf8'));

let html = fs.readFileSync(HTML, 'utf8');
const placeholder = '"__BYEONJEUNG_DATA__"';
if (html.indexOf(placeholder) < 0) {
  console.error('자리표시자를 찾을 수 없음 — 이미 임베드되었거나 HTML이 변경됨.');
  process.exit(1);
}
const data = JSON.stringify(map.byeonjeung);
html = html.replace(placeholder, data);
fs.writeFileSync(HTML, html, 'utf8');
console.log('임베드 완료: 변증', map.byeonjeung.length, '항목 ·', data.length, 'bytes');
