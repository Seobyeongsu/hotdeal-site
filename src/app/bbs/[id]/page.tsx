import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/store';
import { getPriceBadge } from '@/lib/toss-api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductActions from '@/components/ProductActions';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  const badge = await getPriceBadge(post.tacaItemId, post.price);

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/bbs" className="text-sm text-gray-500 hover:text-gray-900 transition">
          ← 목록
        </Link>

        <article className="bg-white border border-[#e3e6eb] rounded-xl mt-3 overflow-hidden">
          <div className="p-5 border-b border-[#e3e6eb]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-[#f1f2f5] text-gray-500 px-1.5 py-0.5 rounded">
                {post.source}
              </span>
              <span className="text-xs text-gray-600">
                {post.author} ・ {new Date(post.createdAt).toLocaleString('ko-KR')} ・ 조회 {post.views}
              </span>
            </div>
            <h1 className="text-lg font-bold leading-snug">{post.title}</h1>
          </div>

          {post.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image} alt="" className="w-full max-h-[420px] object-contain bg-white" />
          )}

          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {post.discountRate != null && post.discountRate > 0 && (
                <span className="bg-red-600 text-white text-sm font-bold px-2.5 py-1 rounded-lg self-center">
                  {post.discountRate}% <span className="text-[10px] font-normal opacity-90">OFF</span>
                </span>
              )}
              {post.price != null && post.price > 0 && (
                <div className="leading-tight">
                  {post.originalPrice != null && post.originalPrice > post.price && (
                    <p className="text-sm text-gray-600 line-through">
                      {post.originalPrice.toLocaleString()}원
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-red-600">
                      {post.price.toLocaleString()}원
                    </span>
                    {badge?.isLowestNow && (
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        30일 최저가
                      </span>
                    )}
                  </div>
                  {badge && !badge.isLowestNow && (
                    <p className="text-xs text-green-700 mt-0.5">
                      📉 30일 최저가 {badge.lowest30.toLocaleString()}원
                    </p>
                  )}
                </div>
              )}
              {post.rating != null && <span className="text-yellow-400">★ {post.rating}</span>}
              {post.reviewCount != null && (
                <span className="text-gray-500">리뷰 {post.reviewCount.toLocaleString()}개</span>
              )}
              {post.categoryName && (
                <span className="text-gray-500">
                  {post.categoryName}
                  {post.rank ? ` ${post.rank}위` : ''}
                </span>
              )}
              {post.arrivalDate && <span className="text-gray-500">📦 {post.arrivalDate} 도착예정</span>}
            </div>

            {post.description && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.description}
              </p>
            )}

            <ProductActions url={post.url} source={post.source} title={post.title} />

            {post.source === '토스' && (
              <p className="text-[11px] text-gray-600 text-center">
                이 콘텐츠는 토스쇼핑 쉐어링크 활동의 일환으로, 링크를 통한 구매가 발생하면 일정 수수료를
                지급받습니다.
              </p>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
