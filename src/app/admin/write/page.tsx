'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface Preview {
  title: string;
  name: string;
  image: string;
  description: string;
  rating: number | null;
  reviewCount: number | null;
  categoryName: string | null;
  rank: number | null;
  arrivalDate: string | null;
  merchant: string | null;
  source: string;
}

export default function AdminWritePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');
  const [author, setAuthor] = useState('오늘도핫딜');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) router.replace('/admin');
        else setReady(true);
      })
      .catch(() => router.replace('/admin'));
  }, [router]);

  const analyze = async () => {
    setError('');
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/toss/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '분석 실패');
      setPreview(data);
      setManual(false);
    } catch (e: any) {
      setError(e.message);
      setManual(true);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          price: price ? Number(price.replace(/[^0-9]/g, '')) : null,
          author,
          title: manual ? title : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '등록 실패');
      setDone(true);
      setTimeout(() => router.push('/admin'), 800);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
          확인 중...
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">핫딜 등록 (관리자)</h1>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition">
            관리자로
          </Link>
        </div>

        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              토스 쉐어링크 (앱에서 상품 → 공유 → 링크 복사)
            </label>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://toss.im/_m/xxxxxxx"
                className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600"
              />
              <button
                onClick={analyze}
                disabled={!url || loading}
                className="bg-[#1e1e2e] hover:bg-[#2a2a3e] disabled:opacity-50 text-sm px-4 rounded-lg transition shrink-0"
              >
                분석
              </button>
            </div>
          </div>

          {preview && (
            <div className="border border-[#1e1e2e] rounded-xl p-4 flex gap-4 bg-[#0a0a0f]">
              {preview.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.image}
                  alt=""
                  className="w-24 h-24 rounded-lg object-cover bg-[#1e1e2e] shrink-0"
                />
              ) : (
                <span className="w-24 h-24 rounded-lg bg-[#1e1e2e] shrink-0 flex items-center justify-center text-2xl">
                  🛒
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-snug">{preview.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                  {preview.rating != null && (
                    <span className="text-yellow-400">★ {preview.rating}</span>
                  )}
                  {preview.reviewCount != null && (
                    <span>리뷰 {preview.reviewCount.toLocaleString()}</span>
                  )}
                  {preview.categoryName && (
                    <span>
                      {preview.categoryName}
                      {preview.rank ? ` ${preview.rank}위` : ''}
                    </span>
                  )}
                  {preview.arrivalDate && <span>📦 {preview.arrivalDate} 도착예정</span>}
                  {preview.merchant && <span>{preview.merchant}</span>}
                </div>
                <p className="text-[11px] text-gray-600 mt-2">
                  ※ 토스 웹에는 가격이 노출되지 않습니다. 아래에 직접 입력하세요.
                </p>
              </div>
            </div>
          )}

          {manual && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">제목 (직접 입력)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 쿠팡) 써모스 텀블러 350ml"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">가격 (선택)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12,900"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">작성자</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-600/10 border border-red-600/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {done && (
            <p className="text-sm text-green-400 bg-green-600/10 border border-green-600/30 rounded-lg px-3 py-2">
              ✅ 등록 완료! 관리자로 이동합니다...
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading || !url || (manual && !title)}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? '처리 중...' : '핫딜 등록'}
          </button>
        </div>
      </main>
    </>
  );
}
