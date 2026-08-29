export default function Footer() {
  return (
    <footer className="bg-[#12121a] border-t border-[#1e1e2e] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span>💪</span>
            <span className="font-bold">핫딜 리딩방</span>
            <span className="text-sm text-gray-500">핫딜 모니터</span>
          </div>

          <nav className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition">홈</a>
            <a href="#" className="hover:text-white transition">카테고리</a>
            <a href="#" className="hover:text-white transition">랭킹</a>
            <a href="#" className="hover:text-white transition">핫딜</a>
          </nav>

          <p className="text-xs text-gray-500">
            © 2026 핫딜 리딩방. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
