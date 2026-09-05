import { kvGet, kvSet } from './store';

const TOKEN_URL = 'https://oauth2.cert.toss.im/token';
const API_BASE = 'https://sharelink.toss.im';
const TOKEN_CACHE_KEY = 'toss:token';

interface TokenCache {
  token: string;
  expiresAt: number;
}

export function tossKeysConfigured(): boolean {
  const id = process.env.TOSS_ACCESS_KEY || '';
  const secret = process.env.TOSS_SECRET_KEY || '';
  return !!id && !!secret && !id.startsWith('여기에') && !id.startsWith('your_');
}

export function tossPublisherId(): string {
  return (process.env.TOSS_PUBLISHER_ID || process.env.TOSS_MEMBER_ID || '').trim();
}

export async function getTossToken(force = false): Promise<string> {
  if (!force) {
    try {
      const cached = await kvGet(TOKEN_CACHE_KEY);
      if (cached) {
        const c = JSON.parse(cached) as TokenCache;
        if (c.token && c.expiresAt > Date.now() + 60_000) return c.token;
      }
    } catch {
      /* cache miss */
    }
  }

  const clientId = (process.env.TOSS_ACCESS_KEY || '').trim();
  const clientSecret = (process.env.TOSS_SECRET_KEY || '').trim();
  if (!clientId || !clientSecret) throw new Error('TOSS_ACCESS_KEY / TOSS_SECRET_KEY 미설정');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'sharelink:read sharelink:write',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`토큰 발급 실패 (${res.status}): ${data.error || 'unknown'}`);
  }
  const expiresAt = Date.now() + Math.max(60, (data.expires_in || 3600) - 300) * 1000;
  try {
    await kvSet(TOKEN_CACHE_KEY, JSON.stringify({ token: data.access_token, expiresAt }));
  } catch {
    /* cache write failure is non-fatal */
  }
  return data.access_token as string;
}

interface TossApiResponse<T> {
  resultType: 'SUCCESS' | 'FAIL';
  success?: T;
  error?: { errorCode?: string; reason?: string };
}

async function tossGet<T>(path: string): Promise<T> {
  const token = await getTossToken();
  const call = async (t: string) =>
    fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${t}` } });
  let res = await call(token);
  if (res.status === 401) res = await call(await getTossToken(true));
  const json = (await res.json()) as TossApiResponse<T>;
  if (!res.ok || json.resultType !== 'SUCCESS') {
    throw new Error(json.error?.reason || json.error?.errorCode || `호출 실패 (${res.status})`);
  }
  return json.success as T;
}

export interface BestSellingItem {
  rank: number;
  tacaItemId: number;
  displayName: string;
  thumbnailUrl: string;
  productUrl: string;
  displayPrice: number | null;
  originalPrice: number | null;
  discountRate: number | null;
  isSoldOut: boolean;
  reviewScore: number | null;
  reviewCount: number | null;
  categoryIds: number[];
}

export interface BestSellingResult {
  items: BestSellingItem[];
  nextCursor?: string | null;
  hasNext?: boolean;
}

export async function fetchBestSelling(size = 20, cursor?: string): Promise<BestSellingResult> {
  const q = new URLSearchParams({ size: String(size) });
  if (cursor) q.set('cursor', cursor);
  return tossGet<BestSellingResult>(`/openapi/products/best-selling?${q.toString()}`);
}

export interface IssuedLink {
  tacaItemId: number;
  publisherId: string;
  shortUrl: string;
  originUrl: string;
}

const linkCacheKey = (itemId: number) => `toss:link:${itemId}`;

export async function createShareLink(tacaItemId: number): Promise<IssuedLink> {
  try {
    const cached = await kvGet(linkCacheKey(tacaItemId));
    if (cached) return JSON.parse(cached) as IssuedLink;
  } catch {
    /* cache miss */
  }
  const publisherId = tossPublisherId();
  if (!publisherId) throw new Error('TOSS_MEMBER_ID(퍼블리셔 UUID) 미설정');

  const token = await getTossToken();
  const call = async (t: string) =>
    fetch(`${API_BASE}/openapi/links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tacaItemId, publisherId }),
    });
  let res = await call(token);
  if (res.status === 401) res = await call(await getTossToken(true));
  const json = (await res.json()) as TossApiResponse<IssuedLink>;
  if (!res.ok || json.resultType !== 'SUCCESS') {
    throw new Error(json.error?.reason || json.error?.errorCode || `링크 발급 실패 (${res.status})`);
  }
  const link = json.success as IssuedLink;
  try {
    await kvSet(linkCacheKey(tacaItemId), JSON.stringify(link));
  } catch {
    /* non-fatal */
  }
  return link;
}

export async function tossHealth(): Promise<unknown> {
  return tossGet<unknown>('/openapi/health');
}
