import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TOSS_TOKEN_URL = 'https://oauth2.cert.toss.im/token';
const TOSS_API_BASE = 'https://sharelink.toss.im';
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

function loadEnv() {
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
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
    log(`텔레그램 발송 완료`);
  } catch (e) {
    log(`텔레그램 발송 실패: ${e.message}`);
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

async function fetchBestSelling(token, size = 30) {
  const res = await fetch(`${TOSS_API_BASE}/openapi/products/best-selling?size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) {
    throw new Error('ACCESS_DENIED: IP가 화이트리스트에 없습니다');
  }
  const json = await res.json();
  if (json.resultType !== 'SUCCESS') throw new Error(json.error?.reason || '조회 실패');
  return json.success?.items || [];
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

async function cfKVGet(env, key) {
  const res = await fetch(
    `${CF_API_BASE}/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } }
  );
  if (!res.ok) return null;
  return await res.text();
}

async function cfKVPut(env, key, value) {
  const res = await fetch(
    `${CF_API_BASE}/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'text/plain' },
      body: typeof value === 'string' ? value : JSON.stringify(value),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
}

async function cfKVBulkPut(env, items) {
  if (items.length === 0) return;
  const res = await fetch(
    `${CF_API_BASE}/accounts/${env.CF_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}/bulk`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(items.map(({ key, value }) => ({ key, value: JSON.stringify(value) }))),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
}

async function main() {
  const env = loadEnv();
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID || !env.CF_KV_NAMESPACE_ID) {
    const msg = '❌ Cloudflare 설정 미완료 (.env.local에 CF_API_TOKEN/CF_ACCOUNT_ID/CF_KV_NAMESPACE_ID 필요)';
    log(msg);
    await sendTelegram(token, chatId, msg);
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
    await sendTelegram(token, chatId, msg);
    process.exit(1);
  }

  let items;
  try {
    items = await fetchBestSelling(tossToken, 30);
    log(`✅ 베스트 상품 ${items.length}개 조회`);
  } catch (e) {
    if (e.message.includes('ACCESS_DENIED')) {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipRes.json();
      const msg = `🚫 <b>IP 변경 감지!</b>\n\n현재 IP: <code>${ip}</code>\n토스 어드민에서 새 IP를 등록해주세요.\n\n(이 알림은 IP가 복구되면 자동으로 사라집니다)`;
      log(msg.replace(/<[^>]+>/g, ''));
      await sendTelegram(token, chatId, msg);
    } else {
      const msg = `❌ 베스트 조회 실패: ${e.message}`;
      log(msg);
      await sendTelegram(token, chatId, msg);
    }
    process.exit(1);
  }

  const publisherId = env.TOSS_PUBLISHER_ID || env.TOSS_MEMBER_ID;
  const bulkItems = [];
  let created = 0;
  let skipped = 0;
  let linkFailed = 0;

  for (const item of items) {
    try {
      if (!item.tacaItemId || !item.displayName) continue;

      const existingPost = await cfKVGet(env, `post:taca:${item.tacaItemId}`);
      if (existingPost) { skipped++; continue; }

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

      bulkItems.push({ key: `post:${postId}`, value: post });
      bulkItems.push({ key: `post:taca:${item.tacaItemId}`, value: '1' });
      created++;
    } catch (e) {
      log(`  ⚠️ ${item.displayName}: ${e.message}`);
      linkFailed++;
    }
  }

  if (bulkItems.length > 0) {
    try {
      await cfKVBulkPut(env, bulkItems);
      log(`✅ KV 저장 완료 (${bulkItems.length}개 키)`);
    } catch (e) {
      const msg = `❌ KV 저장 실패: ${e.message}`;
      log(msg);
      await sendTelegram(token, chatId, msg);
      process.exit(1);
    }
  }

  const indexKey = 'posts:index';
  let index = [];
  try {
    const raw = await cfKVGet(env, indexKey);
    if (raw) index = JSON.parse(raw);
  } catch {}

  const newIds = bulkItems.filter(i => i.key.startsWith('post:toss-')).map(i => i.key.replace('post:', ''));
  index = [...new Set([...newIds, ...index])].slice(0, 500);
  await cfKVPut(env, indexKey, index);

  const summary = `✅ <b>수집 완료</b>\n\n📊 신규: ${created}건\n⏭️ 기존: ${skipped}건\n❌ 링크실패: ${linkFailed}건\n📦 총 ${items.length}건 조회`;
  log(summary.replace(/<[^>]+>/g, ''));
  await sendTelegram(token, chatId, summary);
}

main().catch((e) => {
  log(`💀 치명적 오류: ${e.message}`);
  process.exit(1);
});
