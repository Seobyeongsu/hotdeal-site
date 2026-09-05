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

async function probe(name, url) {
  try {
    const res = await fetch(url, { headers: auth });
    const text = await res.text();
    console.log(`\n[${name}] ${res.status}`);
    console.log(text.slice(0, 700));
  } catch (e) {
    console.log(`\n[${name}] EX ${e.message}`);
  }
}

// 1) raw item - all fields
await probe('raw item fields', 'https://sharelink.toss.im/openapi/products/best-selling?size=1');

// 2) category guesses
await probe('categories', 'https://sharelink.toss.im/openapi/categories');
await probe('category list', 'https://sharelink.toss.im/openapi/products/categories');
await probe('best by categoryId', 'https://sharelink.toss.im/openapi/products/best-selling?size=3&categoryId=1');
await probe('best by category', 'https://sharelink.toss.im/openapi/products/best-selling?size=3&category=1');

// 3) lowest price guesses
await probe('lowest30 endpoint', 'https://sharelink.toss.im/openapi/products/lowest-price?size=3');
await probe('lowest-30d endpoint', 'https://sharelink.toss.im/openapi/products/lowest-30-days?size=3');
await probe('best with mode', 'https://sharelink.toss.im/openapi/products/best-selling?size=3&type=lowest');
