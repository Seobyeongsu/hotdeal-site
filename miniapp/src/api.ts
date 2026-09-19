import type { BoardPost } from './types';

const BASE = import.meta.env.VITE_API_BASE ?? '';

export async function fetchPosts(): Promise<BoardPost[]> {
  const res = await fetch(`${BASE}/api/posts`);
  if (!res.ok) throw new Error(`API 응답 오류 (${res.status})`);
  const data = await res.json();
  if (Array.isArray(data)) return data as BoardPost[];
  if (Array.isArray(data?.posts)) return data.posts as BoardPost[];
  return [];
}
