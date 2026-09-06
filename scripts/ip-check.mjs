import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), '.data');
const IP_FILE = join(DATA_DIR, 'last-ip.json');
const CHECK_URL = 'https://api.ipify.org?format=json';
const TOSS_TOKEN_URL = 'https://oauth2.cert.toss.im/token';
const TOSS_HEALTH_URL = 'https://sharelink.toss.im/openapi/health';

function getKeys() {
  const raw = readFileSync('.env.local', 'utf-8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return { accessKey: env.TOSS_ACCESS_KEY || '', secretKey: env.TOSS_SECRET_KEY || '' };
}

async function getCurrentIP() {
  const res = await fetch(CHECK_URL);
  const data = await res.json();
  return data.ip;
}

async function getTossToken(accessKey, secretKey) {
  const res = await fetch(TOSS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: accessKey,
      client_secret: secretKey,
      scope: 'sharelink:read',
    }),
  });
  const data = await res.json();
  return data.access_token || '';
}

async function checkTossAccess(token) {
  try {
    const res = await fetch(TOSS_HEALTH_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return { ok: res.ok && data.resultType === 'SUCCESS', status: res.status, detail: JSON.stringify(data) };
  } catch (e) {
    return { ok: false, status: 0, detail: e.message };
  }
}

function loadLastIP() {
  if (!existsSync(IP_FILE)) return null;
  try { return JSON.parse(readFileSync(IP_FILE, 'utf-8')).ip; } catch { return null; }
}

function saveLastIP(ip) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(IP_FILE, JSON.stringify({ ip, checkedAt: new Date().toISOString() }));
}

async function main() {
  const { accessKey, secretKey } = getKeys();
  if (!accessKey || accessKey.startsWith('여기에')) {
    console.log('❌ .env.local에 TOSS_ACCESS_KEY 미설정');
    process.exit(1);
  }

  const currentIP = await getCurrentIP();
  const lastIP = loadLastIP();

  console.log(`\n🔍 현재 공인 IP: ${currentIP}`);
  if (lastIP) console.log(`📋 이전 IP: ${lastIP} (${lastIP === currentIP ? '변경 없음 ✓' : '⚠️ IP 변경됨!'})`);

  const token = await getTossToken(accessKey, secretKey);
  if (!token) {
    console.log('❌ 토큰 발급 실패');
    process.exit(1);
  }

  const health = await checkTossAccess(token);
  if (health.ok) {
    console.log(`✅ 토스 API 연결 정상 (IP ${currentIP} 허용됨)`);
  } else {
    console.log(`\n🚫 토스 API 접근 차단!`);
    console.log(`   원인: IP ${currentIP}가 화이트리스트에 없음`);
    console.log(`\n   📌 해결:`);
    console.log(`   1. 토스 쉐어링크 어드민 접속`);
    console.log(`   2. 설정 → 출발 IP 관리`);
    console.log(`   3. "${currentIP}" 추가`);
  }

  saveLastIP(currentIP);
}

main().catch((e) => { console.error('오류:', e.message); process.exit(1); });
