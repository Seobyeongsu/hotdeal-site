export interface ParsedTossDeal {
  name: string;
  title: string;
  image: string;
  description: string;
  rating: number | null;
  reviewCount: number | null;
  categoryName: string | null;
  rank: number | null;
  arrivalDate: string | null;
  merchant: string | null;
  url: string;
  canonicalUrl: string | null;
  source: string;
}

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export function isTossLink(url: string): boolean {
  return /^https?:\/\/(toss\.im|toss\.shopping)\//.test(url);
}

export function isCoupangLink(url: string): boolean {
  return /^https?:\/\/([a-z0-9-]+\.)?coupang\.com\//i.test(url);
}

function grab(str: string, re: RegExp): string | null {
  const m = str.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

function grabNum(str: string, re: RegExp): number | null {
  const m = str.match(re);
  return m ? Number(m[1]) : null;
}

export async function parseTossLink(shareUrl: string): Promise<ParsedTossDeal> {
  const res = await fetch(shareUrl, {
    headers: { 'User-Agent': MOBILE_UA, Accept: 'text/html' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`토스 페이지 로드 실패 (HTTP ${res.status})`);
  const html = await res.text();

  // JSON-LD (상품명/이미지/평점/리뷰)
  let ld: any = {};
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    try {
      ld = JSON.parse(ldMatch[1]);
    } catch {
      /* ignore */
    }
  }

  const name: string = ld.name || grab(html, /\\?"name\\?":\\?"([^"\\]+)/) || '';
  if (!name) throw new Error('상품 정보를 찾을 수 없습니다. 올바른 토스 쉐어링크인지 확인하세요.');

  const image: string = Array.isArray(ld.image) ? ld.image[0] : ld.image || '';
  const rating: number | null = ld.aggregateRating?.ratingValue
    ? Number(ld.aggregateRating.ratingValue)
    : null;
  const reviewCount: number | null = ld.aggregateRating?.reviewCount
    ? Number(ld.aggregateRating.reviewCount)
    : null;

  // Next.js flight 데이터에서 추가 정보 추출
  const categoryName = grab(html, /categoryName\\?":\\?"([^"\\]+)/);
  const rank = grabNum(html, /categoryRanking[\s\S]{0,120}?rank\\?":(\d+)/);
  const arrivalDate = grab(html, /arrivalDate\\?":\\?"([\d-]+)/);
  const merchant = grab(html, /merchant\\?":\{\\?"name\\?":\\?"([^"\\]+)/);
  const canonicalUrl = grab(html, /canonical[^{}]*?href\\?":\\?"(https:[^"\\]+)/);

  return {
    name,
    title: `토스)${name}`,
    image,
    description: ld.description || '',
    rating,
    reviewCount,
    categoryName,
    rank,
    arrivalDate,
    merchant,
    url: shareUrl,
    canonicalUrl,
    source: '토스',
  };
}
