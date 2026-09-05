'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-[#12121a] border-b border-[#1e1e2e] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">💪</span>
            <span className="text-xl font-bold">
              핫딜 리딩방
            </span>
            <span className="text-xs bg-[#1e1e2e] px-2 py-1 rounded">핫딜 모니터</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              <Link href="/" className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1e1e2e] transition">
                홈
              </Link>
              <Link href="/bbs" className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1e1e2e] transition">
                게시판
              </Link>
            </nav>
            <Link
              href="/admin"
              className="hidden sm:block text-xs text-gray-500 hover:text-white border border-[#1e1e2e] px-3 py-1.5 rounded-lg transition"
            >
              관리자
            </Link>
            <button className="p-2 hover:bg-[#1e1e2e] rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-[#1e1e2e] rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
