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
const token = await tokenRes.json();
console.log('TOKEN status:', tokenRes.status, token.token_type ? 'OK expires_in=' + token.expires_in : JSON.stringify(token));
if (!token.access_token) process.exit(1);

const auth = { Authorization: `Bearer ${token.access_token}` };

const health = await fetch('https://sharelink.toss.im/openapi/health', { headers: auth });
console.log('HEALTH:', health.status, JSON.stringify(await health.json()));

const best = await fetch('https://sharelink.toss.im/openapi/products/best-selling?size=5', { headers: auth });
const bestJson = await best.json();
console.log('BEST status:', best.status, 'resultType:', bestJson.resultType);
if (bestJson.success?.items) {
  for (const it of bestJson.success.items) {
    console.log(`  #${it.rank} tacaItemId=${it.tacaItemId} price=${it.displayPrice} (${it.discountRate}%) ${String(it.displayName).slice(0, 40)}`);
  }
} else {
  console.log(JSON.stringify(bestJson).slice(0, 500));
}
