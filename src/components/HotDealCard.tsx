'use client';

interface HotDeal {
  id: string;
  title: string;
  url: string;
  source: string;
  price: number | null;
  date: string;
  thumbnail: string | null;
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR');
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

function getSourceColor(source: string) {
  switch (source) {
    case '뽐뿌':
      return 'bg-red-600';
    case '클리앙':
      return 'bg-blue-600';
    case '쿨앤조이':
      return 'bg-green-600';
    case '에펨코리아':
      return 'bg-yellow-600';
    default:
      return 'bg-gray-600';
  }
}

export default function HotDealCard({ deal }: { deal: HotDeal }) {
  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 card-hover"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded ${getSourceColor(deal.source)}`}>
              {deal.source}
            </span>
            <span className="text-xs text-gray-500">{formatDate(deal.date)}</span>
          </div>

          <h3 className="font-medium text-white line-clamp-2 mb-2">
            {deal.title}
          </h3>

          {deal.price && (
            <div className="text-xl font-bold text-white">
              {formatPrice(deal.price)}원
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
