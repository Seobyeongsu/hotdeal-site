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

interface BestItem {
  rank: number;
  tacaItemId: number;
  displayName: string;
  thumbnailUrl: string;
  displayPrice: number | null;
  originalPrice: number | null;
  discountRate: number | null;
  isSoldOut: boolean;
  reviewScore: number | null;
  reviewCount: number | null;
}

export default function AdminWritePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [bestItems, setBestItems] = useState<BestItem[]>([]);
  const [bestCursor, setBestCursor] = useState<string | null>(null);
  const [bestLoading, setBestLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importMsg, setImportMsg] = useState('');
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

  const loadBest = async (cursor?: string | null) => {
    setBestLoading(true);
    setImportMsg('');
    try {
      const res = await fetch(`/api/toss-api/best?size=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '조회 실패');
      setBestItems((prev) => (cursor ? [...prev, ...(data.items || [])] : data.items || []));
      setBestCursor(data.nextCursor || null);
    } catch (e: any) {
      setImportMsg(`❌ ${e.message}`);
    } finally {
      setBestLoading(false);
    }
  };

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const importSelected = async () => {
    const items = bestItems.filter((i) => selected.has(i.tacaItemId));
    if (items.length === 0) return;
    setBestLoading(true);
    setImportMsg('');
    try {
      const res = await fetch('/api/toss-api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, author }),
      });
      const data = await res.json();
      if (!res.ok && !data.created?.length) throw new Error(data.error || '등록 실패');
      const failNote = data.failed?.length ? ` / 실패 ${data.failed.length}건: ${data.failed[0].reason}` : '';
      setImportMsg(`✅ ${data.created.length}개 등록 완료 (쉐어링크 자동 발급)${failNote}`);
      setSelected(new Set());
    } catch (e: any) {
      setImportMsg(`❌ ${e.message}`);
    } finally {
      setBestLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const m = text.match(/https?:\/\/toss\.im\/\S+/);
    if (m) {
      e.preventDefault();
      setUrl(m[0]);
      const nameLine = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .find(
          (l) =>
            l &&
            !l.startsWith('http') &&
            !l.startsWith('✱') &&
            !l.startsWith('[') &&
            !l.includes('쉐어링크') &&
            !l.includes('쿠폰') &&
            !l.includes('할인'),
        );
      if (nameLine && !title) setTitle(nameLine);
      analyze(m[0]);
    }
  };

  const analyze = async (linkArg?: string) => {
    const src = linkArg || url;
    const m = src.match(/https?:\/\/\S+/);
    const link = m ? m[0] : src;
    if (link !== url) setUrl(link);
    setError('');
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/toss/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link }),
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
    const m = url.match(/https?:\/\/\S+/);
    const link = m ? m[0] : url;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: link,
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

        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span>🔥</span> 토스 베스트 자동불러오기
              <span className="text-[10px] font-normal text-gray-500">가격·링크까지 완전 자동</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => loadBest()}
                disabled={bestLoading}
                className="bg-[#1e1e2e] hover:bg-[#2a2a3e] disabled:opacity-50 text-xs px-3 py-1.5 rounded-lg transition"
              >
                {bestLoading ? '불러오는 중...' : '베스트 20개 불러오기'}
              </button>
              {bestItems.length > 0 && (
                <button
                  onClick={importSelected}
                  disabled={bestLoading || selected.size === 0}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  선택 {selected.size}개 등록
                </button>
              )}
            </div>
          </div>

          {bestItems.length > 0 && (
            <div className="mt-3 max-h-80 overflow-y-auto border border-[#1e1e2e] rounded-lg divide-y divide-[#1e1e2e]">
              {bestItems.map((item) => (
                <label
                  key={item.tacaItemId}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-[#1e1e2e]/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.tacaItemId)}
                    onChange={() => toggleItem(item.tacaItemId)}
                    className="accent-red-600 shrink-0"
                  />
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" className="w-9 h-9 rounded object-cover bg-[#1e1e2e] shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded bg-[#1e1e2e] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{item.displayName}</p>
                    <p className="text-[10px] text-gray-500">
                      #{item.rank}
                      {item.reviewScore != null && <> · ★{item.reviewScore}</>}
                      {item.reviewCount != null && <> · 리뷰 {item.reviewCount.toLocaleString()}</>}
                      {item.isSoldOut && <span className="text-gray-600"> · 품절</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.discountRate ? (
                      <span className="text-[10px] text-red-400 font-bold">{item.discountRate}%</span>
                    ) : null}
                    <p className="text-xs font-bold text-red-400">
                      {item.displayPrice != null ? `${item.displayPrice.toLocaleString()}원` : '-'}
                    </p>
                  </div>
                </label>
              ))}
              {bestCursor && (
                <button
                  onClick={() => loadBest(bestCursor)}
                  disabled={bestLoading}
                  className="w-full py-2 text-xs text-gray-400 hover:text-white hover:bg-[#1e1e2e] transition"
                >
                  + 더 불러오기
                </button>
              )}
            </div>
          )}

          {importMsg && (
            <p className="text-xs mt-2 text-gray-300 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2">
              {importMsg}
            </p>
          )}
        </div>

        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              토스 쉐어링크 (복사한 내용 전체를 붙여넣으면 자동 분석)
            </label>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => e.key === 'Enter' && url && analyze()}
                placeholder="https://toss.im/_m/xxxxxxx (문구 전체 붙여넣기 가능)"
                className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600"
              />
              <button
                onClick={() => analyze()}
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
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  setPrice(digits ? Number(digits).toLocaleString('ko-KR') : '');
                }}
                inputMode="numeric"
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
