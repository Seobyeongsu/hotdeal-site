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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const allPosts = await listPosts();
  const cats = Array.from(new Set(allPosts.map((p) => p.categoryName).filter(Boolean) as string[]));
  const activeCat = cat && cats.includes(cat) ? cat : '전체';
  const posts = activeCat === '전체' ? allPosts : allPosts.filter((p) => p.categoryName === activeCat);

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="text-red-500">🔥</span> 핫딜게시판
          </h1>
          <span className="text-xs text-gray-600">총 {posts.length}개</span>
        </div>

        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['전체', ...cats].map((c) => (
              <Link
                key={c}
                href={c === '전체' ? '/' : `/?cat=${encodeURIComponent(c)}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  activeCat === c
                    ? 'bg-red-600 border-red-600 text-white font-semibold'
                    : 'bg-[#12121a] border-[#1e1e2e] text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {posts.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500">
              <p className="text-4xl mb-3">📭</p>
              <p>아직 등록된 핫딜이 없습니다.</p>
              <p className="text-sm mt-1">새 핫딜이 올라오면 가장 먼저 확인하세요!</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <Link
                key={post.id}
                href={`/bbs/${post.id}`}
                className="block rounded-xl border border-[#1e1e2e] hover:border-gray-600 overflow-hidden transition bg-[#12121a]"
              >
                {post.image ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image}
                      alt=""
                      className="w-full aspect-square object-cover bg-[#1e1e2e]"
                    />
                    {post.discountRate != null && post.discountRate > 0 && (
                      <span className="absolute top-0 left-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-lg">
                        {post.discountRate}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-[#1e1e2e] flex items-center justify-center text-3xl">
                    🛒
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5em]">
                    {post.title}
                  </p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {post.price != null && post.price > 0 && (
                      <span className="text-sm font-bold text-red-400">
                        {post.price.toLocaleString()}원
                      </span>
                    )}
                    {post.originalPrice != null && post.price != null && post.originalPrice > post.price && (
                      <span className="text-[11px] text-gray-500 line-through">
                        {post.originalPrice.toLocaleString()}
                      </span>
                    )}
                    {Date.now() - new Date(post.createdAt).getTime() < 24 * 3600 * 1000 && (
                      <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-semibold">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <span className="bg-[#1e1e2e] text-gray-400 px-1 py-0.5 rounded">{post.source}</span>
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
