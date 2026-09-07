import { readFileSync } from 'node:fs';

const env = {};
for (const l of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const t = await (await fetch('https://oauth2.cert.toss.im/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.TOSS_ACCESS_KEY,
    client_secret: env.TOSS_SECRET_KEY,
    scope: 'sharelink:read sharelink:write',
  }),
})).json();
const auth = { Authorization: `Bearer ${t.access_token}` };

const base = 'https://sharelink.toss.im/openapi';
const candidates = [
  '/products/today',
  '/products/today-special',
  '/products/today-deals',
  '/products/daily',
  '/products/daily-deals',
  '/products/specials',
  '/products/deals',
  '/products/flash',
  '/products/timedeal',
  '/products/time-deal',
  '/products/hot-deal',
  '/products/promotions',
  '/products/recommended',
  '/products/curated',
  '/products/publisher',
  '/products/publisher/deals',
  '/specials',
  '/today',
  '/deals',
  '/deals/today',
  '/products/best-selling?size=3&sort=discount',
];

for (const p of candidates) {
  try {
    const res = await fetch(`${base}${p}`, { headers: auth });
    const txt = await res.text();
    const head = txt.slice(0, 140).replace(/\s+/g, ' ');
    let kind = '';
    try {
      const j = JSON.parse(txt);
      kind = j.resultType ? `resultType=${j.resultType}` : 'json?';
      if (j.success?.items?.length != null) kind += ` items=${j.success.items.length}`;
      if (j.success?.length != null) kind += ` success.len=${j.success.length}`;
    } catch { kind = 'non-json'; }
    console.log(`${res.status}  ${p}\n    ${kind} ${head.slice(0, 90)}`);
  } catch (e) {
    console.log(`ERR ${p}: ${e.message}`);
  }
}

// 검색류 후보 (상품명으로 tacaItemId 찾을 수 있는지)
const searchCands = [
  '/products/search?keyword=베즐리',
  '/products/search?keyword=%EB%B2%A0%EC%A6%90%EB%A6%AC&size=3',
  '/search?keyword=베즐리',
  '/products?keyword=베즐리',
];
for (const p of searchCands) {
  try {
    const res = await fetch(`${base}${p}`, { headers: auth });
    const txt = await res.text();
    let kind = '';
    try {
      const j = JSON.parse(txt);
      kind = j.resultType ? `resultType=${j.resultType}` : 'json?';
      if (j.success?.items?.length != null) kind += ` items=${j.success.items.length}`;
    } catch { kind = 'non-json' + txt.slice(0, 80); }
    console.log(`${res.status}  ${p}\n    ${kind}`);
  } catch (e) {
    console.log(`ERR ${p}: ${e.message}`);
  }
}
