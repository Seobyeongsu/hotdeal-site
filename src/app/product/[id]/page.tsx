'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceChart from '@/components/PriceChart';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image_url: string;
  current_price: number;
  original_price: number;
  discount_rate: number;
  unit_price: number;
  weight: string;
  protein_per_serving: number;
  serving_size: string;
  url: string;
  min_price: number;
  max_price: number;
  avg_price: number;
}

interface PriceRecord {
  price: number;
  recorded_at: string;
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR');
}

export default function ProductDetail() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3');

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
      fetchPriceHistory(params.id as string, period);
    }
  }, [params.id, period]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${id}`);
      const data = await response.json();
      setProduct(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    }
  };

  const fetchPriceHistory = async (id: string, p: string) => {
    try {
      const response = await fetch(`/api/price-history?productId=${id}&period=${p}`);
      const data = await response.json();
      setPriceHistory(data);
    } catch (error) {
      console.error('Failed to fetch price history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">로딩 중...</div>
        </main>
        <Footer />
      </div>
    );
  }

  const isAtLowest = product.current_price <= product.min_price;
  const pricePosition = ((product.current_price - product.min_price) / (product.max_price - product.min_price)) * 100;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6">
          <div className="flex gap-6">
            <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-5xl">📦</span>
              )}
            </div>

            <div className="flex-1">
              {isAtLowest && (
                <div className="inline-block hot-deal-badge text-white text-xs px-2 py-1 rounded-full font-medium mb-2">
                  🔥 저점도달
                </div>
              )}

              <div className="text-sm text-gray-400 mb-1">
                {product.category} &gt; {product.brand}
              </div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-400 mb-4">{product.serving_size} · {product.weight}</p>

              <div className="flex gap-3 mb-4">
                <button className="flex items-center gap-2 px-4 py-2 border border-[#1e1e2e] rounded-lg hover:bg-[#1e1e2e] transition">
                  <span>🔗</span> 공유
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#1e1e2e] rounded-lg hover:bg-[#1e1e2e] transition">
                  <span>❤️</span> 찜
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">현재가</div>
              <div className="text-3xl font-bold">{formatPrice(product.current_price)}원</div>
              <div className="text-sm text-gray-400 mt-1">
                개당 {formatPrice(product.unit_price)}원
              </div>
              {product.original_price > product.current_price && (
                <div className="mt-2">
                  <span className="text-gray-500 line-through mr-2">
                    {formatPrice(product.original_price)}원
                  </span>
                  <span className="text-red-500 font-medium">
                    (-{product.discount_rate}%) {formatPrice(product.original_price - product.current_price)}원▼
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 가격 위치 표시 */}
          <div className="mt-8">
            <div className="relative h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-black"
                style={{ left: `${pricePosition}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <div className="text-green-500">
                <div>최저점</div>
                <div>{formatPrice(product.min_price)}원</div>
              </div>
              <div className="text-yellow-500">
                <div>평시가</div>
                <div>{formatPrice(product.avg_price)}원</div>
              </div>
              <div className="text-red-500">
                <div>고점</div>
                <div>{formatPrice(product.max_price)}원</div>
              </div>
            </div>
          </div>
        </div>

        {/* 가격 변동 그래프 */}
        <div className="mt-6 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">가격 변동 그래프</h2>
            <div className="text-sm text-gray-400">
              마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {['1', '3', '6', '12'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm ${
                  period === p
                    ? 'bg-white text-black'
                    : 'bg-[#1e1e2e] text-gray-300 hover:bg-[#2a2a3e]'
                }`}
              >
                {p}개월
              </button>
            ))}
          </div>

          <PriceChart
            data={priceHistory}
            currentPrice={product.current_price}
            minPrice={product.min_price}
            maxPrice={product.max_price}
          />
        </div>

        {/* 구매 버튼 */}
        <div className="mt-6 flex gap-4">
          <button className="flex-1 bg-[#1e1e2e] py-4 rounded-xl font-medium hover:bg-[#2a2a3e] transition">
            🔔 저점알림
          </button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-red-600 py-4 rounded-xl font-medium text-center hover:bg-red-700 transition"
          >
            구매하기
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
