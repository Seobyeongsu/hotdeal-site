'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Post {
  id: string;
  title: string;
  author: string;
  source: string;
  price: number | null;
  createdAt: string;
  views: number;
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = useCallback(async () => {
    const res = await fetch('/api/posts');
    if (res.ok) setPosts(await res.json());
  }, []);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((d) => {
        setOk(!!d.ok);
        if (d.ok) loadPosts();
      })
      .catch(() => setOk(false))
      .finally(() => setChecking(false));
  }, [loadPosts]);

  const login = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '로그인 실패');
      setOk(true);
      setPassword('');
      loadPosts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setOk(false);
    setPosts([]);
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`삭제할까요?\n\n${title}`)) return;
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    else alert('삭제 실패 (다시 로그인하세요)');
  };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        {checking ? (
          <p className="text-center text-gray-500 py-16">확인 중...</p>
        ) : !ok ? (
          <div className="max-w-sm mx-auto mt-16">
            <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🔒</span> 관리자 로그인
            </h1>
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password && login()}
                placeholder="관리자 비밀번호"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600"
              />
              {error && (
                <p className="text-sm text-red-400 bg-red-600/10 border border-red-600/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                onClick={login}
                disabled={busy || !password}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
              >
                {busy ? '확인 중...' : '로그인'}
              </button>
              <p className="text-[11px] text-gray-600">
                비밀번호 변경: 서버 환경변수 <code className="text-gray-400">ADMIN_PASSWORD</code>
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span className="text-red-500">⚙️</span> 관리자 · 글 관리
              </h1>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/write"
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  + 핫딜 등록
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-gray-400 hover:text-white border border-[#1e1e2e] px-3 py-2 rounded-lg transition"
                >
                  로그아웃
                </button>
              </div>
            </div>

            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
              {posts.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="text-4xl mb-3">📭</p>
                  <p>등록된 핫딜이 없습니다. 우측 상단 &lsquo;+ 핫딜 등록&rsquo;으로 추가하세요.</p>
                </div>
              ) : (
                <ul>
                  {posts.map((post, i) => (
                    <li
                      key={post.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2e] last:border-b-0 hover:bg-[#1e1e2e]/50"
                    >
                      <span className="text-xs font-mono text-gray-500 w-8 shrink-0">
                        {posts.length - i}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/bbs/${post.id}`}
                          className="text-sm truncate block hover:text-red-400 transition"
                        >
                          {post.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {post.author} ・ {new Date(post.createdAt).toLocaleString()} ・ 조회{' '}
                          {post.views}
                        </p>
                      </div>
                      {post.price != null && post.price > 0 && (
                        <span className="text-sm font-bold text-red-400 shrink-0">
                          {post.price.toLocaleString()}원
                        </span>
                      )}
                      <span className="text-[10px] bg-[#1e1e2e] text-gray-400 px-1.5 py-0.5 rounded shrink-0">
                        {post.source}
                      </span>
                      <button
                        onClick={() => remove(post.id, post.title)}
                        className="text-xs text-gray-500 hover:text-red-400 border border-[#1e1e2e] hover:border-red-600/50 px-2 py-1 rounded shrink-0 transition"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
