import { readFileSync } from 'fs';

const raw = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const id = env.TOSS_ACCESS_KEY || '';
const secret = env.TOSS_SECRET_KEY || '';
const member = env.TOSS_MEMBER_ID || '';

const show = (label, v) => {
  const codes = Array.from(v).map((c) => c.charCodeAt(0));
  const nonAscii = codes.filter((c) => c > 126);
  console.log(`${label}: len=${v.length} head="${v.slice(0, 3)}" tail="${v.slice(-2)}" nonAscii=${nonAscii.length ? nonAscii.join(',') : 'none'}`);
};
show('ACCESS', id);
show('SECRET', secret);
show('MEMBER', member);

async function tryToken(name, url, opts) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log(`\n[${name}] -> ${res.status} ${text.slice(0, 300)}`);
    return res.ok ? JSON.parse(text) : null;
  } catch (e) {
    console.log(`\n[${name}] EX ${e.message}`);
    return null;
  }
}

const form = (extra = {}) =>
  new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret, ...extra });

let t = await tryToken('form read+write', 'https://oauth2.cert.toss.im/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: form({ scope: 'sharelink:read sharelink:write' }),
});
if (!t)
  t = await tryToken('form read only', 'https://oauth2.cert.toss.im/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({ scope: 'sharelink:read' }),
  });
if (!t)
  t = await tryToken('form no scope', 'https://oauth2.cert.toss.im/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form(),
  });
if (!t)
  t = await tryToken('basic auth', 'https://oauth2.cert.toss.im/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: form({ scope: 'sharelink:read sharelink:write' }),
  });
if (!t)
  t = await tryToken('swapped id/secret', 'https://oauth2.cert.toss.im/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: secret, client_secret: id, scope: 'sharelink:read sharelink:write' }),
  });

if (t?.access_token) {
  console.log('\nTOKEN OK, expires_in=', t.expires_in);
  const auth = { Authorization: `Bearer ${t.access_token}` };
  const h = await fetch('https://sharelink.toss.im/openapi/health', { headers: auth });
  console.log('HEALTH:', h.status, (await h.text()).slice(0, 200));
  const b = await fetch('https://sharelink.toss.im/openapi/products/best-selling?size=3', { headers: auth });
  const bj = await b.json();
  console.log('BEST:', b.status, bj.resultType, bj.error ? JSON.stringify(bj.error).slice(0, 200) : '');
  if (bj.success?.items) for (const it of bj.success.items) console.log(`  #${it.rank} ${it.displayPrice}원 ${String(it.displayName).slice(0, 35)}`);
}
