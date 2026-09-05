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

// 1) 카테고리 필터 실검증: 14817(가구/홈데코) level1 id로 조회
const byCat = await (await fetch('https://sharelink.toss.im/openapi/products/best-selling?size=3&categoryId=14817', { headers: auth })).json();
console.log('categoryId=14817 결과:');
for (const it of byCat.success?.items || []) console.log(`  #${it.rank} ${it.displayName.slice(0, 35)} cats=${JSON.stringify(it.categoryIds)}`);

// 2) 전체 카테고리 트리에서 item categoryIds 존재 여부
const tree = await (await fetch('https://sharelink.toss.im/openapi/categories', { headers: auth })).json();
const flat = new Map();
(function walk(nodes) {
  for (const n of nodes || []) {
    flat.set(n.categoryId, `${'  '.repeat(n.level - 1)}L${n.level} ${n.displayName}`);
    walk(n.children);
  }
})(tree.success?.categories || []);
console.log('\n카테고리 트리 총', flat.size, '개 노드');
console.log('L1 목록:', (tree.success?.categories || []).map((c) => c.displayName).join(', '));
for (const id of [50995, 27481, 27503, 27627, 27641]) {
  console.log(`  item cat ${id}:`, flat.has(id) ? flat.get(id) : '트리에 없음');
}

// 3) 상품 페이지에 30일최저가 데이터 있는지
const page = await (await fetch('https://toss.shopping/t/187174093', {
  headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
})).text();
for (const kw of ['최저', 'lowest', '30일', 'lowestPrice', 'priceHistory', 'averagePrice']) {
  const idx = page.indexOf(kw);
  console.log(`\n"${kw}": ${idx >= 0 ? 'FOUND' : 'none'}`);
  if (idx >= 0) console.log('  ...' + JSON.stringify(page.slice(Math.max(0, idx - 60), idx + 120)));
}
