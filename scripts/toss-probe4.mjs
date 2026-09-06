import { readFileSync } from 'fs';

const env = {};
for (const line of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const tokenRes = await fetch('https://oauth2.cert.toss.im/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.TOSS_ACCESS_KEY,
    client_secret: env.TOSS_SECRET_KEY,
    scope: 'sharelink:read sharelink:write',
  }),
});
const { access_token } = await tokenRes.json();
const auth = { Authorization: `Bearer ${access_token}` };

async function probe(name, url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, headers: { ...auth, ...(opts.headers || {}) } });
    const text = await res.text();
    console.log(`[${name}] ${res.status} ${text.slice(0, 260)}`);
  } catch (e) {
    console.log(`[${name}] EX ${e.message}`);
  }
}

// 1) 상품 단건 조회 엔드포인트 추정
await probe('GET products/135260245', 'https://sharelink.toss.im/openapi/products/135260245');
await probe('GET products/item/135260245', 'https://sharelink.toss.im/openapi/products/item/135260245');
await probe('GET products/detail?id=', 'https://sharelink.toss.im/openapi/products/detail?tacaItemId=135260245');

// 2) 오늘만 특가 엔드포인트 추정
await probe('GET today-deal', 'https://sharelink.toss.im/openapi/products/today-deal?size=3');
await probe('GET today-special', 'https://sharelink.toss.im/openapi/products/today-special?size=3');
await probe('GET deals/today', 'https://sharelink.toss.im/openapi/deals/today?size=3');
await probe('GET best type=today', 'https://sharelink.toss.im/openapi/products/best-selling?size=3&type=todayDeal');

// 3) 상품 페이지 flight에서 tacaItemId / 오늘만특가 문자열 확인
const page = await (await fetch('https://toss.shopping/t/187174093', {
  headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
})).text();
for (const kw of ['tacaItemId', '오늘만', 'todayDeal', 'dealType', 'TIME_LIMIT', 'flash']) {
  const i = page.indexOf(kw);
  console.log(`page "${kw}": ${i >= 0 ? 'FOUND ' + JSON.stringify(page.slice(Math.max(0, i - 40), i + 90)) : 'none'}`);
}
