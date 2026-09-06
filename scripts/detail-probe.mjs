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
    scope: 'sharelink:read',
  }),
})).json();
const auth = { Authorization: `Bearer ${t.access_token}` };

const idx = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/values/posts:index`, { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } })).json();

const best = new Set();
let cur = null;
for (let p = 0; p < 5; p++) {
  const q = new URLSearchParams({ size: '100' });
  if (cur) q.set('cursor', cur);
  const s = await (await fetch(`https://sharelink.toss.im/openapi/products/best-selling?${q}`, { headers: auth })).json();
  (s.success.items || []).forEach((i) => best.add(Number(i.tacaItemId)));
  if (!s.success.hasNext) break;
  cur = s.success.nextCursor;
}

const off = idx.filter((x) => x.tacaItemId && !best.has(Number(x.tacaItemId)));
console.log('index:', idx.length, '| best:', best.size, '| offBest(검증대상):', off.length);
if (off.length) {
  const ids = off.slice(0, 3).map((x) => x.tacaItemId).join(',');
  const r = await (await fetch(`https://sharelink.toss.im/openapi/products/detail?tacaItemIds=${ids}`, { headers: auth })).json();
  console.log('DETAIL raw:', JSON.stringify(r).slice(0, 800));
}
