'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-[#e3e6eb] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="더파인드핫딜" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xl font-bold">
              더파인드핫딜
            </span>
            <span className="text-[10px] bg-[#f1f2f5] text-gray-500 px-2 py-1 rounded">The Find HotDeal</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs text-gray-600 hover:text-gray-900 border border-[#e3e6eb] px-3 py-1.5 rounded-lg transition"
            >
              관리자
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
