import { readFileSync } from 'node:fs';

const env = {};
for (const l of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const base = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/values/`;
const H = { Authorization: `Bearer ${env.CF_API_TOKEN}` };

async function kvGet(key) {
  const r = await fetch(base + encodeURIComponent(key), { headers: H });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${key}`);
  return await r.text();
}

const raw = await kvGet('posts:index');
console.log('index raw len:', raw?.length);
let idx;
try { idx = JSON.parse(raw); console.log('parsed OK, items:', Array.isArray(idx) ? idx.length : 'NOT ARRAY'); }
catch (e) { console.log('PARSE FAIL:', e.message.slice(0, 200)); process.exit(1); }
if (Array.isArray(idx)) {
  const types = {};
  const nulls = {};
  for (const p of idx) {
    for (const k of ['id', 'title', 'price', 'originalPrice', 'discountRate', 'categoryName', 'todayDeal', 'endAt', 'soldOut', 'url', 'image', 'createdAt', 'rank', 'source']) {
      if (p[k] === null || p[k] === undefined) nulls[k] = (nulls[k] || 0) + 1;
      else if (k !== 'id') {
        const t = Array.isArray(p[k]) ? 'array' : typeof p[k];
        types[k] = types[k] || {};
        types[k][t] = (types[k][t] || 0) + 1;
      }
    }
  }
  console.log('null counts:', JSON.stringify(nulls));
  console.log('types:', JSON.stringify(types));
  const noTitle = idx.filter((p) => !p?.title).length;
  const noId = idx.filter((p) => !p?.id).length;
  const noPrice = idx.filter((p) => p?.price == null && p?.url).length;
  console.log('noTitle:', noTitle, 'noId:', noId, 'noPrice:', noPrice);
  console.log('sample keys:', Object.keys(idx[0] || {}).join(','));
  const dups = idx.length - new Set(idx.map((p) => p?.id)).size;
  console.log('dup ids:', dups);
}
