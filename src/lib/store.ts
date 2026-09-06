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
  mkdirSync(dirname(file), { recursive: true });
  return file;
}

function readAll(): Record<string, string> {
  try { return JSON.parse(readFileSync(getDataPath(), 'utf-8')); } catch { return {}; }
}

function writeAll(data: Record<string, string>) {
  writeFileSync(getDataPath(), JSON.stringify(data), 'utf-8');
}

export async function kvGet(key: string): Promise<string | null> {
  return readAll()[key] ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  const all = readAll();
  all[key] = value;
  writeAll(all);
}

export async function listPosts(): Promise<BoardPost[]> {
  const raw = readAll()[INDEX_KEY];
  if (!raw) return [];
  try { return JSON.parse(raw) as BoardPost[]; } catch { return []; }
}

export async function getPost(id: string): Promise<BoardPost | null> {
  const raw = readAll()[`post:${id}`];
  if (raw) {
    try { return JSON.parse(raw) as BoardPost[] extends (infer U)[] ? U : never; } catch { /* fall through */ }
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
  const all = readAll();
  let posts: BoardPost[] = [];
  try { posts = JSON.parse(all[INDEX_KEY] || '[]'); } catch { /* empty */ }
  posts.unshift(post);
  all[`post:${post.id}`] = JSON.stringify(post);
  all[INDEX_KEY] = JSON.stringify(posts.slice(0, MAX_POSTS));
  writeAll(all);
  return post;
}

export async function deletePost(id: string): Promise<boolean> {
  const all = readAll();
  let posts: BoardPost[] = [];
  try { posts = JSON.parse(all[INDEX_KEY] || '[]'); } catch { return false; }
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  posts.splice(idx, 1);
  all[INDEX_KEY] = JSON.stringify(posts);
  delete all[`post:${id}`];
  writeAll(all);
  return true;
}

export async function bumpViews(id: string): Promise<void> {
  const all = readAll();
  let posts: BoardPost[] = [];
  try { posts = JSON.parse(all[INDEX_KEY] || '[]'); } catch { return; }
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return;
  posts[idx].views = (posts[idx].views || 0) + 1;
  const raw = all[`post:${id}`];
  if (raw) {
    try { const p = JSON.parse(raw); p.views = posts[idx].views; all[`post:${id}`] = JSON.stringify(p); } catch { /* ok */ }
  }
  all[INDEX_KEY] = JSON.stringify(posts);
  writeAll(all);
}

// Cloudflare Workers KV 바인딩
export async function kvGetCloudflare(key: string): Promise<string | null> {
  const kv = (process.env as any)?.DEALS_KV;
  if (kv?.get) return (await kv.get(key)) as string | null;
  return kvGet(key);
}

export async function kvSetCloudflare(key: string, value: string): Promise<void> {
  const kv = (process.env as any)?.DEALS_KV;
  if (kv?.put) { await kv.put(key, value); return; }
  return kvSet(key, value);
}
