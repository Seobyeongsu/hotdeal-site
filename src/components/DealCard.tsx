'use client';

interface HotDeal {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  originalPrice: number;
  discountRate: number;
  url: string;
  source: string;
  rating: number;
  reviewCount: number;
}

function formatPrice(price: number) {
  return Math.round(price).toLocaleString('ko-KR');
}

function getSourceColor(source: string) {
  switch (source) {
    case '쿠팡':
      return 'bg-orange-600';
    case '알리익스프레스':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
}

export default function DealCard({ deal }: { deal: HotDeal }) {
  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden card-hover"
    >
      {/* 이미지 */}
      <div className="aspect-square bg-white flex items-center justify-center relative">
        {deal.image ? (
          <img
            src={deal.image}
            alt={deal.name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <span className="text-5xl">📦</span>
        )}

        {deal.discountRate > 0 && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            {deal.discountRate}% OFF
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded ${getSourceColor(deal.source)}`}>
            {deal.source}
          </span>
          <span className="text-xs text-gray-500 truncate">{deal.brand}</span>
        </div>

        <h3 className="text-sm font-medium text-white line-clamp-2 mb-2 h-10">
          {deal.name}
        </h3>

        <div className="flex items-end gap-2">
          <div className="text-lg font-bold text-white">
            {formatPrice(deal.price)}원
          </div>
          {deal.originalPrice > deal.price && (
            <div className="text-xs text-gray-500 line-through">
              {formatPrice(deal.originalPrice)}원
            </div>
          )}
        </div>

        {deal.rating > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <span>⭐ {deal.rating.toFixed(1)}</span>
            {deal.reviewCount > 0 && (
              <span>({deal.reviewCount.toLocaleString()})</span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}
