export interface BoardPost {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  categoryName: string | null;
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

interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

// Cloudflare Workers: KV 바인딩은 process.env로 노출됨 (nodejs_compat)
function getKV(): KVLike | null {
  const kv = (process.env as any)?.DEALS_KV;
  if (kv && typeof kv.get === 'function' && typeof kv.put === 'function') return kv as KVLike;
  return null;
}

// 로컬 개발: 라우트 번들 간에도 공유되는 파일 저장소
const DATA_FILE = '.data/posts.json';

function nodeRequire(name: string): any {
  try {
    if (!process.versions?.node) return null;
    // 번들러(Workers/vinext) 정적 분석 회피
    return eval('require')(name);
  } catch {
    return null;
  }
}

function fileKV(): KVLike | null {
  const fs = nodeRequire('fs');
  const path = nodeRequire('path');
  if (!fs || !path) return null;
  const file = path.join(process.cwd(), DATA_FILE);
  const read = (): Record<string, string> => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      return {};
    }
  };
  return {
    get: async (k: string) => read()[k] ?? null,
    put: async (k: string, v: string) => {
      const all = read();
      all[k] = v;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(all), 'utf-8');
    },
  };
}

// 최후 폴백: 인메모리
const memory = new Map<string, string>();
const memKV: KVLike = {
  get: async (k: string) => memory.get(k) ?? null,
  put: async (k: string, v: string) => {
    memory.set(k, v);
  },
};

let cachedBackend: KVLike | null = null;
function backend(): KVLike {
  if (cachedBackend) return cachedBackend;
  cachedBackend = getKV() ?? fileKV() ?? memKV;
  return cachedBackend;
}

export async function listPosts(): Promise<BoardPost[]> {
  const raw = await backend().get(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BoardPost[];
  } catch {
    return [];
  }
}

export async function getPost(id: string): Promise<BoardPost | null> {
  const raw = await backend().get(`post:${id}`);
  if (raw) {
    try {
      return JSON.parse(raw) as BoardPost;
    } catch {
      /* fall through */
    }
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
  const kv = backend();
  const posts = await listPosts();
  posts.unshift(post);
  const trimmed = posts.slice(0, MAX_POSTS);
  await kv.put(`post:${post.id}`, JSON.stringify(post));
  await kv.put(INDEX_KEY, JSON.stringify(trimmed));
  return post;
}

export async function deletePost(id: string): Promise<boolean> {
  const kv = backend();
  const posts = await listPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  posts.splice(idx, 1);
  await kv.put(INDEX_KEY, JSON.stringify(posts));
  const del = (kv as any).delete;
  if (typeof del === 'function') {
    try {
      await del.call(kv, `post:${id}`);
    } catch {
      /* ignore */
    }
  }
  return true;
}

export async function bumpViews(id: string): Promise<void> {
  const kv = backend();
  const post = await getPost(id);
  if (!post) return;
  post.views = (post.views || 0) + 1;
  const posts = await listPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx >= 0) posts[idx].views = post.views;
  await kv.put(`post:${id}`, JSON.stringify(post));
  await kv.put(INDEX_KEY, JSON.stringify(posts));
}
