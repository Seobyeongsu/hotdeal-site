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
  price?: number | null;
  originalPrice?: number | null;
  discountRate?: number | null;
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
  categoryName: string | null;
  alreadyRegistered: boolean;
  lowest30d: number | null;
  historyDays: number;
  isLowestNow: boolean;
}

export default function AdminWritePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [bestItems, setBestItems] = useState<BestItem[]>([]);
  const [bestCursor, setBestCursor] = useState<string | null>(null);
  const [bestLoading, setBestLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [catFilter, setCatFilter] = useState('전체');
  const [dealFilter, setDealFilter] = useState('전체');
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

  const loadAllBest = async () => {
    setBestLoading(true);
    setImportMsg('');
    try {
      const all: BestItem[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < 10; page++) {
        const res = await fetch(`/api/toss-api/best?size=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '조회 실패');
        all.push(...(data.items || []));
        if (!data.hasNext || !data.nextCursor) break;
        cursor = data.nextCursor;
      }
      setBestItems(all);
      setBestCursor(null);
      setImportMsg(`✅ 전체 ${all.length}개 불러옴`);
    } catch (e: any) {
      setImportMsg(`❌ ${e.message}`);
    } finally {
      setBestLoading(false);
    }
  };

  const selectableItems = bestItems.filter((i) => !i.alreadyRegistered);
  const visibleItems = bestItems.filter((i) => {
    if (catFilter !== '전체' && i.categoryName !== catFilter) return false;
    if (dealFilter === '할인 30%+' && !(i.discountRate != null && i.discountRate >= 30)) return false;
    if (dealFilter === '할인 50%+' && !(i.discountRate != null && i.discountRate >= 50)) return false;
    if (dealFilter === '30일 최저가만' && !(i.isLowestNow && i.historyDays >= 2)) return false;
    return true;
  });
  const visibleSelectable = visibleItems.filter((i) => !i.alreadyRegistered);
  const categories = ['전체', ...Array.from(new Set(bestItems.map((i) => i.categoryName).filter(Boolean) as string[]))];

  const selectAll = () => {
    setSelected((prev) =>
      prev.size === visibleSelectable.length ? new Set() : new Set(visibleSelectable.map((i) => i.tacaItemId))
    );
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
      let createdTotal = 0;
      let skippedTotal = 0;
      const failedAll: { tacaItemId: number; reason: string }[] = [];
      for (let i = 0; i < items.length; i += 30) {
        const chunk = items.slice(i, i + 30);
        setImportMsg(`등록 중... ${createdTotal}/${items.length} (30개씩 자동 분할)`);
        const res = await fetch('/api/toss-api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk, author }),
        });
        const data = await res.json();
        if (!res.ok && !data.created?.length) throw new Error(data.error || '등록 실패');
        createdTotal += data.created?.length || 0;
        skippedTotal += data.skipped?.length || 0;
        if (data.failed?.length) failedAll.push(...data.failed);
      }
      const failNote = failedAll.length ? ` / 실패 ${failedAll.length}건: ${failedAll[0].reason}` : '';
      const skipNote = skippedTotal ? ` / 이미 등록 ${skippedTotal}건 건너뜀` : '';
      setImportMsg(`✅ ${createdTotal}개 등록 완료 (쉐어링크 자동 발급)${skipNote}${failNote}`);
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
      if (data.price != null) {
        setPrice(Number(data.price).toLocaleString('ko-KR'));
      }
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
                베스트 20개
              </button>
              <button
                onClick={loadAllBest}
                disabled={bestLoading}
                className="bg-[#1e1e2e] hover:bg-[#2a2a3e] disabled:opacity-50 text-xs px-3 py-1.5 rounded-lg transition"
              >
                전부 불러오기
              </button>
              {bestItems.length > 0 && (
                <button
                  onClick={selectAll}
                  className="bg-[#1e1e2e] hover:bg-[#2a2a3e] text-xs px-3 py-1.5 rounded-lg transition"
                >
                  {selected.size === selectableItems.length ? '선택 해제' : '전체 선택'}
                </button>
              )}
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
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-gray-500">카테고리</span>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs px-2 py-1.5 outline-none focus:border-red-600"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-500">
                {visibleItems.length}개 표시
                {bestItems.some((i) => i.alreadyRegistered) &&
                  ` · 이미 등록 ${bestItems.filter((i) => i.alreadyRegistered).length}개 제외됨`}
              </span>
            </div>
          )}

          {bestItems.length > 0 && (
            <div className="mt-3 max-h-[32rem] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {visibleItems.map((item) => (
                  <label
                    key={item.tacaItemId}
                    className={`relative block rounded-xl overflow-hidden border transition ${
                      item.alreadyRegistered
                        ? 'opacity-40 cursor-not-allowed border-[#1e1e2e]'
                        : selected.has(item.tacaItemId)
                          ? 'border-red-600 ring-1 ring-red-600/30'
                          : 'border-[#1e1e2e] hover:border-gray-600 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.tacaItemId)}
                      onChange={() => toggleItem(item.tacaItemId)}
                      disabled={item.alreadyRegistered}
                      className="absolute top-1.5 left-1.5 z-10 accent-red-600 w-4 h-4"
                    />
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-full aspect-square object-cover bg-[#1e1e2e]"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-[#1e1e2e] flex items-center justify-center text-2xl">
                        🛒
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      <p className="text-[11px] leading-tight line-clamp-2 min-h-[2.5em]">
                        {item.displayName}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.discountRate ? (
                          <span className="text-[10px] text-red-400 font-bold">{item.discountRate}%</span>
                        ) : null}
                        <span className="text-xs font-bold text-red-400">
                          {item.displayPrice != null ? `${item.displayPrice.toLocaleString()}원` : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.alreadyRegistered ? (
                          <span className="text-[9px] bg-[#1e1e2e] text-gray-400 px-1 py-0.5 rounded">등록됨</span>
                        ) : item.isLowestNow && item.historyDays >= 2 ? (
                          <span className="text-[9px] bg-green-600/20 text-green-400 font-bold px-1 py-0.5 rounded">
                            30일최저
                          </span>
                        ) : null}
                        {item.reviewScore != null && (
                          <span className="text-[9px] text-yellow-400">★{item.reviewScore}</span>
                        )}
                        {item.categoryName && (
                          <span className="text-[9px] text-gray-500 truncate">{item.categoryName}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {bestCursor && (
                <button
                  onClick={() => loadBest(bestCursor)}
                  disabled={bestLoading}
                  className="w-full py-2 text-xs text-gray-400 hover:text-white hover:bg-[#1e1e2e] mt-2 rounded-lg transition"
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
                {preview.price != null ? (
                  <p className="text-xs mt-2 text-green-400 font-semibold">
                    ✅ 가격 자동 인식: {Number(preview.price).toLocaleString()}원
                    {preview.discountRate ? ` (할인 ${preview.discountRate}%)` : ''}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-600 mt-2">
                    ※ 가격을 찾지 못했습니다. 아래에 직접 입력하세요.
                  </p>
                )}
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
