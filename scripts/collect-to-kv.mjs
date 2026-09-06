import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TOSS_TOKEN_URL = 'https://oauth2.cert.toss.im/token';
const TOSS_API_BASE = 'https://sharelink.toss.im';
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

let _envCache;
function loadEnv() {
  if (_envCache) return _envCache;
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  _envCache = env;
  return env;
}

function log(msg) {
  const ts = new Date().toISOString().slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}

async function sendTelegram(token, chatId, text) {
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    log('텔레그램 발송 완료');
  } catch (e) {
    log(`텔레그램 발송 실패: ${e.message}`);
  }
}

function kvUrl(env, key) {
  return `${CF_API_BASE}/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
}

async function kvGet(key) {
  try {
    const env = loadEnv();
    const res = await fetch(kvUrl(env, key), {
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      log(`  KV get 실패 (${key}): HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    log(`  KV get 오류 (${key}): ${e.message}`);
    return null;
  }
}

async function kvPut(key, value) {
  try {
    const env = loadEnv();
    const body = typeof value === 'string' ? value : JSON.stringify(value);
    const res = await fetch(kvUrl(env, key), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'text/plain; charset=utf-8' },
      body,
    });
    if (!res.ok) {
      log(`  KV put 실패 (${key}): HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    log(`  KV put 오류 (${key}): ${e.message}`);
    return false;
  }
}

async function kvDelete(key) {
  try {
    const env = loadEnv();
    const res = await fetch(kvUrl(env, key), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
    });
    return res.ok;
  } catch (e) {
    log(`  KV delete 오류 (${key}): ${e.message}`);
    return false;
  }
}

async function getTossToken(env) {
  const res = await fetch(TOSS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.TOSS_ACCESS_KEY,
      client_secret: env.TOSS_SECRET_KEY,
      scope: 'sharelink:read sharelink:write',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`토큰 실패 (${res.status}): ${data.error}`);
  return data.access_token;
}

async function fetchBestPage(token, size, cursor) {
  const q = new URLSearchParams({ size: String(size) });
  if (cursor) q.set('cursor', cursor);
  const res = await fetch(`${TOSS_API_BASE}/openapi/products/best-selling?${q.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) throw new Error('ACCESS_DENIED: IP가 화이트리스트에 없습니다');
  const json = await res.json();
  if (json.resultType !== 'SUCCESS') throw new Error(json.error?.reason || '조회 실패');
  return json.success || {};
}

async function fetchAllBest(token, pageSize = 100, maxPages = 5) {
  const all = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page++) {
    const s = await fetchBestPage(token, pageSize, cursor);
    all.push(...(s.items || []));
    if (!s.hasNext || !s.nextCursor) break;
    cursor = s.nextCursor;
  }
  return all;
}

async function fetchDetail(token, tacaItemIds) {
  const q = new URLSearchParams({ tacaItemIds: tacaItemIds.join(',') });
  const res = await fetch(`${TOSS_API_BASE}/openapi/products/detail?${q.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) throw new Error('ACCESS_DENIED: IP가 화이트리스트에 없습니다');
  const json = await res.json();
  if (json.resultType !== 'SUCCESS') throw new Error(json.error?.reason || '상세 조회 실패');
  const s = json.success;
  const list = Array.isArray(s) ? s : (s?.items || s?.products || []);
  const map = new Map();
  for (const it of list) {
    const id = Number(it.tacaItemId ?? it.itemId);
    if (id) map.set(id, it);
  }
  return map;
}

async function cleanupDeadPosts(tossToken, index, bestIds) {
  const ttlDays = Number(loadEnv().POST_TTL_DAYS || 60);
  const ttlCutoff = Date.now() - ttlDays * 86400000;
  const dead = [];
  const toCheck = [];
  let refreshed = 0;

  for (const p of index) {
    if (!p?.id) continue;
    if (p.createdAt && new Date(p.createdAt).getTime() < ttlCutoff) {
      dead.push({ post: p, reason: '만료' });
      continue;
    }
    const tid = Number(p.tacaItemId);
    if (!tid) continue;
    if (bestIds.has(tid)) continue;
    toCheck.push({ post: p, tid });
  }

  const CHUNK = 25;
  for (let i = 0; i < toCheck.length; i += CHUNK) {
    const chunk = toCheck.slice(i, i + CHUNK);
    let map;
    try {
      map = await fetchDetail(tossToken, chunk.map((c) => c.tid));
    } catch (e) {
      log(`  ⚠️ 상세 조회 실패(이번 라운드 검증 생략): ${e.message}`);
      continue;
    }
    for (const { post, tid } of chunk) {
      const d = map.get(tid);
      if (!d) { dead.push({ post, reason: '판매종료' }); continue; }
      if (d.isSoldOut === true) { dead.push({ post, reason: '품절' }); continue; }
      const np = d.displayPrice != null ? Number(d.displayPrice) : null;
      if (np != null && post.price !== np) {
        post.price = np;
        if (d.originalPrice != null) post.originalPrice = Number(d.originalPrice);
        if (d.discountRate != null) post.discountRate = Number(d.discountRate);
        if (d.originalPrice != null && np != null && Number(d.originalPrice) > np) {
          post.merchant = `${Number(d.originalPrice).toLocaleString()}원 →`;
        }
        await kvPut(`post:${post.id}`, post);
        await recordPrice({ tacaItemId: tid, displayPrice: np });
        refreshed++;
      }
    }
  }

  const deadIds = new Set();
  for (const { post, reason } of dead) {
    await kvDelete(`post:${post.id}`);
    if (post.tacaItemId) await kvDelete(`post:taca:${post.tacaItemId}`);
    deadIds.add(post.id);
    log(`  🗑️ [${reason}] ${String(post.title).slice(0, 35)}`);
  }
  return { deadIds, dead, refreshed };
}

async function createShareLink(token, tacaItemId, publisherId) {
  const res = await fetch(`${TOSS_API_BASE}/openapi/links`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tacaItemId, publisherId }),
  });
  const json = await res.json();
  if (json.resultType !== 'SUCCESS') throw new Error(json.error?.reason || '링크 발급 실패');
  return json.success;
}

async function recordPrice(item) {
  const tacaId = item?.tacaItemId;
  const price = item.displayPrice != null ? Number(item.displayPrice) : null;
  if (!tacaId || price == null) return;
  const key = `toss:ph:${tacaId}`;
  let history = [];
  const raw = await kvGet(key);
  try { if (raw) history = JSON.parse(raw); } catch {}
  const today = new Date().toISOString().slice(0, 10);
  const last = history[history.length - 1];
  if (last && last.d === today) last.p = price;
  else if (!last || last.p !== price) history.push({ d: today, p: price });
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  history = history.filter((h) => new Date(h.d).getTime() >= cutoff).slice(-30);
  if (history.length) await kvPut(key, history);
}

async function main() {
  const env = loadEnv();
  const tgToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!env.CF_KV_NAMESPACE_ID || !env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    const msg = '❌ .env.local에 CF_KV_NAMESPACE_ID / CF_API_TOKEN / CF_ACCOUNT_ID 필요';
    log(msg);
    await sendTelegram(tgToken, chatId, msg);
    process.exit(1);
  }

  log('🚀 토스 핫딜 수집 시작');

  let tossToken;
  try {
    tossToken = await getTossToken(env);
    log('✅ 토스 토큰 발급');
  } catch (e) {
    const msg = `❌ 토스 토큰 실패: ${e.message}`;
    log(msg);
    await sendTelegram(tgToken, chatId, msg);
    process.exit(1);
  }

  let items;
  try {
    items = await fetchAllBest(tossToken);
    log(`✅ 베스트 상품 ${items.length}개 조회 (전체 페이지)`);
  } catch (e) {
    if (e.message.includes('ACCESS_DENIED') || e.message.includes('접근 권한')) {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipRes.json();
      const msg = `🚫 <b>IP 변경 감지!</b>\n현재 IP: <code>${ip}</code>\n토스 어드민에서 새 IP를 등록해주세요.`;
      log(msg.replace(/<[^>]+>/g, ''));
      await sendTelegram(tgToken, chatId, msg);
    } else {
      const msg = `❌ 베스트 조회 실패: ${e.message}`;
      log(msg);
      await sendTelegram(tgToken, chatId, msg);
    }
    process.exit(1);
  }

  const publisherId = env.TOSS_PUBLISHER_ID || env.TOSS_MEMBER_ID;

  let indexRaw = await kvGet('posts:index');
  let index = [];
  try {
    const parsed = JSON.parse(indexRaw || '[]');
    index = Array.isArray(parsed) ? parsed : [];
  } catch { index = []; }

  const bestIds = new Set(items.map((i) => Number(i.tacaItemId)).filter(Boolean));
  let removed = [];
  let refreshed = 0;
  try {
    const res = await cleanupDeadPosts(tossToken, index, bestIds);
    removed = res.dead;
    refreshed = res.refreshed;
    if (res.deadIds.size) index = index.filter((p) => !res.deadIds.has(p.id));
  } catch (e) {
    log(`  ⚠️ 정리 단계 실패(건너뜀): ${e.message}`);
  }

  let created = 0;
  let skipped = 0;
  let linkFailed = 0;

  for (const item of items) {
    try {
      if (!item.tacaItemId || !item.displayName) continue;

      await recordPrice(item);

      const existing = await kvGet(`post:taca:${item.tacaItemId}`);
      if (existing) { skipped++; continue; }

      let shortUrl = '';
      try {
        const link = await createShareLink(tossToken, item.tacaItemId, publisherId);
        shortUrl = link.shortUrl || '';
      } catch (e) {
        linkFailed++;
        continue;
      }

      const postId = `toss-${item.tacaItemId}`;
      const post = {
        id: postId,
        title: `토스) ${item.displayName}`,
        description: '',
        image: item.thumbnailUrl || '',
        url: shortUrl,
        price: item.displayPrice != null ? Number(item.displayPrice) : null,
        originalPrice: item.originalPrice != null ? Number(item.originalPrice) : null,
        discountRate: item.discountRate != null ? Number(item.discountRate) : null,
        rating: item.reviewScore != null ? Number(item.reviewScore) : null,
        reviewCount: item.reviewCount != null ? Number(item.reviewCount) : null,
        categoryName: null,
        rank: item.rank != null ? Number(item.rank) : null,
        arrivalDate: null,
        merchant: item.originalPrice && item.displayPrice && item.originalPrice > item.displayPrice
          ? `${Number(item.originalPrice).toLocaleString()}원 →` : null,
        source: '토스',
        tacaItemId: Number(item.tacaItemId),
        author: '자동수집',
        createdAt: new Date().toISOString(),
        views: 0,
      };

      await kvPut(`post:${postId}`, post);
      await kvPut(`post:taca:${item.tacaItemId}`, '1');
      index = index.filter((p) => p.id !== postId);
      index.unshift(post);
      created++;
      log(`  ✅ ${item.displayName.slice(0, 30)}... ${item.displayPrice}원`);
    } catch (e) {
      log(`  ⚠️ ${item.displayName}: ${e.message}`);
      linkFailed++;
    }
  }

  index = index.slice(0, 500);
  await kvPut('posts:index', index);
  log(`✅ KV 저장 완료 (인덱스 ${index.length}건)`);

  const rmCounts = {};
  for (const r of removed) rmCounts[r.reason] = (rmCounts[r.reason] || 0) + 1;
  const rmInfo = removed.length
    ? `🗑️ 삭제: ${removed.length}건 (${Object.entries(rmCounts).map(([k, v]) => `${k} ${v}`).join(', ')})\n`
    : '';
  const rfInfo = refreshed ? `🔄 가격갱신: ${refreshed}건\n` : '';
  const summary = `✅ <b>수집 완료</b>\n\n📊 신규: ${created}건\n⏭️ 기존: ${skipped}건\n❌ 링크실패: ${linkFailed}건\n${rmInfo}${rfInfo}📦 총 ${items.length}건 조회`;
  log(summary.replace(/<[^>]+>/g, ''));
  await sendTelegram(tgToken, chatId, summary);
}

main().catch((e) => {
  log(`💀 치명적 오류: ${e.message}`);
  process.exit(1);
});
