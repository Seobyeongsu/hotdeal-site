import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export interface BoardPost {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;
  price: number | null;
  originalPrice: number | null;
  discountRate: number | null;
  rating: number | null;
  reviewCount: number | null;
  categoryName: string | null;
  tacaItemId?: number | null;
  rank: number | null;
  arrivalDate: string | null;
  merchant: string | null;
  source: string;
  soldOut?: boolean | null;
  todayDeal?: boolean | null;
  endAt?: string | null;
  author: string;
  createdAt: string;
  views: number;
}

const INDEX_KEY = 'posts:index';
const MAX_POSTS = 500;
const DATA_FILE = '.data/posts.json';

function getDataPath(): string {
  const root = process.env.PROJECT_ROOT || process.cwd();
  const file = join(root, DATA_FILE);
  try { mkdirSync(dirname(file), { recursive: true }); } catch {}
  return file;
}

let _fileLoaded = false;
let _fileStore: Record<string, string> = {};
function readAll(): Record<string, string> {
  if (_fileLoaded) return _fileStore;
  try { _fileStore = JSON.parse(readFileSync(getDataPath(), 'utf-8')); } catch { _fileStore = {}; }
  _fileLoaded = true;
  return _fileStore;
}

function writeAll(data: Record<string, string>) {
  _fileStore = data;
  try { writeFileSync(getDataPath(), JSON.stringify(data), 'utf-8'); } catch {}
}

let _cfEnv: any = null;
let _cfEnvTried = false;
async function kvBinding(): Promise<any> {
  if (!_cfEnvTried) {
    _cfEnvTried = true;
    try {
      const mod = await import('cloudflare:workers');
      _cfEnv = mod.env ?? null;
    } catch {
      _cfEnv = null;
    }
  }
  return _cfEnv?.DEALS_KV ?? null;
}

export async function kvGet(key: string): Promise<string | null> {
  const kv = await kvBinding();
  if (kv?.get) return (await kv.get(key)) as string | null;
  return readAll()[key] ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const kv = await kvBinding();
  if (kv?.put) { await kv.put(key, value); return; }
  const all = readAll();
  all[key] = value;
  writeAll(all);
}

export async function kvDelete(key: string): Promise<void> {
  const kv = await kvBinding();
  if (kv?.delete) { await kv.delete(key); return; }
  const all = readAll();
  delete all[key];
  writeAll(all);
}

export async function kvList(prefix: string): Promise<string[]> {
  const kv = await kvBinding();
  if (kv?.list) {
    const result = await kv.list({ prefix });
    return result.keys?.map((k: any) => k.name) || [];
  }
  return Object.keys(readAll()).filter(k => k.startsWith(prefix));
}

export async function listPosts(): Promise<BoardPost[]> {
  const raw = await kvGet(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return [];
      const first = parsed[0];
      if (typeof first === 'string') {
        // ID 배열 형식 (collect-to-kv가 저장한 형태): post:{id} 상세 조회
        const posts: BoardPost[] = [];
        for (const id of parsed as string[]) {
          const detail = await getPost(id);
          if (detail) posts.push(detail);
        }
        return posts;
      }
      return parsed as BoardPost[];
    }
    return [];
  } catch { return []; }
}

export async function getPost(id: string): Promise<BoardPost | null> {
  const raw = await kvGet(`post:${id}`);
  if (raw) {
    try { return JSON.parse(raw) as BoardPost; } catch { /* fall through */ }
  }
  const posts = await listPosts();
  return posts.find((p) => p.id === id) ?? null;
}

export async function addPost(data: Omit<BoardPost, 'id' | 'createdAt' | 'views'>): Promise<BoardPost> {
  const post: BoardPost = {
    ...data,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    views: 0,
  };
  let posts: BoardPost[] = [];
  const raw = await kvGet(INDEX_KEY);
  try { posts = JSON.parse(raw || '[]'); } catch { /* empty */ }
  posts.unshift(post);
  await kvSet(`post:${post.id}`, JSON.stringify(post));
  await kvSet(INDEX_KEY, JSON.stringify(posts.slice(0, MAX_POSTS)));
  return post;
}

export async function deletePost(id: string): Promise<boolean> {
  let posts: BoardPost[] = [];
  const raw = await kvGet(INDEX_KEY);
  try { posts = JSON.parse(raw || '[]'); } catch { return false; }
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  posts.splice(idx, 1);
  await kvSet(INDEX_KEY, JSON.stringify(posts));
  await kvDelete(`post:${id}`);
  return true;
}

export async function bumpViews(id: string): Promise<void> {
  let posts: BoardPost[] = [];
  const raw = await kvGet(INDEX_KEY);
  try { posts = JSON.parse(raw || '[]'); } catch { return; }
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return;
  posts[idx].views = (posts[idx].views || 0) + 1;
  const postRaw = await kvGet(`post:${id}`);
  if (postRaw) {
    try { const p = JSON.parse(postRaw); p.views = posts[idx].views; await kvSet(`post:${id}`, JSON.stringify(p)); } catch {}
  }
  await kvSet(INDEX_KEY, JSON.stringify(posts));
}

export { kvGet as kvGetCloudflare, kvSet as kvSetCloudflare };
