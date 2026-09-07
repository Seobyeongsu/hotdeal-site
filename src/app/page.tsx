import Link from 'next/link';
import { listPosts } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간`;
  return `${Math.floor(hr / 24)}일`;
}

function isNew(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 24 * 3600 * 1000;
}

function untilLabel(endAt?: string | null): string {
  if (!endAt) return '';
  const ms = new Date(endAt).getTime() - Date.now();
  if (ms <= 0) return '';
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}분`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간`;
  return `${Math.floor(hr / 24)}일`;
}

const SORT_KEYS = ['discount', 'review', 'rating'] as const;

function sortPosts<T extends { discountRate: number | null; reviewCount: number | null; rating: number | null }>(
  posts: T[],
  sort: string | undefined,
): T[] {
  if (!sort) return posts;
  const [key, dir] = sort.split(':');
  if (!SORT_KEYS.includes(key as (typeof SORT_KEYS)[number])) return posts;
  const mul = dir === 'asc' ? 1 : -1;
  const val = (p: T) =>
    key === 'discount' ? p.discountRate : key === 'review' ? p.reviewCount : p.rating;
  return [...posts].sort((a, b) => {
    const av = val(a);
    const bv = val(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av - bv) * mul;
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; sort?: string; q?: string }>;
}) {
  const { cat, sort, q } = await searchParams;
  const activeSort = sort && /^[a-z]+:(asc|desc)$/.test(sort) ? sort : '';
  const activeQ = (q || '').trim();
  const allPosts = await listPosts();
  const cats = Array.from(new Set(allPosts.map((p) => p.categoryName).filter(Boolean) as string[]));
  const isTodayTab = cat === '오늘의 특가';
  const activeCat = isTodayTab || cats.includes((cat as string) || '') ? (cat as string) : '전체';
  const liveToday = (p: { todayDeal?: boolean | null; endAt?: string | null }) =>
    p.todayDeal === true && (!p.endAt || new Date(p.endAt).getTime() > Date.now());
  const hasToday = allPosts.some(liveToday);
  const scoped = isTodayTab
    ? allPosts.filter(liveToday)
    : activeCat === '전체'
      ? activeQ
        ? allPosts
        : allPosts.filter((p) => !liveToday(p))
      : allPosts.filter((p) => p.categoryName === activeCat && !liveToday(p));
  const basePosts = scoped.filter((p) => !activeQ || p.title.toLowerCase().includes(activeQ.toLowerCase()));
  const endMs = (p: { endAt?: string | null }) =>
    p.endAt ? new Date(p.endAt).getTime() : Number.MAX_SAFE_INTEGER;
  const posts = isTodayTab && !activeSort
    ? [...basePosts].sort((a, b) => endMs(a) - endMs(b))
    : sortPosts(basePosts, activeSort);
  const href = (c: string, s: string) => {
    const q = new URLSearchParams();
    if (c !== '전체') q.set('cat', c);
    if (s) q.set('sort', s);
    if (activeQ) q.set('q', activeQ);
    const qs = q.toString();
    return qs ? `/?${qs}` : '/';
  };
  const hrefNoQ = (c: string, s: string) => {
    const p = new URLSearchParams();
    if (c !== '전체') p.set('cat', c);
    if (s) p.set('sort', s);
    const qs = p.toString();
    return qs ? `/?${qs}` : '/';
  };
  const featuredPosts = [...allPosts]
    .filter((post) => post.price != null && post.price > 0 && !liveToday(post))
    .sort((a, b) => {
      const discountDiff = (b.discountRate ?? 0) - (a.discountRate ?? 0);
      return discountDiff || (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 3);

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeCat === '전체' && !activeQ && featuredPosts.length > 0 && (
          <section className="mb-7">
            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <p className="text-xs font-semibold text-red-600 mb-1">TODAY&apos;S PICK</p>
                <h1 className="text-xl font-bold tracking-tight">오늘의 핫딜</h1>
              </div>
              <p className="text-xs text-gray-500 text-right">할인율과 판매가를 기준으로 골랐어요</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {featuredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/bbs/${post.id}`}
                  className="group flex gap-3 rounded-xl border border-[#e3e6eb] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md sm:block"
                >
                  <div className="relative w-20 shrink-0 overflow-hidden rounded-lg bg-[#f1f2f5] sm:w-full">
                    {post.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image} alt="" className="h-20 w-full object-cover sm:h-auto sm:aspect-[4/3]" />
                    ) : (
                      <div className="flex h-20 items-center justify-center text-2xl sm:h-auto sm:aspect-[4/3]">🛒</div>
                    )}
                    <span className="absolute left-0 top-0 bg-red-600 px-1.5 py-1 text-[10px] font-bold text-white rounded-br-lg">
                      PICK {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5 sm:pt-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-red-700">{post.title}</p>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {post.discountRate != null && post.discountRate > 0 && (
                        <span className="text-xs font-bold text-red-600">{post.discountRate}%</span>
                      )}
                      <span className="text-sm font-bold text-gray-900">{post.price.toLocaleString()}원</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">{post.source}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <form method="GET" action="/" className="mb-4 flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={activeQ}
            placeholder="상품 검색 (예: 화장지, 계란, 티셔츠)"
            className="flex-1 bg-white border border-[#e3e6eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
          />
          {activeCat !== '전체' && <input type="hidden" name="cat" value={activeCat} />}
          {activeSort && <input type="hidden" name="sort" value={activeSort} />}
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            검색
          </button>
          {activeQ && (
            <a href={hrefNoQ(activeCat, activeSort)} className="self-center text-xs text-gray-500 hover:text-gray-900 px-2">
              취소
            </a>
          )}
        </form>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {activeQ
              ? `'${activeQ}' 검색 결과`
              : activeCat === '오늘의 특가'
                ? '오늘의 특가'
                : activeCat === '전체'
                  ? '전체 핫딜'
                  : activeCat}
          </h2>
          <span className="text-xs text-gray-600">총 {posts.length}개</span>
        </div>

        {(cats.length > 0 || hasToday) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(['전체', ...(hasToday ? ['오늘의 특가'] : []), ...cats] as string[]).map((c) => (
              <Link
                key={c}
                href={href(c, activeSort)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  activeCat === c
                    ? 'bg-red-600 border-red-600 text-white font-semibold'
                    : 'bg-white border-[#e3e6eb] text-gray-500 hover:border-gray-500 hover:text-gray-900'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4 items-center">
          <span className="text-[10px] text-gray-500 font-semibold mr-0.5">정렬</span>
          <Link
            href={href(activeCat, '')}
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              !activeSort
                ? 'bg-gray-900 border-gray-900 text-white font-semibold'
                : 'bg-white border-[#e3e6eb] text-gray-500 hover:border-gray-500 hover:text-gray-900'
            }`}
          >
            최신순
          </Link>
          {SORT_KEYS.map((k) => {
            const isOn = activeSort.startsWith(`${k}:`);
            const dir = activeSort === `${k}:desc` ? 'desc' : 'asc';
            const next = isOn ? `${k}:${dir === 'desc' ? 'asc' : 'desc'}` : `${k}:desc`;
            const label = k === 'discount' ? '할인율' : k === 'review' ? '리뷰' : '별점';
            return (
              <Link
                key={k}
                href={href(activeCat, next)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  isOn
                    ? 'bg-gray-900 border-gray-900 text-white font-semibold'
                    : 'bg-white border-[#e3e6eb] text-gray-500 hover:border-gray-500 hover:text-gray-900'
                }`}
              >
                {label} {isOn ? (dir === 'desc' ? '↓' : '↑') : ''}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {posts.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-600">
              <p className="text-4xl mb-3">📭</p>
              <p>아직 등록된 핫딜이 없습니다.</p>
              <p className="text-sm mt-1">새 핫딜이 올라오면 가장 먼저 확인하세요!</p>
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/bbs/${post.id}`}
                className="block rounded-xl border border-[#e3e6eb] hover:border-gray-400 overflow-hidden transition bg-white"
              >
                {post.image ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image}
                      alt=""
                      className="w-full aspect-square object-cover bg-[#f1f2f5]"
                    />
                    {post.discountRate != null && post.discountRate > 0 && (
                      <span className="absolute top-0 left-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-lg">
                        {post.discountRate}%
                      </span>
                    )}
                    {post.todayDeal && untilLabel(post.endAt) && (
                      <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-1 rounded-bl-lg shadow-lg">
                        ⏰ 오늘특가 {untilLabel(post.endAt)}
                      </span>
                    )}
                    {post.soldOut && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                        <span className="border-2 border-white text-white text-base font-bold px-4 py-1.5 rounded-full tracking-widest">
                          품절
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-[#f1f2f5] flex items-center justify-center text-3xl">
                    🛒
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5em]">
                    {post.title}
                  </p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {post.price != null && post.price > 0 && (
                      <span className="text-sm font-bold text-red-600">
                        {post.price.toLocaleString()}원
                      </span>
                    )}
                    {post.originalPrice != null && post.price != null && post.originalPrice > post.price && (
                      <span className="text-[11px] text-gray-600 line-through">
                        {post.originalPrice.toLocaleString()}
                      </span>
                    )}
                    {isNew(post.createdAt) && (
                      <span className="text-[10px] bg-red-600/20 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-600">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <span className="bg-[#f1f2f5] text-gray-500 px-1 py-0.5 rounded">{post.source}</span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
