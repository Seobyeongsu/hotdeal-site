import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

function loadEnv() {
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const nsId = loadEnv().CF_KV_NAMESPACE_ID;

function kvGet(key) {
  try {
    const out = execSync(
      `npx wrangler kv key get --namespace-id ${nsId} --remote "${key}"`,
      { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (!out || out.includes('Value not found') || out.includes('not found')) return null;
    return out;
  } catch { return null; }
}

function kvPut(key, value) {
  const json = typeof value === 'string' ? value : JSON.stringify(value);
  const tmpFile = join(process.cwd(), '.data', '_kv_tmp.json');
  try {
    writeFileSync(tmpFile, json, 'utf-8');
    execSync(
      `npx wrangler kv key put --namespace-id ${nsId} --remote "${key}" --path "${tmpFile}"`,
      { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return true;
  } catch (e) {
    console.log(`put 실패 (${key}): ${e.message?.slice(0, 100)}`);
    return false;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

const indexRaw = kvGet('posts:index');
let ids = [];
try { ids = JSON.parse(indexRaw || '[]'); } catch { ids = []; }
if (typeof ids[0] === 'object') {
  console.log(`이미 객체 배열 형식: ${ids.length}건`);
  process.exit(0);
}
console.log(`ID 배열 ${ids.length}건 → 객체 배열 변환 중...`);
const posts = [];
for (const id of ids) {
  const raw = kvGet(`post:${id}`);
  if (!raw) continue;
  try { posts.push(JSON.parse(raw)); } catch { console.log(`파싱 실패: ${id}`); }
}
console.log(`객체 ${posts.length}건 로드. posts:index 재작성 중...`);
kvPut('posts:index', posts);
console.log('완료!');
