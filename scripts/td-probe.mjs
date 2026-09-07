import { readFileSync } from 'node:fs';

const env = {};
for (const l of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const t = await (await fetch('https://oauth2.cert.toss.im/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.TOSS_ACCESS_KEY, client_secret: env.TOSS_SECRET_KEY, scope: 'sharelink:read' }),
})).json();
const auth = { Authorization: `Bearer ${t.access_token}` };

async function fetchPage(path) {
  const res = await fetch(`https://sharelink.toss.im${path}`, { headers: auth });
  const j = await res.json();
  if (j.resultType !== 'SUCCESS') { console.log('FAIL', path, JSON.stringify(j.error || {})); return null; }
  return j.success || {};
}

// page1: size 큰 값 + 필드 키 확인
const s1 = await fetchPage('/openapi/products/today-deals?size=100');
console.log('PAGE1 items:', s1.items?.length, 'hasNext:', s1.hasNext, 'nextCursor:', s1.nextCursor);
const it = s1.items?.[0] || {};
console.log('ITEM KEYS:', Object.keys(it).join(','));
console.log('SAMPLE:', JSON.stringify(it).slice(0, 500));

// 커서 페이지네이션 되는지
if (s1.nextCursor) {
  const s2 = await fetchPage(`/openapi/products/today-deals?size=100&cursor=${encodeURIComponent(s1.nextCursor)}`);
  console.log('PAGE2 items:', s2.items?.length, 'hasNext:', s2.hasNext);
}

// 중복도: today-deals 첫 3개 이름이 best-selling에도 있는지
const best = await fetchPage('/openapi/products/best-selling?size=100');
const bestNames = new Set((best.items || []).map((i) => String(i.tacaItemId)));
const td = s1.items || [];
console.log('today-deals 총', td.length, '건 중 best에도 있는 tacaItemId:', td.filter((i) => bestNames.has(String(i.tacaItemId))).length, '건');
