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
        <Link href="/bbs" className="text-sm text-gray-400 hover:text-white transition">
          ← 목록
        </Link>

        <article className="bg-[#12121a] border border-[#1e1e2e] rounded-xl mt-3 overflow-hidden">
          <div className="p-5 border-b border-[#1e1e2e]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-[#1e1e2e] text-gray-400 px-1.5 py-0.5 rounded">
                {post.source}
              </span>
              <span className="text-xs text-gray-500">
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
              {post.price != null && post.price > 0 && (
                <span className="text-2xl font-bold text-red-400">
                  {post.price.toLocaleString()}원
                </span>
              )}
              {post.rating != null && <span className="text-yellow-400">★ {post.rating}</span>}
              {post.reviewCount != null && (
                <span className="text-gray-400">리뷰 {post.reviewCount.toLocaleString()}개</span>
              )}
              {post.categoryName && (
                <span className="text-gray-400">
                  {post.categoryName}
                  {post.rank ? ` ${post.rank}위` : ''}
                </span>
              )}
              {post.arrivalDate && <span className="text-gray-400">📦 {post.arrivalDate} 도착예정</span>}
              {post.merchant && <span className="text-gray-400">{post.merchant}</span>}
            </div>

            {post.description && (
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
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
