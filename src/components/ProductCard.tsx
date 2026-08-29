'use client';

import Link from 'next/link';

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
  min_price: number;
  max_price: number;
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR');
}

export default function ProductCard({ product }: { product: Product }) {
  const isAtLowest = product.current_price <= product.min_price;
  const priceDiff = product.original_price - product.current_price;

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 card-hover cursor-pointer relative">
        {isAtLowest && (
          <div className="absolute top-3 right-3 hot-deal-badge text-white text-xs px-2 py-1 rounded-full font-medium">
            🔥 저점도달
          </div>
        )}

        <div className="flex gap-4">
          <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-400">{product.brand}</p>
            <h3 className="font-medium truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{product.weight}</p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-sm text-gray-400">
              {formatPrice(product.unit_price)}원 / 개당
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatPrice(product.current_price)}원
            </div>
            {priceDiff > 0 && (
              <div className="text-sm">
                <span className="text-gray-400 line-through mr-2">
                  {formatPrice(product.original_price)}원
                </span>
                <span className="text-red-500">
                  (-{product.discount_rate}%) {formatPrice(priceDiff)}원▼
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            className="text-xs border border-[#1e1e2e] px-3 py-1 rounded-lg hover:bg-[#1e1e2e] transition flex items-center gap-1"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <span>🔍</span> 비교담기
          </button>
        </div>
      </div>
    </Link>
  );
}
