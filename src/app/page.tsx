'use client';

import { useState, useEffect } from 'react';
import HotDealCard from '@/components/HotDealCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface HotDeal {
  id: string;
  title: string;
  url: string;
  source: string;
  price: number | null;
  date: string;
  thumbnail: string | null;
}

const sources = ['전체', '쿨앤조이', '퀘이사존', '루리웹', '아카라이브', '다나와'];

export default function Home() {
  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [selectedSource, setSelectedSource] = useState('전체');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, [selectedSource]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSource !== '전체') {
        params.set('source', selectedSource);
      }
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDeals();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* 소스 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {sources.map((source) => (
            <button
              key={source}
              onClick={() => setSelectedSource(source)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedSource === source
                  ? 'bg-white text-black'
                  : 'bg-[#1e1e2e] text-gray-300 hover:bg-[#2a2a3e]'
              }`}
            >
              {source}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="키워드 검색..."
            className="flex-1 bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg px-4 py-2 focus:outline-none focus:border-white"
          />
          <button
            onClick={handleSearch}
            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            검색
          </button>
        </div>

        {/* 핫딜 목록 */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">핫딜 불러오는 중...</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            핫딜이 없습니다.잠시 후 다시 시도해보세요.
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <HotDealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
