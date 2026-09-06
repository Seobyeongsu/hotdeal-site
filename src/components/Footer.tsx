import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#e3e6eb] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="더파인드핫딜" className="w-6 h-6 rounded object-cover" />
            <span className="font-bold">더파인드핫딜</span>
            <span className="text-sm text-gray-600">The Find HotDeal</span>
          </div>

          <nav className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition">핫딜게시판</Link>
          </nav>

          <p className="text-xs text-gray-600">
            © 2026 더파인드핫딜. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
