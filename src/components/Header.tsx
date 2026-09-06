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
            <Link
              href="/admin"
              className="text-xs text-gray-500 hover:text-white border border-[#1e1e2e] px-3 py-1.5 rounded-lg transition"
            >
              관리자
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
