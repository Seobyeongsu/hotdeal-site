import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

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
                  <span className="text-2xl font-bold text-red-600">
                    {post.price.toLocaleString()}원
                  </span>
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

            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-lg transition"
            >
              {post.source === '토스' ? '🛒 토스에서 구매하기 (쉐어링크 할인)' : '🛒 구매하기'}
            </a>

            <p className="text-[11px] text-gray-600 text-center">
              이 포스팅은 토스쇼핑 쉐어링크 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
